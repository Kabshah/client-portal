"use client";

import { cn } from "@/lib/utils";
import { CreateSubmissionResponse } from "@/types/submission";
import { Button } from "../ui/button";
import { ChangeEvent, FormEvent, ReactNode, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { publicApiBaseUrl } from "@/lib/config";

const serviceOptions = [
  "Website / Landing Page",
  "Automation / Operations",
  "Software / App Development",
  "Other",
];

const assetOptions = ["Ready", "Partially Ready", "Not Ready"];

const ACCEPTED = ".png,.jpg,.jpeg,.gif,.webp,.pdf,.docx,.pptx,.xlsx,.txt";

const fieldClass = "grid gap-2";
const openButtonClass = "h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-5 text-sm font-semibold shadow-sm transition-all flex items-center gap-2";
const overlayClass =
  "fixed inset-0 z-50 overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-xs flex items-center justify-center";
const dialogCardClass =
  "mx-auto w-full max-w-4xl rounded-2xl border-border bg-card shadow-2xl overflow-hidden relative";
const dialogHeaderClass = "border-b border-border/60 pb-4 bg-muted/20 px-6 pt-6 pr-16";
const dialogTitleClass = "text-xl font-bold tracking-tight text-foreground";
const dialogContentClass = "p-6";
const formClass = "grid gap-5";
const formGridClass = "grid gap-5 md:grid-cols-2";
const selectClass =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const errorMessageClass =
  "rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400";
const formActionsClass = "flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-5 mt-4";
const submitButtonClass = "h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-6 text-sm font-semibold shadow-sm transition-all";

const hintClass = "text-xs text-muted-foreground";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Field({
  children,
  label,
  hint,
  optional,
}: {
  children: ReactNode;
  label: string;
  hint?: string;
  optional?: boolean;
}) {
  return (
    <section className={fieldClass}>
      <Label className="flex items-center gap-2">
        {label}
        {optional && (
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        )}
      </Label>
      {children}
      {hint && <p className={hintClass}>{hint}</p>}
    </section>
  );
}

// Multi-file and multi-link field component used for both Asset Files and Detailed Brief
function MultiMediaField({
  label,
  hint,
  optional,
  files,
  onAddFiles,
  onRemoveFile,
  links,
  onAddLink,
  onRemoveLink,
  fileInputRef,
  placeholderLinkText,
}: {
  label: string;
  hint: string;
  optional?: boolean;
  files: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  links: string[];
  onAddLink: (link: string) => void;
  onRemoveLink: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  placeholderLinkText: string;
}) {
  const [currentLink, setCurrentLink] = useState("");
  const [isAddingLink, setIsAddingLink] = useState(false);

  function handleLinkSubmit() {
    const trimmed = currentLink.trim();
    if (!trimmed) return;
    onAddLink(trimmed);
    setCurrentLink("");
    setIsAddingLink(false);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <section className="grid gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          {label}
          {optional && (
            <span className="text-xs font-normal text-muted-foreground">
              (optional)
            </span>
          )}
        </Label>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            + Upload Files
          </button>
          <button
            type="button"
            onClick={() => setIsAddingLink((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-colors",
              isAddingLink
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            + Add Link
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Inline Link Input */}
      {isAddingLink && (
        <div className="flex gap-2">
          <Input
            type="url"
            value={currentLink}
            onChange={(e) => setCurrentLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleLinkSubmit();
              }
            }}
            placeholder={placeholderLinkText}
            className="h-10 text-xs"
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            onClick={handleLinkSubmit}
            className="h-10 rounded-none px-4 text-xs font-medium shadow-none"
          >
            Add
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsAddingLink(false);
              setCurrentLink("");
            }}
            className="h-10 rounded-none px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Attached Items Container */}
      {files.length > 0 || links.length > 0 ? (
        <div className="flex flex-col gap-2.5 rounded-none border border-border bg-muted/10 p-3">
          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="grid gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Uploaded Files ({files.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-2 border border-border bg-background px-2.5 py-1 text-xs"
                  >
                    <span className="text-sm">📄</span>
                    <span className="max-w-[180px] sm:max-w-[240px] truncate font-medium text-foreground">
                      {f.name}
                    </span>
                    <span className="text-muted-foreground">
                      ({formatFileSize(f.size)})
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveFile(i)}
                      className="ml-1 text-muted-foreground transition-colors hover:text-red-600"
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attached Links List */}
          {links.length > 0 && (
            <div className="grid gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Drive & Public Links ({links.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {links.map((l, i) => (
                  <div
                    key={`${l}-${i}`}
                    className="flex items-center gap-2 border border-border bg-background px-2.5 py-1 text-xs"
                  >
                    <span className="text-sm">🔗</span>
                    <a
                      href={l}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-[200px] sm:max-w-[280px] truncate font-medium text-foreground hover:underline"
                    >
                      {l}
                    </a>
                    <button
                      type="button"
                      onClick={() => onRemoveLink(i)}
                      className="ml-1 text-muted-foreground transition-colors hover:text-red-600"
                      title="Remove link"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer items-center justify-center border border-dashed border-input bg-muted/10 py-3 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/30"
        >
          <span>Click to upload files, or click "+ Add Link" to attach Drive/Dropbox links.</span>
        </div>
      )}

      <p className={hintClass}>{hint}</p>
    </section>
  );
}

function CreateSubmissionClient({
  onCreated,
}: {
  onCreated: (payload: CreateSubmissionResponse) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Text fields
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [servicePackage, setServicePackage] = useState(serviceOptions[0]);
  const [projectGoal, setProjectGoal] = useState("");
  const [desiredTimeline, setDesiredTimeline] = useState("");
  const [assetsProvided, setAssetsProvided] = useState(assetOptions[0]);

  // Asset files and links (multiple)
  const [assetFiles, setAssetFiles] = useState<File[]>([]);
  const [assetLinks, setAssetLinks] = useState<string[]>([]);
  const assetFilesRef = useRef<HTMLInputElement | null>(null);

  // Brief files and links (multiple)
  const [briefFiles, setBriefFiles] = useState<File[]>([]);
  const [briefLinks, setBriefLinks] = useState<string[]>([]);
  const briefFilesRef = useRef<HTMLInputElement | null>(null);

  // Unsaved data prompt state
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);

  const hasEnteredData = Boolean(
    clientName.trim() ||
      clientEmail.trim() ||
      projectGoal.trim() ||
      desiredTimeline.trim() ||
      assetFiles.length > 0 ||
      assetLinks.length > 0 ||
      briefFiles.length > 0 ||
      briefLinks.length > 0,
  );

  function resetForm() {
    setClientName("");
    setClientEmail("");
    setServicePackage(serviceOptions[0]);
    setProjectGoal("");
    setDesiredTimeline("");
    setAssetsProvided(assetOptions[0]);
    setAssetFiles([]);
    setAssetLinks([]);
    setBriefFiles([]);
    setBriefLinks([]);
    if (assetFilesRef.current) assetFilesRef.current.value = "";
    if (briefFilesRef.current) briefFilesRef.current.value = "";
  }

  function forceClose() {
    if (isSubmitting) return;
    setShowDraftPrompt(false);
    setOpen(false);
    setError(null);
    resetForm();
  }

  function handleCloseAttempt() {
    if (isSubmitting) return;
    if (hasEnteredData) {
      setShowDraftPrompt(true);
    } else {
      forceClose();
    }
  }

  // ── Submit Request ────────────────────────────────────────────────────────
  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clientName.trim()) {
      setError("Client name is required.");
      return;
    }
    if (!clientEmail.trim()) {
      setError("Client email is required.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      setIsDrafting(false);

      const fd = new FormData();
      fd.append("client_name", clientName.trim());
      fd.append("client_email", clientEmail.trim().toLowerCase());
      fd.append("service_package", servicePackage);
      fd.append("project_goal", projectGoal.trim());
      fd.append("desired_timeline", desiredTimeline.trim());
      fd.append("assets_provided", assetsProvided);
      fd.append("is_draft", "false");

      // Multiple Asset Files
      assetFiles.forEach((f) => fd.append("asset_files", f));
      // Multiple Asset Links
      assetLinks.forEach((l) => fd.append("asset_links", l));

      // Multiple Brief Files
      briefFiles.forEach((f) => fd.append("brief_files", f));
      // Multiple Brief Links
      briefLinks.forEach((l) => fd.append("brief_links", l));
      if (briefLinks.length > 0) {
        fd.append("brief_link", briefLinks[0]);
      }

      const res = await fetch(`${publicApiBaseUrl}/submissions/`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) {
        let msg = `Request failed with status ${res.status}`;
        try {
          const payload = await res.json();
          if (payload?.message) msg = payload.message;
        } catch {}
        throw new Error(msg);
      }

      const response = (await res.json()) as CreateSubmissionResponse;
      onCreated(response);
      forceClose();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error && err.message === "Failed to fetch") {
        setError(
          "Network error (Failed to fetch). Please verify that the backend server is running at " +
            publicApiBaseUrl +
            " and accessible.",
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to submit onboarding request. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Save as Draft ────────────────────────────────────────────────────────
  async function handleSaveDraft() {
    try {
      setError(null);
      setIsSubmitting(true);
      setIsDrafting(true);

      const fd = new FormData();
      fd.append("client_name", clientName.trim() || "Draft Proposal");
      fd.append("client_email", clientEmail.trim().toLowerCase());
      fd.append("service_package", servicePackage);
      fd.append("project_goal", projectGoal.trim());
      fd.append("desired_timeline", desiredTimeline.trim());
      fd.append("assets_provided", assetsProvided);
      fd.append("is_draft", "true");

      // Multiple Asset Files
      assetFiles.forEach((f) => fd.append("asset_files", f));
      // Multiple Asset Links
      assetLinks.forEach((l) => fd.append("asset_links", l));

      // Multiple Brief Files
      briefFiles.forEach((f) => fd.append("brief_files", f));
      // Multiple Brief Links
      briefLinks.forEach((l) => fd.append("brief_links", l));
      if (briefLinks.length > 0) {
        fd.append("brief_link", briefLinks[0]);
      }

      const res = await fetch(`${publicApiBaseUrl}/submissions/`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) {
        let msg = `Request failed with status ${res.status}`;
        try {
          const payload = await res.json();
          if (payload?.message) msg = payload.message;
        } catch {}
        throw new Error(msg);
      }

      const response = (await res.json()) as CreateSubmissionResponse;
      onCreated(response);
      forceClose();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error && err.message === "Failed to fetch") {
        setError(
          "Network error (Failed to fetch). Please verify that the backend server is running at " +
            publicApiBaseUrl +
            " and accessible.",
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to save draft. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
      setIsDrafting(false);
    }
  }

  return (
    <>
      <Button className={openButtonClass} onClick={() => setOpen(true)}>
        New Onboarding Request
      </Button>
      {open ? (
        <div className={overlayClass}>
          <Card className={dialogCardClass}>
            {/* Top-right close (✕) cross icon */}
            <button
              type="button"
              onClick={handleCloseAttempt}
              disabled={isSubmitting}
              className="absolute top-5 right-6 z-20 inline-flex items-center justify-center p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors focus:outline-none cursor-pointer"
              title="Close proposal"
              aria-label="Close proposal"
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

            <CardHeader className={dialogHeaderClass}>
              <CardTitle className={dialogTitleClass}>
                Submit Onboarding Request
              </CardTitle>
            </CardHeader>
            <CardContent className={dialogContentClass}>
              <form onSubmit={handleFormSubmit} className={formClass}>
                {error ? <div className={errorMessageClass}>{error}</div> : null}

                <section className={formGridClass}>
                  {/* Name — required */}
                  <Field label="Client Name">
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Kabshah"
                      required
                    />
                  </Field>

                  {/* Email — required */}
                  <Field label="Client Email">
                    <Input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="kabshah@gmail.com"
                      required
                    />
                  </Field>

                  {/* Service */}
                  <Field label="Service / Package">
                    <select
                      className={selectClass}
                      value={servicePackage}
                      onChange={(e) => setServicePackage(e.target.value)}
                    >
                      {serviceOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {/* Timeline */}
                  <Field label="Desired Timeline">
                    <Input
                      value={desiredTimeline}
                      onChange={(e) => setDesiredTimeline(e.target.value)}
                      placeholder="4 weeks"
                      required
                    />
                  </Field>

                  {/* Asset readiness */}
                  <Field label="Assets Provided">
                    <select
                      className={selectClass}
                      value={assetsProvided}
                      onChange={(e) => setAssetsProvided(e.target.value)}
                    >
                      {assetOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                </section>

                {/* Project Goal */}
                <Field label="Project Goal">
                  <Textarea
                    rows={4}
                    value={projectGoal}
                    onChange={(e) => setProjectGoal(e.target.value)}
                    placeholder="We need a landing page redesign..."
                    required
                  />
                </Field>

                {/* Asset Files & Drive Links (Multiple) */}
                <MultiMediaField
                  label="Asset Files & Links"
                  hint="Upload logos, brand assets, mockups etc. or attach Google Drive / Figma / Dropbox links."
                  optional
                  files={assetFiles}
                  onAddFiles={(incoming) =>
                    setAssetFiles((prev) => [...prev, ...incoming])
                  }
                  onRemoveFile={(idx) =>
                    setAssetFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                  links={assetLinks}
                  onAddLink={(link) => setAssetLinks((prev) => [...prev, link])}
                  onRemoveLink={(idx) =>
                    setAssetLinks((prev) => prev.filter((_, i) => i !== idx))
                  }
                  fileInputRef={assetFilesRef}
                  placeholderLinkText="https://drive.google.com/... or Figma link"
                />

                {/* Detailed Brief Files & Drive Links (Multiple) */}
                <MultiMediaField
                  label="Detailed Brief"
                  hint="Upload brief documents (PDF, DOCX, PPTX...) or paste Google Drive / Dropbox / Notion links."
                  optional
                  files={briefFiles}
                  onAddFiles={(incoming) =>
                    setBriefFiles((prev) => [...prev, ...incoming])
                  }
                  onRemoveFile={(idx) =>
                    setBriefFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                  links={briefLinks}
                  onAddLink={(link) => setBriefLinks((prev) => [...prev, link])}
                  onRemoveLink={(idx) =>
                    setBriefLinks((prev) => prev.filter((_, i) => i !== idx))
                  }
                  fileInputRef={briefFilesRef}
                  placeholderLinkText="https://drive.google.com/... or Notion link"
                />

                {/* Footer Actions: Submit + Save as Draft */}
                <section className={formActionsClass}>
                  <Button
                    className={submitButtonClass}
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting && !isDrafting ? "Submitting…" : "Submit Request"}
                  </Button>
                  <Button
                    className="h-11 rounded-none border border-border bg-background px-5 text-sm font-medium text-foreground shadow-none hover:bg-muted"
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={handleSaveDraft}
                  >
                    {isSubmitting && isDrafting ? "Saving Draft…" : "Save as Draft"}
                  </Button>
                </section>
              </form>
            </CardContent>
          </Card>

          {/* Prompt modal when user closes with unsaved data */}
          {showDraftPrompt && (
            <div
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-md rounded-none border border-border bg-card p-6 shadow-2xl text-left">
                <div className="flex items-center gap-2 mb-2 text-foreground font-semibold text-lg">
                  <span className="text-xl">💾</span>
                  <span>Save as Draft?</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  You have entered onboarding information. Would you like to save your progress as a draft before leaving, or discard your changes?
                </p>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDraftPrompt(false);
                      forceClose();
                    }}
                    disabled={isSubmitting}
                    className="rounded-none border-border text-xs sm:text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  >
                    Discard Changes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowDraftPrompt(false)}
                    disabled={isSubmitting}
                    className="rounded-none text-xs sm:text-sm font-medium"
                  >
                    Keep Editing
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      setShowDraftPrompt(false);
                      await handleSaveDraft();
                    }}
                    disabled={isSubmitting}
                    className="rounded-none bg-primary text-primary-foreground text-xs sm:text-sm font-medium px-4"
                  >
                    {isDrafting ? "Saving..." : "Save as Draft"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}

export default CreateSubmissionClient;
