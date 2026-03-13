"use client";

import { useRouter } from "next/navigation";
import { RutinaForm } from "@/components/admin/rutina-form";

export function NuevaRutinaForm() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/admin/rutinas");
    router.refresh();
  };

  return <RutinaForm onSuccess={handleSuccess} />;
}
