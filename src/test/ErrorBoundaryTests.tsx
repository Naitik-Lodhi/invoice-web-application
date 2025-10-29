// src/test/ErrorBoundaryTests.tsx
import { useState } from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import ErrorBoundary from "../error/ErrorBoundary"; // ✅ Import

// ✅ Test 1: Component that throws during RENDER
const RenderErrorComponent = () => {
  throw new Error("💥 Render Error - This SHOULD be caught by Error Boundary");
  return <div>This won't render</div>;
};

// ✅ Test 2: Component that throws in event handler
const EventHandlerErrorComponent = () => {
  const handleClick = () => {
    throw new Error("💥 Event Handler Error - Error Boundary WON'T catch this");
  };

  return (
    <Button variant="contained" onClick={handleClick} color="warning">
      Click to throw event handler error
    </Button>
  );
};

// ✅ Test 3: Component with conditional render error
const ConditionalErrorComponent = () => {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error("💥 Conditional Render Error - Error Boundary WILL catch this");
  }

  return (
    <Button variant="contained" onClick={() => setShouldError(true)} color="primary">
      Click to trigger conditional error
    </Button>
  );
};

// ✅ Test 4: Component with useEffect triggered error
const UseEffectErrorComponent = () => {
  const [trigger, setTrigger] = useState(false);

  if (trigger) {
    throw new Error("💥 UseEffect triggered render error");
  }

  return (
    <Button variant="contained" onClick={() => setTrigger(true)} color="secondary">
      Trigger useEffect error
    </Button>
  );
};

// ✅ Main test page with individual error boundaries for each test
const ErrorBoundaryTestPage = () => {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0); // ✅ For resetting error boundaries

  const tests = [
    {
      id: "render",
      name: "Test 1: Render Error (SHOULD be caught)",
      component: <RenderErrorComponent />,
      description: "Throws error during component render - Error Boundary WILL catch",
      shouldCatch: true,
    },
    {
      id: "conditional",
      name: "Test 2: Conditional Render Error (SHOULD be caught)",
      component: <ConditionalErrorComponent />,
      description: "Click button to trigger render error - Error Boundary WILL catch",
      shouldCatch: true,
    },
    {
      id: "useEffect",
      name: "Test 3: UseEffect Error (SHOULD be caught)",
      component: <UseEffectErrorComponent />,
      description: "Triggers error via state update - Error Boundary WILL catch",
      shouldCatch: true,
    },
    {
      id: "eventHandler",
      name: "Test 4: Event Handler Error (WON'T be caught)",
      component: <EventHandlerErrorComponent />,
      description: "Click button - Error Boundary WON'T catch (check console)",
      shouldCatch: false,
    },
  ];

  const resetTest = () => {
    setActiveTest(null);
    setResetKey((prev) => prev + 1); // ✅ This will reset all error boundaries
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        🧪 Error Boundary Tests
      </Typography>

      <Paper sx={{ p: 3, mb: 3, bgcolor: "#fff3cd", border: "2px solid #ffc107" }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          📋 What to Expect:
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2">
            ✅ <strong>Tests 1-3:</strong> Should show error boundary fallback UI (not blank screen)
          </Typography>
          <Typography variant="body2">
            ❌ <strong>Test 4:</strong> Will show error in console (Error Boundary can't catch event handler errors)
          </Typography>
          <Typography variant="body2">
            🔄 <strong>After error:</strong> Click "Reset This Test" button in the error UI
          </Typography>
        </Stack>
      </Paper>

      <Stack spacing={3}>
        {tests.map((test) => (
          <Paper 
            key={test.id} 
            sx={{ 
              p: 3,
              border: activeTest === test.id ? "2px solid #2196f3" : "1px solid #e0e0e0",
              bgcolor: activeTest === test.id ? "#f0f8ff" : "#fff"
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {test.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {test.description}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 1, 
                    display: "block",
                    color: test.shouldCatch ? "#2e7d32" : "#d32f2f",
                    fontWeight: 600 
                  }}
                >
                  {test.shouldCatch ? "✅ Error Boundary WILL catch this" : "❌ Error Boundary WON'T catch this"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant={activeTest === test.id ? "contained" : "outlined"}
                  onClick={() => setActiveTest(test.id)}
                  disabled={activeTest === test.id}
                >
                  {activeTest === test.id ? "✓ Active" : "Activate"}
                </Button>
                {activeTest === test.id && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={resetTest}
                  >
                    Reset
                  </Button>
                )}
              </Box>
            </Box>

            {activeTest === test.id && (
              <Box sx={{ mt: 2 }}>
                {/* ✅ CRITICAL: Each test gets its own Error Boundary with unique key */}
                <ErrorBoundary 
                  key={`${test.id}-${resetKey}`}
                  fallbackTitle={`Error in ${test.name}`}
                  fallbackMessage="The error was caught by the Error Boundary!"
                  onReset={resetTest}
                  showHomeButton={false}
                >
                  <Paper sx={{ p: 2, bgcolor: "#f5f5f5", border: "2px dashed #999" }}>
                    <Typography variant="caption" sx={{ display: "block", mb: 2, color: "#666" }}>
                      👇 Component renders below (inside Error Boundary)
                    </Typography>
                    {test.component}
                  </Paper>
                </ErrorBoundary>
              </Box>
            )}
          </Paper>
        ))}
      </Stack>

      <Paper sx={{ p: 3, mt: 4, bgcolor: "#e3f2fd" }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          🎯 Debug Checklist:
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2">
            1. ✅ If you see "Oops! Something went wrong" - Error Boundary is WORKING
          </Typography>
          <Typography variant="body2">
            2. ❌ If you see blank white screen - Error Boundary is NOT WORKING
          </Typography>
          <Typography variant="body2">
            3. 🔍 Open browser console (F12) to see error logs
          </Typography>
          <Typography variant="body2">
            4. 🔄 Click "Try Again" button in error UI to reset
          </Typography>
        </Stack>
      </Paper>

      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Button
          variant="contained"
          color="error"
          size="large"
          onClick={() => {
            setActiveTest(null);
            setResetKey(0);
            window.location.reload();
          }}
        >
          🔄 Reload Page (Full Reset)
        </Button>
      </Box>
    </Box>
  );
};

export default ErrorBoundaryTestPage;