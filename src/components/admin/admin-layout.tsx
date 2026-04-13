"use client";

import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { LogOut, User, Sun, Moon, House } from "lucide-react";
import { useThemeStore } from "@/store/theme-store";

interface AdminLayoutProps {
  children: React.ReactNode;
  username: string;
}

export function AdminLayout({ children, username }: AdminLayoutProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeStore();
  const userName = username;

  const handleSignOut = async () => {
    await Promise.all([
      signOut(),
      router.push("/admin/login"),
      router.refresh(),
    ]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden w-full h-14 border-b border-border flex items-center justify-between px-4 bg-background sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <AdminSidebar />
          <Link
            href="/admin"
            className="text-foreground font-bold text-lg tracking-tight hover:opacity-80 transition-opacity cursor-pointer"
          >
            Champion Gym
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary text-foreground">
              <User className="w-5 h-5" />
              <span className="font-medium text-sm">{userName}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                {theme === "dark" ? (
                  <>
                    <Sun className="w-5 h-5 mr-2" />
                    Modo Claro
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5 mr-2" />
                    Modo Oscuro
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="w-5 h-5 mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Desktop Sidebar + Content */}
      <div className="hidden lg:flex">
        <AdminSidebar />
        <div className="ml-64 flex-1">
          {/* Desktop simplified header */}
          <header className="w-full h-14 border-b border-border flex items-center justify-between px-6 bg-background sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <House className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary text-foreground">
                  <User className="w-5 h-5" />
                  <span className="font-medium text-sm">{userName}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                    {theme === "dark" ? (
                      <>
                        <Sun className="w-5 h-5 mr-2" />
                        Modo Claro
                      </>
                    ) : (
                      <>
                        <Moon className="w-5 h-5 mr-2" />
                        Modo Oscuro
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="w-5 h-5 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>

      {/* Mobile content - no sidebar offset */}
      <div className="lg:hidden p-4">{children}</div>
    </div>
  );
}