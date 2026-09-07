"use client";

import { useState } from "react";
import CreateSubmissionClient from "./create-submission-dialog";
import { CreateSubmissionResponse, Submission } from "@/types/submission";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import SubmissionCard from "./submission-card";
import SubmissionDetails from "./submission-details-dialog";
import SubmissionSuccessDialog from "./submission-success-dialog";
import { publicApiBaseUrl } from "@/lib/config";

const mainClass = "mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:py-10";

const headerSectionClass =
  "flex flex-col gap-4 md:flex-row md:items-end md:justify-between";

const headerTextWrapperClass = "grid gap-2";

const pageTitleClass = "text-3xl font-semibold tracking-tight";

const pageDescriptionClass =
  "max-w-2xl text-base leading-7 text-muted-foreground";

const submissionsGridClass = "grid gap-4 md:grid-cols-2 xl:grid-cols-3";

const emptyCardClass = "rounded-xl border-border/80 bg-card shadow-xs";

const emptyCardContentClass = "px-6 py-10";

const emptyTitleClass = "text-lg font-medium tracking-tight";

const emptyDescriptionClass = "mt-2 text-base leading-7 text-muted-foreground";

function SubmissionPageClient({
  initialSubmissions,
}: {
  initialSubmissions: Submission[] | undefined;
}) {
  const [submissions, setSubmissions] = useState<Submission[]>(
    initialSubmissions ?? [],
  );
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [justCreatedSubmission, setJustCreatedSubmission] =
    useState<Submission | null>(null);

  // Draft deletion state
  const [draftToDelete, setDraftToDelete] = useState<Submission | null>(null);
  const [isDeletingDraft, setIsDeletingDraft] = useState(false);

  function handleCreated(payload: CreateSubmissionResponse) {
    setSubmissions((current) => [payload.submission, ...current]);
    // Only show submission success dialog for completed submissions, not drafts
    if (!payload.submission.is_draft) {
      setJustCreatedSubmission(payload.submission);
    }
  }

  async function confirmDeleteDraft() {
    if (!draftToDelete) return;
    try {
      setIsDeletingDraft(true);
      const res = await fetch(
        `${publicApiBaseUrl}/submissions/drafts/${draftToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (!res.ok) {
        let msg = `Failed to delete draft (${res.status})`;
        try {
          const body = await res.json();
          if (body?.message) msg = body.message;
        } catch {}
        throw new Error(msg);
      }
      setSubmissions((prev) =>
        prev.filter((item) => item.id !== draftToDelete.id),
      );
      if (selectedSubmission?.id === draftToDelete.id) {
        setSelectedSubmission(null);
      }
      setDraftToDelete(null);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to delete draft");
    } finally {
      setIsDeletingDraft(false);
    }
  }

  const submittedList = submissions.filter((item) => !item.is_draft);
  const draftsList = submissions.filter((item) => item.is_draft);

  return (
    <main className={mainClass}>
      <section className={headerSectionClass}>
        <div className={headerTextWrapperClass}>
          <h1 className={pageTitleClass}>My onboarding submissions</h1>
          <p className={pageDescriptionClass}>
            Submit your onboarding details and track the approval status of your
            requests from one page.
          </p>
        </div>
        <CreateSubmissionClient onCreated={handleCreated} />
      </section>

      {/* Drafted Section — separate from submitted section */}
      {draftsList.length > 0 && (
        <section className="grid gap-4 border-b border-border pb-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-semibold tracking-tight">
                  Drafted Proposals
                </h2>
                <span className="border border-border bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {draftsList.length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Saved drafts that have not been submitted for review yet. You can view or delete them.
              </p>
            </div>
          </div>

          <div className={submissionsGridClass}>
            {draftsList.map((item) => (
              <SubmissionCard
                onView={setSelectedSubmission}
                onDeleteDraft={setDraftToDelete}
                key={item.id}
                submission={item}
              />
            ))}
          </div>
        </section>
      )}

      {/* Submitted Proposals Section */}
      <section className="grid gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold tracking-tight">
                Submitted Requests
              </h2>
              <span className="border border-border bg-foreground px-2 py-0.5 text-xs font-semibold text-background">
                {submittedList.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Official submissions under review and processing.
            </p>
          </div>
        </div>

        {submittedList.length ? (
          <div className={submissionsGridClass}>
            {submittedList.map((item) => (
              <SubmissionCard
                onView={setSelectedSubmission}
                key={item.id}
                submission={item}
              />
            ))}
          </div>
        ) : (
          <Card className={emptyCardClass}>
            <CardContent className={emptyCardContentClass}>
              <p className={emptyTitleClass}>No submitted onboarding requests</p>
              <p className={emptyDescriptionClass}>
                Once you submit an onboarding request, it will appear here with real-time status tracking.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Full submission details modal */}
      <SubmissionDetails
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onDeleteDraft={setDraftToDelete}
      />

      {/* Success notification modal */}
      <SubmissionSuccessDialog
        submission={justCreatedSubmission}
        onClose={() => setJustCreatedSubmission(null)}
        onViewDetails={(submission) => {
          setJustCreatedSubmission(null);
          setSelectedSubmission(submission);
        }}
      />

      {/* Confirm Delete Draft Modal */}
      {draftToDelete && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => {
            if (!isDeletingDraft) setDraftToDelete(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-2 text-foreground font-semibold text-lg">
              <span className="text-xl">🗑️</span>
              <span>Delete Draft?</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete the draft for{" "}
              <strong className="text-foreground">
                {draftToDelete.client_name || "Untitled Draft"}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDraftToDelete(null)}
                disabled={isDeletingDraft}
                className="rounded-lg text-xs sm:text-sm font-medium h-9 px-4"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDeleteDraft}
                disabled={isDeletingDraft}
                className="rounded-lg text-xs sm:text-sm font-medium h-9 px-4"
              >
                {isDeletingDraft ? "Deleting…" : "Delete Draft"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default SubmissionPageClient;
