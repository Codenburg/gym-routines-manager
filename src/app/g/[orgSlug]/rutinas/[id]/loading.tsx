export default function PublicTenantRoutineDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-6 h-6 w-40 rounded bg-muted animate-pulse" />
        <div className="mb-8 h-10 w-72 rounded bg-muted animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}
