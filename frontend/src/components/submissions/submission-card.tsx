"use client";

import { Submission } from "@/types/submission";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ReadinessBadge } from "../shared/readiness-badge";
import { formatDate } from "@/lib/utils";
import AdminStatusBadge from "../shared/admin-status-badge";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";

const cardClass = "rounded-xl border border-border/80 bg-card shadow-xs hover:shadow-md hover:border-emerald-500/30 transition-all flex flex-col h-full overflow-hidden";

const cardHeaderClass = "gap-4 border-b border-border/60 pb-4 bg-muted/20 px-5 pt-5";

const headerContentClass = "flex items-start justify-between gap-4";

const clientInfoClass = "grid gap-1";

const clientNameClass = "text-lg font-bold tracking-tight text-foreground";

const clientEmailClass = "text-xs text-muted-foreground font-medium";

const cardContentClass = "grid gap-5 p-5 flex-1 flex flex-col";

const projectGoalClass =
  "line-clamp-2 text-sm leading-relaxed text-muted-foreground";

const metaSectionClass = "grid gap-2.5 border-t border-border/60 pt-4 text-xs";

const metaRowClass = "flex items-center justify-between gap-4";

const metaLabelClass = "text-muted-foreground font-medium";

const metaValueClass = "text-right text-foreground font-semibold";

function SubmissionCard({
  submission,
  onView,
  onDeleteDraft,
}: {
  submission: Submission;
  onView: (submission: Submission) => void;
  onDeleteDraft?: (submission: Submission) => void;
}) {
  return (
    <Card className={cardClass}>
      <CardHeader className={cardHeaderClass}>
        <section className={headerContentClass}>
          <div className={clientInfoClass}>
            <CardTitle className={clientNameClass}>
              {submission.client_name}
            </CardTitle>
            <p className={clientEmailClass}>{submission.client_email}</p>
          </div>

          <div className="flex items-center gap-2">
            {submission.is_draft ? (
              <>
                <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Draft
                </span>
                {onDeleteDraft && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDraft(submission);
                    }}
                    className="p-1 rounded-md text-muted-foreground transition-colors hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 focus:outline-none"
                    title="Delete Draft"
                    aria-label="Delete Draft"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </>
            ) : (
              <AdminStatusBadge status={submission.admin_status} />
            )}
          </div>
        </section>
      </CardHeader>

      <CardContent className={cardContentClass}>
        <p className={projectGoalClass}>
          {submission.project_goal || "No project goal entered yet."}
        </p>

        <section className={metaSectionClass}>
          <div className={metaRowClass}>
            <span className={metaLabelClass}>Service</span>
            <span className={metaValueClass}>{submission.service_package}</span>
          </div>
          <div className={metaRowClass}>
            <span className={metaLabelClass}>Created</span>
            <span className={metaValueClass}>
              {formatDate(submission.created_at)}
            </span>
          </div>
        </section>

        <div className="flex items-center gap-2 mt-auto pt-2">
          <Button
            onClick={() => onView(submission)}
            className="h-10 flex-1 rounded-lg px-4 text-xs font-semibold shadow-xs"
            type="button"
            variant={submission.is_draft ? "outline" : "default"}
          >
            {submission.is_draft ? "View Draft" : "View Details"}
          </Button>
          {submission.is_draft && onDeleteDraft && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDraft(submission);
              }}
              className="h-10 px-3 rounded-lg border border-border text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shadow-xs shrink-0"
              type="button"
              variant="outline"
              title="Delete Draft"
              aria-label="Delete Draft"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SubmissionCard;
