import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="h-6 w-32 bg-slate-700 rounded" />
          <div className="h-5 w-16 bg-slate-700 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-4 w-full bg-slate-700 rounded mb-2" />
        <div className="h-4 w-3/4 bg-slate-700 rounded" />
      </CardContent>
      <CardFooter>
        <div className="h-4 w-16 bg-slate-700 rounded" />
      </CardFooter>
    </Card>
  );
}

export default function Loading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
