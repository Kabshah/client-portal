export type ReadinessStatus = "ready" | "missing_info";
export type AdminStatus = "pending" | "approved" | "rejected";

export type Submission = {
  id: string;
  user_id: string;
  client_name: string;
  client_email: string;
  service_package: string;
  project_goal: string;
  desired_timeline: string;
  assets_provided: string;
  readiness_status: ReadinessStatus;
  missing_items: string[];
  ai_summary: string;
  recommended_next_action: string;
  admin_status: AdminStatus;
  asset_files: string[];
  asset_links: string[];
  brief_files: string[];
  brief_links: string[];
  brief_link: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateSubmissionInput = {
  client_name: string;
  client_email: string;
  service_package: string;
  project_goal: string;
  desired_timeline: string;
  assets_provided: string;
  // optional file fields handled via FormData, not stored in this type
};

export type CreateSubmissionResponse = {
  submission: Submission;
};

export type SubmissionsResponse = {
  submissions: Submission[];
};

export type UpdateSubmissionStatusResponse = {
  submission: Submission;
};
