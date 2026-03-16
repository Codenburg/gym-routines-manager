"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

interface AuthGuardProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function AuthGuard({ children, adminOnly = true }: AuthGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/admin/login");
    } else if (!isPending && session && adminOnly) {
      const user = session.user as { admin?: boolean } | undefined;
      if (!user?.admin) {
        router.push("/");
      }
    }
  }, [session, isPending, router, adminOnly]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (adminOnly) {
    const user = session.user as { admin?: boolean } | undefined;
    if (!user?.admin) {
      return null;
    }
  }

  return <>{children}</>;
}
