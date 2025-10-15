// src/test/AuthContext.test.tsx
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "../context/AuthContext";

// ✅ FIXED: Proper mock setup
vi.mock("../services/authService", () => ({
  authService: {
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn(),
    getToken: vi.fn(),
  },
}));

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it("should provide initial state", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.company).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should set auth data correctly", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const mockUser = {
      userID: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    };
    const mockCompany = {
      companyID: 1,
      companyName: "Test Co",
      currencySymbol: "$",
    };

    act(() => {
      result.current.setAuthData(mockUser, mockCompany, "fake-token", true);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.company).toEqual(mockCompany);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem("token")).toBe("fake-token");
  });

  it("should logout and clear data", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setAuthData(
        {
          userID: 1,
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
        { companyID: 1, companyName: "Test Co", currencySymbol: "$" },
        "fake-token",
        true
      );
    });

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem("token")).toBeNull();
  });

  it("should signup user and auto-login", async () => {
    const { authService } = await import("../services/authService");
    const mockSignup = vi.mocked(authService.signup);

    mockSignup.mockResolvedValue({
      token: "new-token",
      user: {
        userID: 2,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
      },
      company: {
        companyID: 2,
        companyName: "New Co",
        currencySymbol: "€",
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signup({
        FirstName: "Jane",
        LastName: "Doe",
        Email: "jane@example.com",
        Password: "password123",
        CompanyName: "New Co",
        Address: "123 Street",
        City: "City",
        ZipCode: "123456",
        Industry: "Tech",
        CurrencySymbol: "€",
      });
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe("jane@example.com");
    });
  });
});