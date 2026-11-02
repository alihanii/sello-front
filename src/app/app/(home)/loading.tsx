import { ShellSkeleton } from "@/components/shell/ShellSkeleton";
import { DashboardSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return <ShellSkeleton><DashboardSkeleton /></ShellSkeleton>;
}
