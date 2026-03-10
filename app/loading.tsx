import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

function SkeletonCard() {
  return (
    <Card className="animate-pulse bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2">
            <div className="h-6 w-32 bg-slate-700/50 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-700/30 rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
          </div>
          <div className="h-6 w-16 bg-blue-500/20 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-700/30 rounded animate-pulse" style={{ animationDelay: '0.3s' }} />
          <div className="h-4 w-3/4 bg-slate-700/30 rounded animate-pulse" style={{ animationDelay: '0.4s' }} />
          <div className="h-4 w-1/2 bg-slate-700/30 rounded animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-4 w-20 bg-slate-700/30 rounded animate-pulse" style={{ animationDelay: '0.6s' }} />
      </CardFooter>
    </Card>
  );
}

export default function Loading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 0.1}s` }} className="animate-pulse">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}
