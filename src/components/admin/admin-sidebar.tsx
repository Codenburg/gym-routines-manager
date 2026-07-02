"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { showSuccess, showError } from "@/lib/toast";
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
  ExternalLink,
  Sun,
  Moon,
  LogOut,
  User,
  ChevronDown,
  Users,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  href: string;
  label: string;
  icon: typeof FileText;
  /**
   * True when the item is restricted to admins only.
   * Trainers see only items with `adminOnly: false` (or unset).
   * Defaults to false (visible to all admin roles).
   */
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
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
  {
    href: "/admin/trainers",
    label: "Entrenadores",
    icon: Users,
    adminOnly: true,
  },
  {
    href: "/admin/config",
    label: "Configuración",
    icon: Settings,
    adminOnly: true,
  },
];

// Filter nav items based on the active organization role.
function getVisibleNavItems(role?: string) {
  if (role === "trainer") {
    // Trainers see only items not flagged as admin-only.
    return navItems.filter((item) => !item.adminOnly);
  }
  // Admins see all items.
  return navItems;
}

function SidebarContent({
  onItemClick,
  username,
  role,
  gymName,
  publicSiteHref,
}: {
  onItemClick?: () => void;
  username?: string;
  role?: string;
  /**
   * Gym name resolved by the Server layout via the
   * `DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"` chain. Rendered in the
   * sidebar logo span. Never hardcode a specific brand name here —
   * the chain guarantees the value is already safe.
   */
  gymName: string;
  publicSiteHref: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useThemeStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const visibleNavItems = getVisibleNavItems(role);

  const handleSignOut = async () => {
    try {
      await Promise.all([
        signOut(),
        router.push("/admin/login"),
        router.refresh(),
      ]);
    } catch {
      showError("Error al cerrar sesión");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo/Title */}
      <div className="p-4 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-bold text-xl text-foreground uppercase">{gymName}</span>
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
        {visibleNavItems.map((item) => {
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
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger className="w-full p-4 flex items-center justify-between rounded-none hover:bg-accent transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-foreground" />
              <span className="text-sm font-medium text-foreground leading-none">
                {username}
              </span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", dropdownOpen ? "rotate-180" : "rotate-0")} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem
              onClick={() => {
                if (publicSiteHref) {
                  router.push(publicSiteHref);
                }
              }}
              disabled={!publicSiteHref}
              className="cursor-pointer"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Ver sitio público
            </DropdownMenuItem>
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

export function AdminSidebar({
  username,
  role,
  gymName,
  publicSiteHref,
}: {
  username?: string;
  role?: string;
  gymName: string;
  publicSiteHref: string | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top header — fixed bar with hamburger + gym name */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-background border-b border-border flex items-center px-4 gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="cursor-pointer -ml-2"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <span className="font-bold text-base text-foreground uppercase truncate">
          {gymName}
        </span>
      </header>

      {/* Mobile Drawer - Sheet wraps content */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent
            onItemClick={() => setMobileOpen(false)}
            username={username}
            role={role}
            gymName={gymName}
            publicSiteHref={publicSiteHref}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar - fixed left, always visible */}
      <aside
        className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-secondary border-r border-border z-30"
      >
        <SidebarContent
          username={username}
          role={role}
          gymName={gymName}
          publicSiteHref={publicSiteHref}
        />
      </aside>
    </>
  );
}
