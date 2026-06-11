import { Skeleton } from "@/components/ui/skeleton";

/**
 * AdminConfigSectionSkeleton — placeholder for a single config
 * section in the admin GymConfigManager. The real section is a
 * labeled card with a label + an input/textarea/sub-form.
 * The skeleton mirrors that footprint.
 */
export function AdminConfigSectionSkeleton() {
  return (
    <div className="bg-secondary border border-border rounded-xl p-4 space-y-3">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}
