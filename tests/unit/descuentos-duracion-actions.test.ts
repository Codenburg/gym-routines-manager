import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetActiveMemberAuthContext,
  mockDescuentoDuracionCreate,
  mockDescuentoDuracionUpdateMany,
  mockDescuentoDuracionFindFirst,
  mockDescuentoDuracionDeleteMany,
  mockRevalidatePath,
  mockRevalidateTag,
} = vi.hoisted(() => ({
  mockGetActiveMemberAuthContext: vi.fn(),
  mockDescuentoDuracionCreate: vi.fn(),
  mockDescuentoDuracionUpdateMany: vi.fn(),
  mockDescuentoDuracionFindFirst: vi.fn(),
  mockDescuentoDuracionDeleteMany: vi.fn(),
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

vi.mock("@/lib/prisma", () => ({
  default: {
    descuentoDuracion: {
      create: (...args: unknown[]) => mockDescuentoDuracionCreate(...args),
      updateMany: (...args: unknown[]) => mockDescuentoDuracionUpdateMany(...args),
      findFirst: (...args: unknown[]) => mockDescuentoDuracionFindFirst(...args),
      deleteMany: (...args: unknown[]) => mockDescuentoDuracionDeleteMany(...args),
    },
  },
}));

import {
  createDescuentoDuracion,
  deleteDescuentoDuracion,
  updateDescuentoDuracion,
} from "@/app/actions/descuentos-duracion";

const activeOrganizationId = "org-active";
const previousFormState = { success: false };

function buildFormData() {
  const formData = new FormData();
  formData.set("meses", "12");
  formData.set("porcentaje", "20");
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetActiveMemberAuthContext.mockResolvedValue({
    session: {},
    role: "admin",
    activeOrganizationId,
  });
});

describe("descuentos-duracion actions — tenant-scoped writes", () => {
  it("creates duration discounts with the active organization id", async () => {
    mockDescuentoDuracionCreate.mockResolvedValue({
      id: 1,
      meses: 12,
      porcentaje: 20,
      gymId: activeOrganizationId,
    });

    const result = await createDescuentoDuracion(previousFormState, buildFormData());

    expect(mockDescuentoDuracionCreate).toHaveBeenCalledWith({
      data: {
        meses: 12,
        porcentaje: 20,
        gymId: activeOrganizationId,
      },
    });
    expect(result.success).toBe(true);
  });

  it("updates duration discounts only inside the active organization", async () => {
    mockDescuentoDuracionUpdateMany.mockResolvedValue({ count: 1 });
    mockDescuentoDuracionFindFirst.mockResolvedValue({
      id: 7,
      meses: 12,
      porcentaje: 25,
      gymId: activeOrganizationId,
    });

    const result = await updateDescuentoDuracion(7, previousFormState, buildFormData());

    expect(mockDescuentoDuracionUpdateMany).toHaveBeenCalledWith({
      where: { id: 7, gymId: activeOrganizationId },
      data: {
        meses: 12,
        porcentaje: 20,
      },
    });
    expect(mockDescuentoDuracionFindFirst).toHaveBeenCalledWith({
      where: { id: 7, gymId: activeOrganizationId },
    });
    expect(result.success).toBe(true);
  });

  it("deletes duration discounts only inside the active organization", async () => {
    mockDescuentoDuracionDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteDescuentoDuracion(7);

    expect(mockDescuentoDuracionDeleteMany).toHaveBeenCalledWith({
      where: { id: 7, gymId: activeOrganizationId },
    });
    expect(result.success).toBe(true);
  });
});
