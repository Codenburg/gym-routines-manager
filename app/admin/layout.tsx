// Simplified admin layout - just render children, auth handled by pages

export default function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
