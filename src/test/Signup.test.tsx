// src/test/Signup.test.tsx - SIMPLE VERSION

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SignupPage from "../pages/auth/SignupPage";
import { AuthProvider } from "../context/AuthContext";

describe("SignupPage - Simple Tests", () => {
  
  const renderSignupPage = () => {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // ========================================
  // RENDERING TESTS
  // ========================================

  it("should render signup page with title and subtitle", () => {
    renderSignupPage();

    expect(screen.getByRole("heading", { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByText(/set up your company and start invoicing/i)).toBeInTheDocument();
  });

  it("should render user information section with all fields", () => {
    renderSignupPage();

    expect(screen.getByText(/user information/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i, { selector: "input" })).toBeInTheDocument();
  });

  it("should render company information section with all fields", () => {
    renderSignupPage();

    expect(screen.getByText(/company information/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/industry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency symbol/i)).toBeInTheDocument();
  });

  it("should render company logo upload field", () => {
    renderSignupPage();

    expect(screen.getByText(/company logo/i)).toBeInTheDocument();
    expect(screen.getByTestId("file-upload-input")).toBeInTheDocument();
  });

  it("should render Sign Up button", () => {
    renderSignupPage();

    const signupButton = screen.getByRole("button", { name: /sign up/i });
    expect(signupButton).toBeInTheDocument();
    expect(signupButton).not.toBeDisabled();
  });

  it("should render login link", () => {
    renderSignupPage();

    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
  });

  // ========================================
  // INPUT VALIDATION TESTS
  // ========================================

  it("should show error when first name is empty", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    const submitButton = screen.getByRole("button", { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter your first name/i)).toBeInTheDocument();
    });
  });

  it("should show error when last name is empty", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter your last name/i)).toBeInTheDocument();
    });
  });

  it("should show error when email is empty", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it("should show error when company name is empty", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter your company name/i)).toBeInTheDocument();
    });
  });

  it("should show error when city is empty", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter your city/i)).toBeInTheDocument();
    });
  });

  it("should show error for invalid email format", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, "invalid@");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/email address is not valid/i)).toBeInTheDocument();
    });
  });

  it("should show error for short password", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    const passwordInput = screen.getByLabelText(/^password/i, { selector: "input" });
    await user.type(passwordInput, "short");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it("should show error for invalid zip code length", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    const zipInput = screen.getByLabelText(/zip code/i);
    await user.type(zipInput, "123");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/zip.*exactly 6 digits/i)).toBeInTheDocument();
    });
  });

  it("should accept valid 6-digit zip code", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    const zipInput = screen.getByLabelText(/zip code/i);
    await user.type(zipInput, "400001");

    expect(zipInput).toHaveValue("400001");
  });

  it("should show multiple errors when multiple fields are empty", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter your first name/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter your last name/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter your company name/i)).toBeInTheDocument();
    });
  });

  // ========================================
  // FORM FIELD INTERACTION
  // ========================================

  it("should have default currency symbol", () => {
    renderSignupPage();

    const currencyInput = screen.getByLabelText(/currency symbol/i);
    expect(currencyInput).toHaveValue("₹");
  });

  it("should allow clearing currency symbol", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    const currencyInput = screen.getByLabelText(/currency symbol/i);
    await user.clear(currencyInput);

    expect(currencyInput).toHaveValue("");
  });

  it("should show error when currency symbol is cleared and submitted", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    const currencyInput = screen.getByLabelText(/currency symbol/i);
    await user.clear(currencyInput);
    
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter a currency symbol/i)).toBeInTheDocument();
    });
  });

  it("should have file input for logo upload", () => {
    renderSignupPage();

    const fileInput = screen.getByTestId("file-upload-input") as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.type).toBe("file");
  });

  it("should accept file upload", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    const file = new File(["logo"], "logo.png", { type: "image/png" });
    const fileInput = screen.getByTestId("file-upload-input") as HTMLInputElement;

    await user.upload(fileInput, file);

    expect(fileInput.files?.length).toBe(1);
    expect(fileInput.files?.[0]?.name).toBe("logo.png");
  });
});