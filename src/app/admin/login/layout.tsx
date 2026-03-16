import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Admin Panel",
  description: "Panel de Administración de Champion Gym",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}