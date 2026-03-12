// Simplified admin layout - just render children, auth handled by pages

export default function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
