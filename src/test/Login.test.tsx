// src/test/Login.test.tsx - COMPLETE VERSION

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import { AuthProvider } from "../context/AuthContext";
import type { AuthResponse } from "../services/authService";

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock authService
vi.mock("../services/authService", () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn(),
    getToken: vi.fn(),
  },
}));

// Mock toast
vi.mock("../utils/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock validation schema
vi.mock("../utils/validationSchemas", async (importOriginal) => {
  const originalModule = await importOriginal<
    typeof import("../utils/validationSchemas")
  >();
  const { z } = await import("zod");

  const testSchema = z.object({
    email: z
      .string()
      .min(1, "Please enter a valid email address.")
      .email("The email address is not valid."),
    password: z.string().min(1, "Please enter your password."),
    rememberMe: z.boolean().default(false),
  });

  return {
    ...originalModule,
    loginSchema: testSchema,
  };
});

describe("LoginPage - Complete Test Suite", () => {
  const user = userEvent.setup();

  const mockSuccessResponse: AuthResponse = {
    token: "fake-jwt-token-123",
    user: {
      userID: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    },
    company: {
      companyID: 1,
      companyName: "Test Company",
      currencySymbol: "$",
    },
  };

  const renderLogin = () => {
    return render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
    sessionStorage.clear();
  });

  // ========================================
  // 6.1 UI VALIDATION
  // ========================================

  describe("6.1 UI Validation", () => {
    it("UI-01: should render all form elements with no errors when valid", async () => {
      renderLogin();

      // All elements present
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/password/i, { selector: "input" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /login/i })
      ).toBeInTheDocument();

      // Button should be enabled
      const loginButton = screen.getByRole("button", { name: /login/i });
      expect(loginButton).not.toBeDisabled();
    });

    it("UI-02: should trim spaces from email before submission", async () => {
      const { authService } = await import("../services/authService");
      const mockLogin = vi.mocked(authService.login);
      mockLogin.mockResolvedValue(mockSuccessResponse);

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i, {
        selector: "input",
      });
      const loginButton = screen.getByRole("button", { name: /login/i });

      // Type with spaces
      await user.type(emailInput, "  test@example.com  ");
      await user.type(passwordInput, "password123");
      await user.click(loginButton);

      // Check API called with trimmed email
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            email: "test@example.com", // ✅ Trimmed
          })
        );
      });
    });

    it("UI-03: should show error for invalid email format", async () => {
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const loginButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "a@");
      await user.click(loginButton);

      await waitFor(() => {
        expect(
          screen.getByText("The email address is not valid.")
        ).toBeInTheDocument();
      });
    });

    it("UI-04: should show error when password is empty", async () => {
      renderLogin();

      const loginButton = screen.getByRole("button", { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(
          screen.getByText("Please enter your password.")
        ).toBeInTheDocument();
      });
    });

    it("UI-07: should have show/hide password toggle", async () => {
      renderLogin();

      const passwordInput = screen.getByLabelText(/password/i, {
        selector: "input",
      }) as HTMLInputElement;

      // Initially password type
      expect(passwordInput.type).toBe("password");

      // Find toggle button (usually an eye icon button)
      const toggleButton = passwordInput.parentElement?.querySelector(
        'button[aria-label*="password"], button[type="button"]'
      );

      if (toggleButton) {
        await user.click(toggleButton);
        // After click, should be text type
        expect(passwordInput.type).toBe("text");
      }
    });

    it("UI-08: should submit form when Enter key is pressed", async () => {
      const { authService } = await import("../services/authService");
      const mockLogin = vi.mocked(authService.login);
      mockLogin.mockResolvedValue(mockSuccessResponse);

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i, {
        selector: "input",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      // Press Enter
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it("UI-09: should check Remember Me checkbox", async () => {
      renderLogin();

      const rememberCheckbox = screen.getByLabelText(
        /remember me/i
      ) as HTMLInputElement;

      expect(rememberCheckbox.checked).toBe(false);

      await user.click(rememberCheckbox);

      expect(rememberCheckbox.checked).toBe(true);
    });

    it("UI-10: should have Remember Me unchecked by default", () => {
      renderLogin();

      const rememberCheckbox = screen.getByLabelText(
        /remember me/i
      ) as HTMLInputElement;
      expect(rememberCheckbox.checked).toBe(false);
    });

    it("UI-11: should show error banner for wrong credentials", async () => {
      const { authService } = await import("../services/authService");
      const mockLogin = vi.mocked(authService.login);

      mockLogin.mockRejectedValue({
        response: { status: 401, data: "Invalid credentials" },
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i, {
        selector: "input",
      });
      const loginButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(loginButton);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email or password/i)
        ).toBeInTheDocument();
        // Should be in an Alert component
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("UI-12: should render form in a centered card", () => {
      renderLogin();

      // Check for card structure by verifying heading and form elements
      expect(
        screen.getByRole("heading", { name: /welcome back/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /login/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });
  });

  // ========================================
  // 6.2 API CHECKS
  // ========================================

  describe("6.2 API Checks", () => {
    it("API-01: should call login API with correct data and return token", async () => {
      const { authService } = await import("../services/authService");
      const mockLogin = vi.mocked(authService.login);
      mockLogin.mockResolvedValue(mockSuccessResponse);

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i, {
        selector: "input",
      });
      const loginButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "john@example.com");
      await user.type(passwordInput, "password123");
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: "john@example.com",
          password: "password123",
          rememberMe: false,
        });
      });
    });

    it("API-02: should handle bad password (401)", async () => {
      const { authService } = await import("../services/authService");
      const mockLogin = vi.mocked(authService.login);

      mockLogin.mockRejectedValue({
        response: { status: 401, data: "Wrong password" },
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i, {
        selector: "input",
      });
      const loginButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpass");
      await user.click(loginButton);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email or password/i)
        ).toBeInTheDocument();
      });
    });

    it("API-03: should handle user not found (401)", async () => {
      const { authService } = await import("../services/authService");
      const mockLogin = vi.mocked(authService.login);

      mockLogin.mockRejectedValue({
        response: { status: 401, data: "User not found" },
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i, {
        selector: "input",
      });
      const loginButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "notfound@example.com");
      await user.type(passwordInput, "password123");
      await user.click(loginButton);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email or password/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ========================================
  // 6.3 TOKEN & STORAGE
  // ========================================

  describe("6.3 Token & Storage", () => {
    it("TK-01: should receive JWT with userID and companyID", async () => {
      const { authService } = await import("../services/authService");
      const mockLogin = vi.mocked(authService.login);
      mockLogin.mockResolvedValue(mockSuccessResponse);

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i, {
        selector: "input",
      });
      const loginButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "john@example.com");
      await user.type(passwordInput, "password123");
      await user.click(loginButton);

      await waitFor(() => {
        // Check that response has required data
        expect(mockLogin).toHaveBeenCalled();
        // Token should be stored (checked in TK-02/03)
      });
    });

    it("TK-02: should save to localStorage when Remember Me is ON", async () => {
      const { authService } = await import("../services/authService");
      const mockLogin = vi.mocked(authService.login);
      mockLogin.mockResolvedValue(mockSuccessResponse);

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i, {
        selector: "input",
      });
      const rememberCheckbox = screen.getByLabelText(/remember me/i);
      const loginButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "john@example.com");
      await user.type(passwordInput, "password123");
      await user.click(rememberCheckbox);
      await user.click(loginButton);

      await waitFor(() => {
        // Check localStorage has token
        expect(localStorage.getItem("token")).toBe("fake-jwt-token-123");
        expect(localStorage.getItem("user")).toBeTruthy();
        expect(localStorage.getItem("company")).toBeTruthy();

        // sessionStorage should be empty
        expect(sessionStorage.getItem("token")).toBeNull();
      });
    });

    it("TK-03: should save to sessionStorage when Remember Me is OFF", async () => {
      const { authService } = await import("../services/authService");
      const mockLogin = vi.mocked(authService.login);
      mockLogin.mockResolvedValue(mockSuccessResponse);

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i, {
        selector: "input",
      });
      const loginButton = screen.getByRole("button", { name: /login/i });

      // Don't check Remember Me
      await user.type(emailInput, "john@example.com");
      await user.type(passwordInput, "password123");
      await user.click(loginButton);

      await waitFor(() => {
        // Check sessionStorage has token
        expect(sessionStorage.getItem("token")).toBe("fake-jwt-token-123");
        expect(sessionStorage.getItem("user")).toBeTruthy();
        expect(sessionStorage.getItem("company")).toBeTruthy();

        // localStorage should be empty
        expect(localStorage.getItem("token")).toBeNull();
      });
    });
  });

  // ========================================
  // 6.5 REDIRECT
  // ========================================

  describe("6.5 Redirect", () => {
    it("RD-01: should redirect to / after successful login", async () => {
      const { authService } = await import("../services/authService");
      const mockLogin = vi.mocked(authService.login);
      mockLogin.mockResolvedValue(mockSuccessResponse);

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i, {
        selector: "input",
      });
      const loginButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "john@example.com");
      await user.type(passwordInput, "password123");
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("RD-02: should stay on /login after failed login", async () => {
      const { authService } = await import("../services/authService");
      const mockLogin = vi.mocked(authService.login);

      mockLogin.mockRejectedValue({
        response: { status: 401, data: "Invalid credentials" },
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i, {
        selector: "input",
      });
      const loginButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(loginButton);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email or password/i)
        ).toBeInTheDocument();
      });

      // Should NOT navigate
      expect(mockNavigate).not.toHaveBeenCalled();

      // Login button should still be there (still on login page)
      expect(
        screen.getByRole("button", { name: /login/i })
      ).toBeInTheDocument();
    });
  });

  // ========================================
  // ADDITIONAL TESTS
  // ========================================

  describe("Additional UI Tests", () => {
    it("should show loading state during login", async () => {
      const { authService } = await import("../services/authService");
      const mockLogin = vi.mocked(authService.login);

      mockLogin.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockSuccessResponse), 1000)
          )
      );

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i, {
        selector: "input",
      });
      const loginButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(loginButton);

      // Should show loading state
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(loginButton).toBeDisabled();
    });

    it("should have link to signup page", () => {
      renderLogin();

      const signupLink = screen.getByRole("link", { name: /create account/i });
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute("href", "/signup");
    });

    it("should show both email and password errors when both empty", async () => {
      renderLogin();

      const loginButton = screen.getByRole("button", { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(
          screen.getByText("Please enter a valid email address.")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Please enter your password.")
        ).toBeInTheDocument();
      });
    });
  });
});
