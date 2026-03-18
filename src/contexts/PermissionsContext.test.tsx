import { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionsProvider, usePermissionsContext } from "./PermissionsContext";

const { mockUseAuth, mockEq, mockSelect, mockFrom, mockRpc } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockEq: vi.fn(),
  mockSelect: vi.fn(),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
  },
}));

describe("PermissionsContext", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PermissionsProvider>{children}</PermissionsProvider>
  );

  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });

    mockEq.mockResolvedValue({
      data: [{ role: "admin" }, { role: "teacher" }],
      error: null,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    mockRpc.mockResolvedValue({
      data: [
        { permission_name: "course.edit", permission_category: "course" },
        { permission_name: "course.delete_own", permission_category: "course" },
      ],
      error: null,
    });
  });

  it("returns empty permissions when no user", async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => usePermissionsContext(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.roles).toEqual([]);
    expect(result.current.permissions).toEqual([]);
    expect(result.current.isAdmin).toBe(false);
  });

  it("computes roles and permission helpers", async () => {
    const { result } = renderHook(() => usePermissionsContext(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isTeacher).toBe(true);
    expect(result.current.hasRole("moderator")).toBe(false);
    expect(result.current.hasPermission("course.edit")).toBe(true);
    expect(result.current.hasAnyPermission(["x", "course.edit"])).toBe(true);
    expect(result.current.hasAllPermissions(["course.edit", "course.delete_own"])).toBe(true);
    expect(result.current.canEditOwn("course", "other-user")).toBe(true);
    expect(result.current.canDeleteOwn("course", "user-1")).toBe(true);
  });
});
