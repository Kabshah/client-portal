"use client";

import { Submission } from "@/types/submission";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ReadinessBadge } from "../shared/readiness-badge";
import AdminStatusBadge from "../shared/admin-status-badge";
import { formatDate } from "@/lib/utils";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";

const detailRowClass =
  "grid gap-1 border-b border-border pb-3 last:border-b-0 last:pb-0";

const detailLabelClass =
  "text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground";

const detailValueClass = "text-sm leading-6 text-foreground";

const textBlockClass = "grid gap-2";

const textBlockTitleClass = "text-sm font-medium text-foreground";

const textBlockValueClass =
  "min-h-20 whitespace-pre-wrap border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground";

const overlayClass =
  "fixed inset-0 z-50 overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-xs flex items-center justify-center";

const dialogWrapperClass = "mx-auto w-full max-w-5xl my-auto";

const cardClass = "rounded-2xl border-border bg-card shadow-2xl overflow-hidden";

const cardHeaderClass = "gap-5 border-b border-border/60 pb-5 bg-muted/20 px-6 pt-6";

const headerContentClass =
  "flex flex-col gap-4 md:flex-row md:items-start md:justify-between";

const clientInfoClass = "grid gap-2";

const clientNameClass = "text-2xl font-semibold tracking-tight";

const clientEmailClass = "text-sm text-muted-foreground";

const badgeWrapperClass = "flex flex-wrap gap-2 md:justify-end";

const cardContentClass = "grid gap-6 pt-6";

const detailsGridClass = "grid gap-4 md:grid-cols-2 xl:grid-cols-3";

const aiSectionClass = "grid gap-4 border-t border-border pt-6 md:grid-cols-2";

const missingItemsSectionClass = "grid gap-3";

const missingItemsTitleClass = "text-sm font-medium text-foreground";

const missingItemsWrapperClass = "flex flex-wrap gap-2";

const missingItemClass =
  "border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800";

const emptyMissingItemsClass =
  "border border-border bg-muted/40 p-4 text-sm text-muted-foreground";

const footerClass = "flex justify-end border-t border-border pt-5";

const closeButtonClass =
  "h-11 rounded-none px-5 text-sm font-medium shadow-none";

function DetailRow({ value, label }: { label: string; value: string }) {
  return (
    <div className={detailRowClass}>
      <span className={detailLabelClass}>{label}</span>
      <span className={detailValueClass}>{value}</span>
    </div>
  );
}

function TextBlock({ title, value }: { title: string; value: string }) {
  return (
    <section className={textBlockClass}>
      <p className={textBlockTitleClass}>{title}</p>
      <div className={textBlockValueClass}>{value}</div>
    </section>
  );
}

function SubmissionDetails({
  submission,
  onClose,
  isAdmin = false,
  onDeleteDraft,
}: {
  submission: Submission | null;
  onClose: () => void;
  isAdmin?: boolean;
  onDeleteDraft?: (submission: Submission) => void;
}) {
  if (!submission) return null;

  return (
    <div className={overlayClass}>
      <div className={dialogWrapperClass}>
        <Card className={cardClass}>
          <CardHeader className={cardHeaderClass}>
            <div className={headerContentClass}>
              <div className={clientInfoClass}>
                <CardTitle className={clientNameClass}>
                  {submission?.client_name}
                </CardTitle>
                <p className={clientEmailClass}>{submission.client_email}</p>
              </div>
              <div className={badgeWrapperClass}>
                {submission.is_draft ? (
                  <span className="inline-flex items-center border border-border bg-muted/60 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Draft Proposal
                  </span>
                ) : (
                  <>
                    {isAdmin ? (
                      <ReadinessBadge status={submission.readiness_status} />
                    ) : null}
                    <AdminStatusBadge status={submission.admin_status} />
                  </>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-2 p-1 text-red-600 transition-colors hover:text-red-700 hover:bg-red-50 rounded-sm focus:outline-none"
                  title="Close details"
                  aria-label="Close details"
                >
                  <svg
                    className="h-5 w-5 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className={cardContentClass}>
            <section className={detailsGridClass}>
              <DetailRow label="Client Email" value={submission.client_email} />
              <DetailRow label="Service" value={submission.service_package} />
              <DetailRow label="Timeline" value={submission.desired_timeline} />
              <DetailRow label="Assets" value={submission.assets_provided} />
              <DetailRow
                label="Created"
                value={formatDate(submission.created_at)}
              />
              <DetailRow
                label="Updated"
                value={formatDate(submission.updated_at)}
              />
            </section>
            <TextBlock title="Project Goal" value={submission.project_goal} />

            {/* Asset Files & Links */}
            {((submission.asset_files && submission.asset_files.length > 0) ||
              (submission.asset_links && submission.asset_links.length > 0)) && (
              <section className="grid gap-3">
                <p className={textBlockTitleClass}>Asset Files & Links</p>
                <div className="flex flex-wrap gap-2">
                  {submission.asset_files?.map((url, i) => {
                    const name = url.split("/").pop() ?? `File ${i + 1}`;
                    return (
                      <a
                        key={url}
                        href={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"}${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-none border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                      >
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        {name.replace(/^\d+_/, "")}
                      </a>
                    );
                  })}

                  {submission.asset_links?.map((link, i) => (
                    <a
                      key={`asset-link-${i}`}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-none border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                    >
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      {link}
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Detailed Brief Files & Links */}
            {((submission.brief_files && submission.brief_files.length > 0) ||
              (submission.brief_links && submission.brief_links.length > 0) ||
              Boolean(submission.brief_link)) && (
              <section className="grid gap-3">
                <p className={textBlockTitleClass}>Detailed Brief</p>
                <div className="flex flex-wrap gap-2">
                  {/* Brief Files */}
                  {submission.brief_files?.map((url, i) => {
                    const name = url.split("/").pop() ?? `Brief ${i + 1}`;
                    return (
                      <a
                        key={url}
                        href={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"}${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-none border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                      >
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        {name.replace(/^\d+_/, "")}
                      </a>
                    );
                  })}

                  {/* Brief Links */}
                  {submission.brief_links?.map((link, i) => (
                    <a
                      key={`brief-link-${i}`}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-none border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                    >
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      {link}
                    </a>
                  ))}

                  {/* Fallback legacy single brief_link if not already in brief_links */}
                  {submission.brief_link &&
                    !(submission.brief_links || []).includes(submission.brief_link) &&
                    !(submission.brief_files || []).includes(submission.brief_link) && (
                      submission.brief_link.startsWith("http") ? (
                        <a
                          href={submission.brief_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-none border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                        >
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                          {submission.brief_link}
                        </a>
                      ) : (
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"}${submission.brief_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-none border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                        >
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          {submission.brief_link.split("/").pop()?.replace(/^\d+_/, "") ?? "Download Brief"}
                        </a>
                      )
                    )}
                </div>
              </section>
            )}


            {isAdmin ? (
              <>
                <section className={aiSectionClass}>
                  <TextBlock title="AI Summary" value={submission.ai_summary} />
                  <TextBlock
                    title="Recommended Next Action"
                    value={submission.recommended_next_action}
                  />
                </section>
                <section className={missingItemsSectionClass}>
                  <p className={missingItemsTitleClass}>Missing Items</p>
                  {submission.missing_items.length ? (
                    <div className={missingItemsWrapperClass}>
                      {submission.missing_items.map((missingItem) => (
                        <span className={missingItemClass} key={missingItem}>
                          {missingItem}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={emptyMissingItemsClass}>No missing items found</p>
                  )}
                </section>
              </>
            ) : null}

            <section className={footerClass}>
              {submission.is_draft && !isAdmin && onDeleteDraft && (
                <Button
                  className="h-11 rounded-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 mr-auto px-4 text-sm font-medium shadow-none"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    onClose();
                    onDeleteDraft(submission);
                  }}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete Draft
                </Button>
              )}
              <Button
                className={closeButtonClass}
                onClick={onClose}
                type="button"
              >
                Close
              </Button>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SubmissionDetails;
