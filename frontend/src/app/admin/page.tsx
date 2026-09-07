import SiteNavbar from "@/components/shared/site-navbar";
import AdminSubmissionsClient from "@/components/submissions/admin-submissions-client";
import { requireUser } from "@/lib/api/auth";
import { serverApifetch } from "@/lib/api/server";
import { SubmissionsResponse } from "@/types/submission";

async function AdminPage() {
  const user = await requireUser(["admin"]);

  const response =
    await serverApifetch<SubmissionsResponse>("/admin/submissions");

  return (
    <>
      <SiteNavbar user={user} />
      <AdminSubmissionsClient initialSubmissions={response.submissions} />
    </>
  );
}

export default AdminPage;
