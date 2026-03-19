/**
 * Auth Layout - Login page layout
 * 
 * Este layout es SIMPLE - no valida sesión.
 * El login page es público y debe ser accesible sin autenticación.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
