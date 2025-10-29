// src/error/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Button, Typography, Paper, Container } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import HomeIcon from "@mui/icons-material/Home";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  showHomeButton?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("❌ ErrorBoundary caught an error:", error);
    console.error("📋 Error Info:", errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Log to external service (e.g., Sentry) if needed
    // logErrorToService(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  goHome = () => {
    window.location.href = "/";
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallbackTitle, fallbackMessage, showHomeButton = true } = this.props;
      const { error, errorInfo } = this.state;

      return (
        <Container maxWidth="md">
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              py: 4,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: { xs: 3, sm: 4 },
                width: "100%",
                textAlign: "center",
                borderRadius: 2,
              }}
            >
              <ErrorOutlineIcon
                sx={{
                  fontSize: { xs: 60, sm: 80 },
                  color: "error.main",
                  mb: 2,
                }}
              />

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  fontSize: { xs: "1.5rem", sm: "2rem" },
                }}
              >
                {fallbackTitle || "Oops! Something went wrong"}
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, fontSize: { xs: "0.875rem", sm: "1rem" } }}
              >
                {fallbackMessage ||
                  "We encountered an unexpected error. Please try refreshing the page or return to the homepage."}
              </Typography>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === "development" && error && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: "#f5f5f5",
                    textAlign: "left",
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                >
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{ fontWeight: 600, mb: 1, color: "error.main" }}
                  >
                    Error Details (Development Mode):
                  </Typography>
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      fontSize: "0.75rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {error.message}
                    {errorInfo && `\n\n${errorInfo.componentStack}`}
                  </Typography>
                </Paper>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.resetError}
                  sx={{
                    bgcolor: "black",
                    "&:hover": { bgcolor: "#333" },
                    textTransform: "none",
                    px: 3,
                  }}
                >
                  Try Again
                </Button>

                {showHomeButton && (
                  <Button
                    variant="outlined"
                    startIcon={<HomeIcon />}
                    onClick={this.goHome}
                    sx={{
                      textTransform: "none",
                      px: 3,
                      borderColor: "#e0e0e0",
                      color: "#666",
                    }}
                  >
                    Go to Homepage
                  </Button>
                )}
              </Box>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

// ============================================
// PAGE-SPECIFIC ERROR BOUNDARIES
// ============================================

// 1. Dashboard Error Boundary
export class DashboardErrorBoundary extends ErrorBoundary {
  constructor(props: ErrorBoundaryProps) {
    super({
      ...props,
      fallbackTitle: "Dashboard Error",
      fallbackMessage:
        "We couldn't load your dashboard. This might be due to network issues or data problems.",
    });
  }
}

// 2. Invoice Error Boundary
export class InvoiceErrorBoundary extends ErrorBoundary {
  constructor(props: ErrorBoundaryProps) {
    super({
      ...props,
      fallbackTitle: "Invoice Error",
      fallbackMessage:
        "Unable to load invoice data. Please check your connection and try again.",
    });
  }
}

// 3. Item List Error Boundary
export class ItemListErrorBoundary extends ErrorBoundary {
  constructor(props: ErrorBoundaryProps) {
    super({
      ...props,
      fallbackTitle: "Item List Error",
      fallbackMessage:
        "Failed to load items. Please refresh the page or contact support if the issue persists.",
    });
  }
}

// 4. Auth Error Boundary (for Login/Signup)
export class AuthErrorBoundary extends ErrorBoundary {
  constructor(props: ErrorBoundaryProps) {
    super({
      ...props,
      fallbackTitle: "Authentication Error",
      fallbackMessage:
        "Something went wrong during authentication. Please try again.",
      showHomeButton: false,
    });
  }
}

// 5. Form Error Boundary (for Editor dialogs)
export class FormErrorBoundary extends ErrorBoundary {
  constructor(props: ErrorBoundaryProps) {
    super({
      ...props,
      fallbackTitle: "Form Error",
      fallbackMessage:
        "Unable to display the form. Please close and try again.",
      showHomeButton: false,
    });
  }
}

// ============================================
// COMPONENT-SPECIFIC ERROR BOUNDARIES
// ============================================

// 6. Data Grid Error Boundary
export class DataGridErrorBoundary extends ErrorBoundary {
  constructor(props: ErrorBoundaryProps) {
    super({
      ...props,
      fallbackTitle: "Data Display Error",
      fallbackMessage:
        "Unable to display data in the table. Try refreshing the page.",
    });
  }
}

// 7. Chart Error Boundary
export class ChartErrorBoundary extends ErrorBoundary {
  constructor(props: ErrorBoundaryProps) {
    super({
      ...props,
      fallbackTitle: "Chart Error",
      fallbackMessage: "Unable to render chart. Data might be unavailable.",
      showHomeButton: false,
    });
  }
}

// 8. File Upload Error Boundary
export class FileUploadErrorBoundary extends ErrorBoundary {
  constructor(props: ErrorBoundaryProps) {
    super({
      ...props,
      fallbackTitle: "Upload Error",
      fallbackMessage:
        "File upload failed. Please check file size and format.",
      showHomeButton: false,
    });
  }
}

// ============================================
// HIGHER-ORDER COMPONENT FOR ERROR HANDLING
// ============================================

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  ErrorBoundaryComponent: typeof ErrorBoundary = ErrorBoundary,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundaryComponent {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundaryComponent>
    );
  };
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: Wrap entire page
export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <YourDashboardContent />
    </DashboardErrorBoundary>
  );
}

// Example 2: Wrap specific component
export default function InvoiceEditor() {
  return (
    <FormErrorBoundary onReset={() => console.log('Form reset')}>
      <YourInvoiceForm />
    </FormErrorBoundary>
  );
}

// Example 3: Using HOC
const SafeDataGrid = withErrorBoundary(
  InvoiceDataGrid,
  DataGridErrorBoundary
);

// Example 4: App-level error boundary
function App() {
  return (
    <ErrorBoundary 
      fallbackTitle="Application Error"
      fallbackMessage="The application encountered an error."
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
*/

export default ErrorBoundary;