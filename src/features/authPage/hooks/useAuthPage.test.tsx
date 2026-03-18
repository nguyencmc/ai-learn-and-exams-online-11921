import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthPage } from "./useAuthPage";

const {
  mockNavigate,
  mockToast,
  mockSignIn,
  mockSignUp,
  mockResetPasswordForEmail,
  mockSignInWithOAuth,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockToast: vi.fn(),
  mockSignIn: vi.fn(),
  mockSignUp: vi.fn(),
  mockResetPasswordForEmail: vi.fn(),
  mockSignInWithOAuth: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    user: null,
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
      signInWithOAuth: mockSignInWithOAuth,
    },
  },
}));

describe("useAuthPage", () => {
  beforeEach(() => {
    mockSignIn.mockResolvedValue({ error: null });
    mockSignUp.mockResolvedValue({ error: null });
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    mockSignInWithOAuth.mockResolvedValue({ error: null });
  });

  it("validates login form before calling signIn", async () => {
    const { result } = renderHook(() => useAuthPage());

    await act(async () => {
      result.current.setEmail("invalid-email");
      result.current.setPassword("123");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockSignIn).not.toHaveBeenCalled();
    expect(result.current.errors.email).toBeTruthy();
    expect(result.current.errors.password).toBeTruthy();
  });

  it("submits register form and navigates on success", async () => {
    const { result } = renderHook(() => useAuthPage());

    await act(async () => {
      result.current.setMode("register");
      result.current.setEmail("new@example.com");
      result.current.setPassword("password123");
      result.current.setFullName("New User");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockSignUp).toHaveBeenCalledWith("new@example.com", "password123", "New User");
    expect(mockNavigate).toHaveBeenCalledWith("/");
    expect(mockToast).toHaveBeenCalled();
  });

  it("requires email for forgot password", async () => {
    const { result } = renderHook(() => useAuthPage());

    await act(async () => {
      result.current.setMode("forgot");
    });

    await act(async () => {
      await result.current.handleForgotPassword({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    expect(result.current.errors.email).toBe("Vui lòng nhập email");
  });
});
