"use client";

import { Submission } from "@/types/submission";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { CheckCircle2 } from "lucide-react";

const overlayClass =
  "fixed inset-0 z-50 overflow-y-auto bg-foreground/20 px-4 py-8 backdrop-blur-sm flex items-center justify-center";

const dialogCardClass =
  "w-full max-w-md rounded-none border-border shadow-lg bg-card text-center";

interface SubmissionSuccessDialogProps {
  submission: Submission | null;
  onClose: () => void;
  onViewDetails?: (submission: Submission) => void;
}

export default function SubmissionSuccessDialog({
  submission,
  onClose,
}: SubmissionSuccessDialogProps) {
  if (!submission) return null;

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card className={dialogCardClass}>
          <CardHeader className="pt-8 pb-3 flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mb-3">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Submission Successful!
            </h2>
          </CardHeader>

          <CardContent className="px-6 pb-8 pt-1 grid gap-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Thank you! Your onboarding request has been submitted successfully.
              Our team has received your details and will review your project shortly.
            </p>

            <Button
              type="button"
              className="h-11 w-full rounded-none text-sm font-medium shadow-none"
              onClick={onClose}
            >
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
