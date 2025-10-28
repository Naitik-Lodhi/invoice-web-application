// src/components/layout/AppLayout.tsx
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Box, useTheme, useMediaQuery, CssBaseline } from "@mui/material";
import DashboardHeader from "../components/layout/DashboardHeader";
import AppSidebar from "../components/AppSidebar";
import { Dayjs } from "dayjs";

const drawerWidth = 240;
const SIDEBAR_STORAGE_KEY = "sidebar-open-preference";

const AppLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getInitialSidebarState = () => {
    if (isMobile) return false;
    const savedPreference = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (savedPreference !== null) {
      return savedPreference === "true";
    }
    return true;
  };

  const [isSidebarOpen, setSidebarOpen] = useState(getInitialSidebarState);

  // CHANGE: Default filter 'Month' se shuru karo (not 'Today')
  const [activeFilter, setActiveFilter] = useState("Today");
  const [customDateRange, setCustomDateRange] = useState<{
    start: Dayjs | null;
    end: Dayjs | null;
  }>({
    start: null,
    end: null,
  });
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarOpen));
    }
  }, [isSidebarOpen, isMobile]);

  useEffect(() => {
    if (!isMobile) {
      const savedPreference = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (savedPreference !== null) {
        setSidebarOpen(savedPreference === "true");
      } else {
        setSidebarOpen(true);
      }
    } else {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleFilterChange = (filter: string) => {
    console.log("🔄 Filter changing to:", filter);
    setActiveFilter(filter);
    
    // ✅ Clear custom dates if not custom filter
    if (filter !== "Custom") {
      setCustomDateRange({ start: null, end: null });
    }
  };

  const handleCustomDateChange = (start: Dayjs | null, end: Dayjs | null) => {
    console.log("🔄 Custom date changed:", {
      start: start?.format("YYYY-MM-DD"),
      end: end?.format("YYYY-MM-DD"),
    });

    setCustomDateRange({ start, end });
    // ✅ Make sure filter is set to "Custom"
    if (activeFilter !== "Custom") {
      setActiveFilter("Custom");
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const handleClearFilter = () => {
    setActiveFilter("Today"); // Reset to Month instead of Today
    setCustomDateRange({ start: null, end: null });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <CssBaseline />

      <DashboardHeader
        onMenuClick={handleSidebarToggle}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onCustomDateChange={handleCustomDateChange}
        customDateRange={customDateRange}
        searchText={searchText}
        onSearchChange={handleSearchChange}
        onClearFilter={handleClearFilter}
        isMobile={isMobile}
      />

      <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        <AppSidebar
          isOpen={isSidebarOpen}
          onClose={handleSidebarClose}
          isMobile={isMobile}
          drawerWidth={drawerWidth}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
            overflowY: "auto",
            transition: theme.transitions.create("margin", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            marginLeft: {
              sm: isSidebarOpen ? 0 : `-${drawerWidth}px`,
            },
          }}
        >
          <Outlet
            context={{
              activeFilter,
              customDateRange,
              searchText,
              onFilterChange: handleFilterChange,
              onClearFilter: handleClearFilter,
              onCustomDateChange: handleCustomDateChange,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
