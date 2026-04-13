"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import {
  FileText,
  Calendar,
  Tag,
  Clock,
  Plus,
  Menu,
  House,
  Sun,
  Moon,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  {
    href: "/admin/rutinas",
    label: "Rutinas",
    icon: FileText,
  },
  {
    href: "/admin/feriados",
    label: "Feriados",
    icon: Calendar,
  },
  {
    href: "/admin/promociones",
    label: "Promociones",
    icon: Tag,
  },
  {
    href: "/admin/descuentos-duracion",
    label: "Descuentos",
    icon: Clock,
  },
];

function SidebarContent({
  onItemClick,
  username,
}: {
  onItemClick?: () => void;
  username?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useThemeStore();

  const handleSignOut = async () => {
    await Promise.all([
      signOut(),
      router.push("/admin/login"),
      router.refresh(),
    ]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo/Title */}
      <div className="p-4 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <House className="w-5 h-5 text-foreground" />
          <span className="font-black text-xl text-foreground" style={{ fontFamily: 'var(--font-bebas-neue), sans-serif' }}>Champion Gym</span>
        </Link>
      </div>

      {/* Nueva Rutina Button */}
      <div className="p-4">
        <Link href="/admin/rutinas/new">
          <Button className="w-full cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Rutina
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors",
                isActive
                  ? "border-l-2 border-primary bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full p-4 flex items-center gap-3 rounded-none hover:bg-accent transition-colors cursor-pointer">
            <User className="w-5 h-5 text-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground text-left">
              {username}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
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
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
              <LogOut className="w-5 h-5 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function AdminSidebar({ username }: { username?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Drawer - Sheet wraps content */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent onItemClick={() => setMobileOpen(false)} username={username} />
        </SheetContent>
      </Sheet>

      {/* Hamburger Button - controls sheet state directly */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Desktop Sidebar - fixed left, always visible */}
      <aside
        className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-secondary border-r border-border z-30"
        style={{ top: "0px" }}
      >
        <SidebarContent username={username} />
      </aside>
    </>
  );
}