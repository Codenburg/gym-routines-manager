"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogOut, User, ChevronDown, Sun, Moon, House } from "lucide-react";
import { useThemeStore } from "@/store/theme-store";

interface AdminLayoutProps {
  children: React.ReactNode;
  username: string; // Recibido del Server Layout - ya validado
}

export function AdminLayout({ children, username }: AdminLayoutProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeStore();
  const userName = username; // Ya viene validado del server

  const handleSignOut = async () => {
    // Store current name to avoid flash during redirect
    const currentName = userName;
    // Redirect immediately 
    await Promise.all([
      signOut(),
      router.push("/admin/login"),
      router.refresh()
    ]);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-4xl h-14 border-b border-[var(--card-border)] flex items-center justify-between px-4 bg-[var(--background)] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 hover:bg-[var(--button-secondary-bg)] rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <House className="w-5 h-5" />
          </Link>
        </div>

        <h1 className="text-[var(--foreground)] font-bold text-lg tracking-tight">Champion Gym</h1>

        <div className="flex items-center gap-2">
          <ProfileButton 
            userName={userName} 
            onSignOut={handleSignOut}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </div>
      </header>

      {/* Content */}
      <div className="w-full max-w-4xl p-4">{children}</div>
    </div>
  );
}

interface ProfileButtonProps {
  userName: string;
  onSignOut: () => Promise<void>;
  theme: string;
  onToggleTheme: () => void;
}

function ProfileButton({ userName, onSignOut, theme, onToggleTheme }: ProfileButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Menú de perfil"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--button-secondary-bg)] hover:opacity-80 text-[var(--button-secondary-foreground)] transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="font-medium text-sm">{userName}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 bg-[var(--background)] border border-[var(--card-border)] rounded-lg shadow-lg overflow-hidden"
        >
          <button
            role="menuitem"
            onClick={onToggleTheme}
            className="w-full flex items-center gap-2 px-4 py-3 text-[var(--foreground)] hover:bg-[var(--button-secondary-bg)] transition-colors"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-5 h-5" />
                Modo Claro
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                Modo Oscuro
              </>
            )}
          </button>
          <button
            role="menuitem"
            onClick={onSignOut}
            className="w-full flex items-center gap-2 px-4 py-3 text-[var(--foreground)] hover:bg-[var(--button-secondary-bg)] transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
