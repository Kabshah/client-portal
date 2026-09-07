package database

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// migrations folder k andr sy sari files sql wali utha krr iss migration variable ma save krr rhi hogi golang
//go:embed migrations/*.sql
var migrationFiles embed.FS

// prevents which migration has been done so prevent us from running same migration again and again
// dont run same migrations again and again
func RunMigrations(ctx context.Context, db *pgxpool.Pool) error {
	if _, err := db.Exec(ctx, `
	CREATE TABLE IF NOT EXISTS schema_migrations (
	version VARCHAR PRIMARY KEY,
	applied_at TIMESTAMP NOT NULL DEFAULT NOW()
	)
	`); err != nil {
		return fmt.Errorf("create schema_migrations table: %w", err)
	}

	// read all files from embeded migration folder
	entries, err := fs.ReadDir(migrationFiles, "migrations")
	if err != nil { // logging errors
		return fmt.Errorf("Read migrations dir: %w", err)
	}

	var filenames []string
	//The underscore _ is called the blank identifier.
	//Go does not allow unused variables. If you declare a variable for the index but never use it inside the loop, your code will fail to compile. Using _ discards the index because you only care about the actual file entry.
	for _, entry := range entries {
		// skip if any folder
		if entry.IsDir() {
			continue
		}
		if strings.HasSuffix(entry.Name(), ".sql") {
			filenames = append(filenames, entry.Name())
		}
	}
	sort.Strings(filenames)

	for _, filename := range filenames {
		var alreadyApplied bool
		if err := db.QueryRow(ctx, `
		SELECT EXISTS(
		SELECT 1
		FROM schema_migrations
		WHERE version = $1
		)
		`, filename).Scan(&alreadyApplied); err != nil {
			return fmt.Errorf("Check migration %s: %w", filename, err)
		}
		if alreadyApplied {
			continue
		}
		sqlBytes, err := migrationFiles.ReadFile("migrations/" + filename)
		if err != nil {
			return fmt.Errorf("Read migration %s:%w", filename, err)
		}
		// now starting our databse transactions
		// 1)run migration sql 2) record migration in this table schema_migrations
		tx, err := db.Begin(ctx)
		if err != nil {
			return fmt.Errorf("Begin tx")
		}

		//execute actual sql
		if _, err := tx.Exec(ctx, string(sqlBytes)); err != nil {
			// if there is an error we r going to rollback this transaction
			_ = tx.Rollback(ctx)
			return fmt.Errorf("execute migration %s:%w", filename, err)
		}
		// once success ful migration is done we need to record this in a migration file so that in schema migration table we aint running it once again
		if _, err := tx.Exec(ctx, `
		INSERT INTO schema_migrations (version)
		VALUES ($1)
		`, filename); err != nil {
			_ = tx.Rollback(ctx) // on err doing rollback
			return fmt.Errorf("Record migration %s:%w", filename, err)
		}
		// now commiting
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("Commit migration %s:%w", filename, err)
		}
	}
	return nil
}
