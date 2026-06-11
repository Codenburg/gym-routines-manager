import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getAdminSession } from "@/lib/admin-session";
import { getTrainers } from "@/app/actions/trainers";
import { TrainerManager } from "@/components/admin/trainer-manager";

// Only ADMIN can access this page. TRAINER is redirected to /admin/rutinas.
export default async function TrainersAdminPage() {
  // Parent layout already validated the session; this call is memoized
  // per request via React.cache(), so it dedupes with the layout's
  // auth.api.getSession call within the same render pass.
  const session = await getAdminSession();
  if (!isAdmin(session)) redirect("/admin/rutinas");

  const trainers = await getTrainers();

  return <TrainerManager initialTrainers={trainers} />;
}