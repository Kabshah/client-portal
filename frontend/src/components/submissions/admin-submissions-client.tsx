"use client";

import {
  AdminStatus,
  Submission,
  UpdateSubmissionStatusResponse,
} from "@/types/submission";
import { useState, useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import { ReadinessBadge } from "../shared/readiness-badge";
import AdminStatusBadge from "../shared/admin-status-badge";
import { formatDate } from "@/lib/utils";
import { Button } from "../ui/button";
import SubmissionDetails from "./submission-details-dialog";
import { clientApiFetch } from "@/lib/api/client";

// ─── Style constants (matches existing monochrome design system) ──────────────
const mainClass = "mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:py-10";
const pageHeaderClass = "grid gap-2";
const pageTitleClass = "text-3xl font-semibold tracking-tight";
const tableCardClass = "rounded-xl border border-border/80 shadow-xs bg-card overflow-hidden";
const tableCardContentClass = "p-0";
const tableScrollClass = "overflow-x-auto";
const tableClass = "w-full min-w-[900px] border-collapse text-sm";
const tableHeadClass =
  "border-b border-border/60 bg-muted/30 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground font-semibold";
const tableHeaderCellClass = "px-5 py-4 font-semibold";
const tableRowClass = "border-b border-border/60 last:border-b-0 hover:bg-muted/10 transition-colors";
const tableCellClass = "px-5 py-4 align-middle";
const mutedTableCellClass = "px-5 py-4 align-middle text-muted-foreground text-xs font-medium";
const clientInfoClass = "grid gap-0.5";
const clientNameClass = "font-bold text-foreground text-sm";
const clientEmailClass = "text-muted-foreground text-xs";
const tableActionsClass = "flex flex-wrap items-center gap-2";
const tableButtonClass = "h-8 rounded-lg px-3 text-xs font-medium shadow-xs";
const emptyStateClass = "px-6 py-10 text-center";
const emptyTitleClass = "text-lg font-medium tracking-tight";

// ─── Category filter options ──────────────────────────────────────────────────
const CATEGORIES = [
  { label: "All Packages", value: "" },
  { label: "Website / Landing Page", value: "landing" },
  { label: "Software / App", value: "software" },
  { label: "Automation / Ops", value: "automation" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

/** Loose match: category tab → service_package string from DB */
function matchesCategory(pkg: string, cat: CategoryValue): boolean {
  if (cat === "") return true;
  const lower = pkg.toLowerCase();
  if (cat === "landing")
    return lower.includes("landing") || lower.includes("website");
  if (cat === "software")
    return lower.includes("software") || lower.includes("app");
  if (cat === "automation")
    return lower.includes("automation") || lower.includes("ops");
  return false;
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({
  name,
  onCancel,
  onConfirm,
  loading,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl text-left">
        <p className="text-base font-bold tracking-tight text-foreground">
          Remove from queue?
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">{name}</span>
          {"'"}s submission will be hidden from your admin queue. The client
          can still view their proposal.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            className="rounded-lg text-xs font-medium h-8 px-3 shadow-xs"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-lg text-xs font-semibold h-8 px-3 shadow-xs"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Removing…" : "Remove"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function AdminSubmissionsClient({
  initialSubmissions,
}: {
  initialSubmissions: Submission[];
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  // Search & filter state
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryValue>("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Derived filtered list ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      const matchesSearch =
        q === "" ||
        s.client_name.toLowerCase().includes(q) ||
        s.client_email.toLowerCase().includes(q);
      return matchesSearch && matchesCategory(s.service_package, activeCategory);
    });
  }, [submissions, search, activeCategory]);

  // ─── Status update ──────────────────────────────────────────────────────
  async function updateStatus(id: string, adminStatus: AdminStatus) {
    try {
      setPendingStatusId(id);
      const response = await clientApiFetch<UpdateSubmissionStatusResponse>(
        `/admin/submissions/${id}/status`,
        { method: "PATCH", body: JSON.stringify({ admin_status: adminStatus }) },
      );
      setSubmissions((cur) =>
        cur.map((s) => (s.id === response.submission.id ? response.submission : s)),
      );
      setSelectedSubmission((cur) =>
        cur?.id === response.submission.id ? response.submission : cur,
      );
    } catch (err) {
      console.error(err);
    } finally {
      setPendingStatusId(null);
    }
  }

  // ─── Delete (soft) ──────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      setDeletingId(deleteTarget.id);
      await clientApiFetch(`/admin/submissions/${deleteTarget.id}`, {
        method: "DELETE",
      });
      // Optimistically remove from list
      setSubmissions((cur) => cur.filter((s) => s.id !== deleteTarget.id));
      if (selectedSubmission?.id === deleteTarget.id)
        setSelectedSubmission(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  }

  const hasFilters = search.trim() !== "" || activeCategory !== "";

  return (
    <main className={mainClass}>
      {/* Header */}
      <section className={pageHeaderClass}>
        <h1 className={pageTitleClass}>Onboarding Review Queue</h1>
      </section>

      {/* Search + Filter bar */}
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="relative w-64">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-border/80 bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        {/* Category filter dropdown */}
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value as CategoryValue)}
          className="h-10 rounded-lg border border-border/80 bg-background px-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer transition-all"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Result count + clear */}
      {hasFilters && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            Showing{" "}
            <span className="font-medium text-foreground">{filtered.length}</span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{submissions.length}</span>{" "}
            submissions
          </span>
          <button
            onClick={() => {
              setSearch("");
              setActiveCategory("");
            }}
            className="text-xs underline underline-offset-2 hover:text-foreground"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Table */}
      <Card className={tableCardClass}>
        <CardContent className={tableCardContentClass}>
          {filtered.length ? (
            <div className={tableScrollClass}>
              <table className={tableClass}>
                <thead className={tableHeadClass}>
                  <tr>
                    <th className={tableHeaderCellClass}>Client</th>
                    <th className={tableHeaderCellClass}>Service</th>
                    <th className={tableHeaderCellClass}>Readiness</th>
                    <th className={tableHeaderCellClass}>Review</th>
                    <th className={tableHeaderCellClass}>Created</th>
                    <th className={tableHeaderCellClass}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((submission) => {
                    const isPending = pendingStatusId === submission.id;
                    const isApproved = submission.admin_status === "approved";
                    const isRejected = submission.admin_status === "rejected";

                    return (
                      <tr className={tableRowClass} key={submission.id}>
                        {/* Client info */}
                        <td className={tableCellClass}>
                          <div className={clientInfoClass}>
                            <span className={clientNameClass}>
                              {submission.client_name}
                            </span>
                            <span className={clientEmailClass}>
                              {submission.client_email}
                            </span>
                          </div>
                        </td>

                        <td className={mutedTableCellClass}>
                          {submission.service_package}
                        </td>

                        <td className={tableCellClass}>
                          <ReadinessBadge status={submission.readiness_status} />
                        </td>

                        <td className={tableCellClass}>
                          <AdminStatusBadge status={submission.admin_status} />
                        </td>

                        <td className={mutedTableCellClass}>
                          {formatDate(submission.created_at)}
                        </td>

                        {/* Actions */}
                        <td className={tableCellClass}>
                          <div className={tableActionsClass}>
                            <Button
                              className="h-8 rounded-lg px-3 text-xs font-medium bg-muted hover:bg-accent text-foreground shadow-xs transition-colors"
                              type="button"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              View
                            </Button>
                            <Button
                              disabled={isPending || isApproved || isRejected}
                              className="h-8 rounded-lg px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50 transition-colors"
                              type="button"
                              onClick={() =>
                                updateStatus(submission.id, "approved")
                              }
                            >
                              {isApproved ? "Approved" : "Approve"}
                            </Button>
                            <Button
                              disabled={isPending || isApproved || isRejected}
                              className="h-8 rounded-lg px-3 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs disabled:opacity-50 transition-colors"
                              type="button"
                              onClick={() =>
                                updateStatus(submission.id, "rejected")
                              }
                            >
                              {isRejected ? "Rejected" : "Reject"}
                            </Button>
                            {/* Delete button — same size as sibling buttons */}
                            <Button
                              className="h-8 rounded-lg px-3 text-xs shadow-xs border border-border bg-background text-muted-foreground hover:border-red-200 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              variant="outline"
                              type="button"
                              title="Remove from queue"
                              onClick={() => setDeleteTarget(submission)}
                              disabled={deletingId === submission.id}
                            >
                              <svg
                                className="h-3.5 w-3.5 mr-1"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={emptyStateClass}>
              <p className={emptyTitleClass}>
                {hasFilters
                  ? "No submissions match your filters."
                  : "No submissions yet."}
              </p>
              {hasFilters && (
                <button
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("");
                  }}
                  className="mt-2 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission details dialog */}
      <SubmissionDetails
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        isAdmin={true}
      />

      {/* Delete confirm modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          name={deleteTarget.client_name}
          loading={deletingId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </main>
  );
}

export default AdminSubmissionsClient;
