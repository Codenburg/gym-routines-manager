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
      {/* Mobile: floating hamburger top-left */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <AdminSidebar username={userName} />
      </div>

      {/* Desktop: sidebar h-screen, content offset */}
      <div className="hidden lg:flex">
        <AdminSidebar username={userName} />
        <div className="ml-64 flex-1 p-6">{children}</div>
      </div>

      {/* Mobile content */}
      <div className="lg:hidden p-4 pt-16">{children}</div>
    </div>
  );
}