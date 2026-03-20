import { DumbbellSpinner } from "@/components/ui/dumbbell-spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <DumbbellSpinner />
    </div>
  );
}
