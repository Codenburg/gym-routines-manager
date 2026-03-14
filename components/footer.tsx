"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/admin/login") return null;

  return (
    <footer className="border-t border-[var(--card-border)] bg-[var(--background)] py-8 mt-auto">
      <div className="container mx-auto px-8 max-w-5xl">
        <div className="flex items-center justify-between">
          <p className="text-[var(--muted)] text-sm text-center">
            © 2026 Codenburg
          </p>
          
          <div className="flex-1 flex justify-end">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--button-secondary-bg)] hover:opacity-80 text-[var(--button-secondary-foreground)] rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Administradores
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
