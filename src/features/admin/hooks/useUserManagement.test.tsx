import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUserManagement } from "./useUserManagement";

const { mockToast, mockCreateAuditLog, mockAuthState } = vi.hoisted(() => ({
  mockToast: vi.fn(),
  mockCreateAuditLog: vi.fn(),
  mockAuthState: {
    user: { id: "admin-1" },
    session: { access_token: "token-1" },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@/hooks/useAuditLogs", () => ({
  createAuditLog: (...args: unknown[]) => mockCreateAuditLog(...args),
}));

function createJsonResponse(data: unknown) {
  return Promise.resolve({
    json: async () => data,
  } as Response);
}

describe("useUserManagement", () => {
  beforeEach(() => {
    mockCreateAuditLog.mockResolvedValue({});

    vi.stubGlobal(
      "fetch",
      vi.fn((input: URL | RequestInfo) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.includes("action=list")) {
          return createJsonResponse({
            users: [
              {
                id: "u1",
                email: "u1@example.com",
                roles: ["user"],
                profile: { full_name: "User One", username: "user1" },
              },
            ],
          });
        }

        if (url.includes("action=create")) {
          return createJsonResponse({ user: { id: "u2" } });
        }

        if (url.includes("action=delete")) {
          return createJsonResponse({ success: true });
        }

        if (url.includes("action=update")) {
          return createJsonResponse({ success: true });
        }

        return createJsonResponse({ success: true });
      }),
    );
  });

  it("loads users and supports create/delete flows", async () => {
    const { result } = renderHook(() => useUserManagement(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.users).toHaveLength(1);

    let createOk = false;
    await act(async () => {
      createOk = await result.current.createUser({
        email: "new@example.com",
        password: "Password123",
        full_name: "New User",
        role: "user",
        expires_at: null,
      });
    });

    expect(createOk).toBe(true);

    let deleteOk = false;
    await act(async () => {
      deleteOk = await result.current.deleteUser({
        id: "u1",
        email: "u1@example.com",
        profile: {
          user_id: "u1",
          full_name: "User One",
          username: "user1",
          email: "u1@example.com",
          expires_at: null,
        },
        roles: ["user"],
        created_at: "2026-01-01",
      });
    });

    expect(deleteOk).toBe(true);
    expect(mockCreateAuditLog).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalled();
  });

  it("updates role and refreshes users", async () => {
    const { result } = renderHook(() => useUserManagement(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleRoleChange("u1", "admin");
    });

    expect(mockCreateAuditLog).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalled();
  });
});
