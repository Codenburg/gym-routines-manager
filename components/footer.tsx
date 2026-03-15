"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/admin/login") return null;

  return (
    <footer className="border-t border-[var(--card-border)] bg-[var(--background)] py-6 mt-auto">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="order-2 sm:order-1">
            <p className="text-[var(--muted)] text-sm">
              © 2026 Codenburg
            </p>
          </div>
          
          <div className="order-1 sm:order-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--button-secondary-bg)] hover:opacity-80 text-[var(--button-secondary-foreground)] rounded-lg transition-colors text-sm"
            >
              <Lock className="w-4 h-4" />
              Administradores
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
