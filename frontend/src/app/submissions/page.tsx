import SiteNavbar from "@/components/shared/site-navbar";
import SubmissionPageClient from "@/components/submissions/submissions-page-client";
import { requireUser } from "@/lib/api/auth";
import { serverApifetch } from "@/lib/api/server";
import { SubmissionsResponse } from "@/types/submission";
import { redirect } from "next/navigation";

async function SubmissionsPage() {
  const user = await requireUser(["user"]);

  if (user?.role === "admin") {
    redirect("/admin");
  }

  const response = await serverApifetch<SubmissionsResponse>("/submissions/");

  return (
    <>
      <SiteNavbar user={user} />
      <SubmissionPageClient initialSubmissions={response?.submissions} />
    </>
  );
}

export default SubmissionsPage;
