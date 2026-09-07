import { AdminStatus } from "@/types/submission";
import { Badge } from "../ui/badge";

const labels: Record<AdminStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

function AdminStatusBadge({ status }: { status: AdminStatus }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        {labels[status]}
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        {labels[status]}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
      {labels[status]}
    </span>
  );
}

export default AdminStatusBadge;
