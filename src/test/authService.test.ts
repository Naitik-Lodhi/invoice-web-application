// src/test/authService.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "../services/authService";
import axiosInstance from "../api/axiosInstance";

// ✅ FIXED: Mock axios properly
vi.mock("../api/axiosInstance", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("login", () => {
    it("should call API with correct credentials", async () => {
      const mockPost = vi.mocked(axiosInstance.post);
      mockPost.mockResolvedValue({
        data: {
          token: "test-token",
          user: {
            userID: 1,
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
          },
          company: {
            companyID: 1,
            companyName: "Test Co",
            currencySymbol: "$",
          },
        },
      });

      await authService.login({
        email: "test@example.com",
        password: "password123",
        rememberMe: true,
      });

      expect(mockPost).toHaveBeenCalledWith("/Auth/Login", {
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should store token in localStorage when rememberMe is true", async () => {
      const mockPost = vi.mocked(axiosInstance.post);
      mockPost.mockResolvedValue({
        data: {
          token: "test-token",
          user: {
            userID: 1,
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
          },
          company: {
            companyID: 1,
            companyName: "Test Co",
            currencySymbol: "$",
          },
        },
      });

      await authService.login({
        email: "test@example.com",
        password: "password123",
        rememberMe: true,
      });

      expect(localStorage.getItem("token")).toBe("test-token");
      expect(sessionStorage.getItem("token")).toBeNull();
    });
  });

  describe("logout", () => {
    it("should clear all storage", () => {
      localStorage.setItem("token", "test-token");
      sessionStorage.setItem("user", "test-user");

      authService.logout();

      expect(localStorage.getItem("token")).toBeNull();
      expect(sessionStorage.getItem("user")).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when token exists in localStorage", () => {
      localStorage.setItem("token", "test-token");
      expect(authService.isAuthenticated()).toBe(true);
    });

    it("should return false when no token exists", () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});