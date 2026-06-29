import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username, organization } from "better-auth/plugins";
import bcrypt from "bcrypt";
import prisma from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // Validar DNI como username (7-8 dígitos)
    emailValidator: (email: string) => {
      // Por ahora aceptamos cualquier email válido
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 12);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  // Plugins: username + organization (multi-tenant)
  plugins: [
    username(),
    organization({
      // Only super-admins (isSuperAdmin) can create organizations
      allowUserToCreateOrganization: async (user) => {
        return (user as any)?.isSuperAdmin === true;
      },
    }),
  ],
  // Database hooks — Better Auth pattern for cross-cutting concerns at the
  // DB layer. We use session.create.before to auto-set activeOrganizationId
  // on first login for single-org users.
  //
  // Better Auth's organization plugin doesn't auto-set active org on
  // login — it requires an explicit POST /organization/set-active. For
  // gym users (one org each), this hook reads the user's first Member
  // entry and sets it as active. Persisted on Session.activeOrganizationId.
  //
  // Tomás (super-admin, no Member) has no memberships → activeOrganizationId
  // stays null → all helpers return false → fail-closed.
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const firstMembership = await prisma.member.findFirst({
            where: { userId: session.userId },
            orderBy: { createdAt: "asc" },
            select: { organizationId: true },
          });
          if (!firstMembership) {
            return { data: session }; // No membership → leave activeOrganizationId null
          }
          return {
            data: {
              ...session,
              activeOrganizationId: firstMembership.organizationId,
            },
          };
        },
      },
    },
  },
  user: {
    // isSuperAdmin is already defined in the Prisma schema @default(false)
    // No additional fields needed — Better Auth infers all User columns
    // from the Prisma model via the adapter.
  },
  // Disable public sign-up - only admins can create users via internal APIs
  disabledPaths: ["/sign-up/email"],
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
export type MemberRole = "admin" | "trainer";

export interface ActiveMemberAuthContext {
  session: Session;
  role: MemberRole;
  activeOrganizationId: string;
}

// ============================================================
//  MULTI-TENANT ROLE HELPERS
//  All helpers are async because they query the DB for the
//  current user's Member record in the active organization.
//  They take headers (not session) because Better Auth's API
//  needs the request headers to read the session cookie + activeOrganizationId.
//
//  Product behavior only recognizes Member.role values "admin" and "trainer".
//  Any stored "member" or unsupported role has no permissions and fails closed.
//
//  activeOrganizationId is auto-populated by the databaseHooks.session.create
//  hook at sign-in time (see top of file). For super-admin Tomás, who
//  has no membership in any org, it stays null → fail-closed.
//
//  Fail-closed behavior:
//  - No session → returns false / throws "Unauthorized"
//  - No active organization (e.g. Tomás before any /superadmin route) → false
//  - User not a member of the active org (e.g. user removed from org) → false
//
//  IMPORTANT: helpers check the CURRENT user's role in the ACTIVE org.
//  They do NOT check isSuperAdmin. A super-admin without an active org
//  returns false for all helpers → blocked from org-level routes (fail-closed).
// ============================================================

/**
 * Internal: resolve the current user's role in the active organization.
 * Returns null when any precondition fails (no session, no active org,
 * user is not a member of the active org).
 *
 * activeOrganizationId is auto-set by the databaseHooks.session.create.before
 * hook at sign-in time (see top of file). For super-admin Tomás (no
 * memberships), it stays null → fail-closed.
 *
 * Uses a direct Prisma query instead of auth.api.getActiveMember / getActiveMemberRole
 * because those Better Auth endpoints THROW on missing conditions
 * (NO_ACTIVE_ORGANIZATION, MEMBER_NOT_FOUND) — we want fail-closed
 * silent behavior, not exceptions to handle.
 */
export async function getActiveMemberAuthContext(headers: Headers): Promise<ActiveMemberAuthContext | null> {
  let session: Awaited<ReturnType<typeof auth.api.getSession>>;
  try {
    session = await auth.api.getSession({ headers });
  } catch {
    return null; // Invalid session cookie / signing error
  }
  if (!session) return null;

  const activeOrgId = session.session.activeOrganizationId;
  if (!activeOrgId) return null;

  let member: { role: string } | null;
  try {
    member = await prisma.member.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: activeOrgId,
        },
      },
      select: { role: true },
    });
  } catch {
    return null; // DB outage, network error, etc. — fail-closed
  }

  if (member?.role !== "admin" && member?.role !== "trainer") {
    return null;
  }

  return {
    session,
    role: member.role,
    activeOrganizationId: activeOrgId,
  };
}

async function resolveMemberRole(headers: Headers): Promise<MemberRole | null> {
  return (await getActiveMemberAuthContext(headers))?.role ?? null;
}

export async function isAdmin(headers: Headers): Promise<boolean> {
  const role = await resolveMemberRole(headers);
  return role === "admin";
}

export async function isTrainer(headers: Headers): Promise<boolean> {
  const role = await resolveMemberRole(headers);
  return role === "trainer";
}

export async function isAdminOrTrainer(headers: Headers): Promise<boolean> {
  const role = await resolveMemberRole(headers);
  return role === "admin" || role === "trainer";
}

export async function hasRole(headers: Headers, role: string): Promise<boolean> {
  return (await resolveMemberRole(headers)) === role;
}

export async function verifyAdmin(headers: Headers): Promise<void> {
  if (!(await isAdmin(headers))) {
    throw new Error("Unauthorized: Admin access required");
  }
}

export async function verifyTrainer(headers: Headers): Promise<void> {
  if (!(await isTrainer(headers))) {
    throw new Error("Unauthorized: Trainer access required");
  }
}

export async function verifyAdminOrTrainer(headers: Headers): Promise<void> {
  if (!(await isAdminOrTrainer(headers))) {
    throw new Error("Unauthorized: Admin or Trainer access required");
  }
}

/**
 * Public: get the current member's role in the active organization.
 * Returns null if there's no session, no active org, or no membership.
 * Used by callers that need to pass `role` down to client components
 * (e.g. admin/layout.tsx → AdminSidebar for nav filtering).
 */
export async function getActiveMemberRole(headers: Headers): Promise<string | null> {
  return resolveMemberRole(headers);
}
