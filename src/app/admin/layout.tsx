"use client";

import { AdminLayout as AdminLayoutComponent } from "@/components/admin/admin-layout";
import { usePathname } from "next/navigation";

export default function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Skip header for login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  
  return <AdminLayoutComponent>{children}</AdminLayoutComponent>;
}
