"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FileText,
  Calendar,
  Tag,
  Clock,
  Plus,
  Menu,
  House,
} from "lucide-react";

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

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo/Title */}
      <div className="p-4 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <House className="w-5 h-5 text-foreground" />
          <span className="font-bold text-lg text-foreground">Champion Gym</span>
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
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Drawer - Sheet wraps content */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent onItemClick={() => setMobileOpen(false)} />
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
        <SidebarContent />
      </aside>
    </>
  );
}