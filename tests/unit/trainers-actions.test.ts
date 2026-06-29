import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const {
  mockGetActiveMemberAuthContext,
  mockMemberFindMany,
  mockMemberFindFirst,
  mockMemberFindUnique,
  mockMemberCreate,
  mockMemberDelete,
  mockUserFindFirst,
  mockUserCreate,
  mockUserUpdate,
  mockAccountCreate,
  mockAccountFindFirst,
  mockAccountUpdate,
  mockPrismaTransaction,
  mockBcryptHash,
  mockRevalidatePath,
  mockRevalidateTag,
} = vi.hoisted(() => ({
  mockGetActiveMemberAuthContext: vi.fn(),
  mockMemberFindMany: vi.fn(),
  mockMemberFindFirst: vi.fn(),
  mockMemberFindUnique: vi.fn(),
  mockMemberCreate: vi.fn(),
  mockMemberDelete: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockUserCreate: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockAccountCreate: vi.fn(),
  mockAccountFindFirst: vi.fn(),
  mockAccountUpdate: vi.fn(),
  mockPrismaTransaction: vi.fn(),
  mockBcryptHash: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockRevalidateTag: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}));

vi.mock("@/lib/auth", () => ({
  getActiveMemberAuthContext: (...args: unknown[]) => mockGetActiveMemberAuthContext(...args),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: (...args: unknown[]) => mockBcryptHash(...args),
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    $transaction: (...args: unknown[]) => mockPrismaTransaction(...args),
    member: {
      findMany: (...args: unknown[]) => mockMemberFindMany(...args),
      findFirst: (...args: unknown[]) => mockMemberFindFirst(...args),
      findUnique: (...args: unknown[]) => mockMemberFindUnique(...args),
      create: (...args: unknown[]) => mockMemberCreate(...args),
      delete: (...args: unknown[]) => mockMemberDelete(...args),
    },
    user: {
      findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    account: {
      create: (...args: unknown[]) => mockAccountCreate(...args),
      findFirst: (...args: unknown[]) => mockAccountFindFirst(...args),
      update: (...args: unknown[]) => mockAccountUpdate(...args),
    },
  },
}));

import { createTrainer, deleteTrainer, getTrainers, updateTrainer } from "@/app/actions/trainers";

const activeOrganizationId = "org-active";
const previousFormState = { success: false };

function buildTrainerFormData() {
  const formData = new FormData();
  formData.set("username", "12345678");
  formData.set("name", "Trainer One");
  formData.set("password", "StrongPass123");
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetActiveMemberAuthContext.mockResolvedValue({
    session: {},
    role: "admin",
    activeOrganizationId,
  });
  mockBcryptHash.mockResolvedValue("hashed-password");
  mockPrismaTransaction.mockImplementation(async (callback) =>
    callback({
      user: { create: mockUserCreate },
      account: { create: mockAccountCreate },
      member: { create: mockMemberCreate },
    })
  );
});

describe("trainer actions — organization-scoped trainers", () => {
  it("lists only trainer members from the active organization", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    mockMemberFindMany.mockResolvedValue([
      {
        user: {
          id: "trainer-1",
          username: "12345678",
          name: "Trainer One",
          createdAt,
        },
      },
    ]);

    const result = await getTrainers();

    expect(mockMemberFindMany).toHaveBeenCalledWith({
      where: {
        organizationId: activeOrganizationId,
        role: "trainer",
        user: { deletedAt: null },
      },
      select: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    });
    expect(result).toEqual([
      {
        id: "trainer-1",
        username: "12345678",
        name: "Trainer One",
        createdAt,
      },
    ]);
  });

  it("fails closed when updating a user without trainer membership in the active organization", async () => {
    mockMemberFindFirst.mockResolvedValue(null);

    const result = await updateTrainer("user-1", { name: "Updated Trainer" });

    expect(result).toEqual({ success: false, message: "Entrenador no encontrado" });
    expect(mockMemberFindFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        organizationId: activeOrganizationId,
        role: "trainer",
        user: { deletedAt: null },
      },
      select: { userId: true },
    });
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(mockAccountUpdate).not.toHaveBeenCalled();
  });

  it("links an existing user from another organization as a trainer in the active organization", async () => {
    mockUserFindFirst.mockResolvedValue({ id: "user-1", username: "12345678", name: "Trainer One" });
    mockMemberFindUnique.mockResolvedValue(null);
    mockMemberCreate.mockResolvedValue({ id: "membership-1" });

    const result = await createTrainer(previousFormState, buildTrainerFormData());

    expect(result).toEqual({
      success: true,
      data: { id: "user-1", username: "12345678", name: "Trainer One" },
      message: "Entrenador creado exitosamente",
    });
    expect(mockMemberFindUnique).toHaveBeenCalledWith({
      where: {
        userId_organizationId: {
          userId: "user-1",
          organizationId: activeOrganizationId,
        },
      },
      select: { role: true },
    });
    expect(mockMemberCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        organizationId: activeOrganizationId,
        role: "trainer",
      },
    });
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  it("rejects an existing active-organization trainer as a duplicate", async () => {
    mockUserFindFirst.mockResolvedValue({ id: "user-1", username: "12345678", name: "Trainer One" });
    mockMemberFindUnique.mockResolvedValue({ role: "trainer" });

    const result = await createTrainer(previousFormState, buildTrainerFormData());

    expect(result).toEqual({
      success: false,
      errors: { username: ["Este DNI ya está registrado como entrenador"] },
      message: "El entrenador ya existe",
    });
    expect(mockMemberCreate).not.toHaveBeenCalled();
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  it("does not demote or change an existing active-organization non-trainer membership", async () => {
    mockUserFindFirst.mockResolvedValue({ id: "user-1", username: "12345678", name: "Admin One" });
    mockMemberFindUnique.mockResolvedValue({ role: "admin" });

    const result = await createTrainer(previousFormState, buildTrainerFormData());

    expect(result).toEqual({
      success: false,
      errors: { username: ["Este usuario ya pertenece a la organización"] },
      message: "El usuario ya pertenece a la organización",
    });
    expect(mockMemberCreate).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  it("creates a new trainer user, account, and member in a transaction", async () => {
    mockUserFindFirst.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ id: "new-user-1", username: "12345678", name: "Trainer One" });
    mockAccountCreate.mockResolvedValue({ id: "account-1" });
    mockMemberCreate.mockResolvedValue({ id: "membership-1" });

    const result = await createTrainer(previousFormState, buildTrainerFormData());

    expect(result).toEqual({
      success: true,
      data: { id: "new-user-1", username: "12345678", name: "Trainer One" },
      message: "Entrenador creado exitosamente",
    });
    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
    expect(mockUserCreate).toHaveBeenCalledWith({
      data: {
        username: "12345678",
        dni: "12345678",
        name: "Trainer One",
      },
    });
    expect(mockAccountCreate).toHaveBeenCalledWith({
      data: {
        userId: "new-user-1",
        accountId: "12345678",
        providerId: "credential",
        providerType: "credential",
        password: "hashed-password",
      },
    });
    expect(mockMemberCreate).toHaveBeenCalledWith({
      data: {
        userId: "new-user-1",
        organizationId: activeOrganizationId,
        role: "trainer",
      },
    });
  });

  it("deletes only the trainer Member row and does not delete or soft-delete the User", async () => {
    mockMemberFindFirst.mockResolvedValue({ id: "membership-1" });
    mockMemberDelete.mockResolvedValue({ id: "membership-1" });

    const result = await deleteTrainer("trainer-1");

    expect(result).toEqual({ success: true, message: "Entrenador eliminado exitosamente" });
    expect(mockMemberFindFirst).toHaveBeenCalledWith({
      where: {
        userId: "trainer-1",
        organizationId: activeOrganizationId,
        role: "trainer",
        user: { deletedAt: null },
      },
      select: { id: true },
    });
    expect(mockMemberDelete).toHaveBeenCalledWith({ where: { id: "membership-1" } });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("does not keep legacy user-role trainer semantics in the action source", () => {
    const source = readFileSync(join(process.cwd(), "src/app/actions/trainers.ts"), "utf8");
    const legacyTrainerRole = new RegExp("role\\s*:\\s*['\\\"]" + ["TRAIN", "ER"].join("") + "['\\\"]");
    const legacyUserRole = new RegExp("role\\s*:\\s*['\\\"]" + ["US", "ER"].join("") + "['\\\"]");
    const legacyUserRoleProperty = new RegExp("User" + "\\.role");

    expect(source).not.toMatch(legacyTrainerRole);
    expect(source).not.toMatch(legacyUserRole);
    expect(source).not.toMatch(legacyUserRoleProperty);
  });
});
