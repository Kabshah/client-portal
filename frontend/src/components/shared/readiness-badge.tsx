import { ReadinessStatus } from "@/types/submission";
import { Badge } from "../ui/badge";

const labels: Record<ReadinessStatus, string> = {
  ready: "Ready",
  missing_info: "Missing info",
};

export function ReadinessBadge({ status }: { status: ReadinessStatus }) {
  if (status === "ready") {
    return <Badge variant="default">{labels[status]}</Badge>;
  }

  return <Badge variant="destructive">{labels[status]}</Badge>;
}
