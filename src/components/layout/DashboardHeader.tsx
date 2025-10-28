// src/components/layout/DashboardHeader.tsx
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Button,
  Popover,
  Stack,
  Avatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { useState } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../context/AuthContext";
import type { Dayjs } from "dayjs";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onCustomDateChange: (start: Dayjs | null, end: Dayjs | null) => void;
  customDateRange: { start: Dayjs | null; end: Dayjs | null };
  searchText: string;
  onSearchChange: (text: string) => void;
  onClearFilter: () => void;
  isMobile: boolean;
}

const dateFilters = ["Today", "Week", "Month", "Year", "Custom"];

const DashboardHeader = ({
  onMenuClick,
  activeFilter,
  onFilterChange,
  onCustomDateChange,
  customDateRange,
  isMobile,
}: DashboardHeaderProps) => {
  const { user, company, logout } = useAuth();
  const [customDateAnchor, setCustomDateAnchor] = useState<null | HTMLElement>(
    null
  );
  const [tempDateRange, setTempDateRange] = useState(customDateRange);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [imageError, setImageError] = useState(false);

  const handleCustomDateOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCustomDateAnchor(event.currentTarget);
  };

  const handleCustomDateClose = () => {
    setCustomDateAnchor(null);
  };

  const handleCustomDateApply = () => {
    if (tempDateRange.start && tempDateRange.end) {
      onCustomDateChange(tempDateRange.start, tempDateRange.end);
      handleCustomDateClose();
    }
  };

  // Profile dropdown handlers
  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchor(null);
  };

  const handleLogout = () => {
    handleProfileClose();
    logout();
  };

  // Desktop view - filters only
  const desktopFilters = (
    <Box sx={{ display: "flex", gap: 1 }}>
      {dateFilters.map((filter) => (
        <Button
          key={filter}
          onClick={() =>
            filter === "Custom"
              ? handleCustomDateOpen({
                  currentTarget: document.getElementById(`filter-${filter}`),
                } as any)
              : onFilterChange(filter)
          }
          id={`filter-${filter}`}
          sx={{
            color: activeFilter === filter ? "white" : "black",
            backgroundColor: activeFilter === filter ? "black" : "transparent",
            borderRadius: "20px",
            px: 2,
            py: 0.5,
            textTransform: "none",
            "&:hover": {
              backgroundColor: activeFilter === filter ? "#333" : "#f0f0f0",
            },
          }}
        >
          {filter}
        </Button>
      ))}
    </Box>
  );

  // Custom Date Range Popover
  const customDatePopover = (
    <Popover
      open={Boolean(customDateAnchor)}
      anchorEl={customDateAnchor}
      onClose={handleCustomDateClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <DatePicker
              label="Start Date"
              value={tempDateRange.start}
              onChange={(newValue) =>
                setTempDateRange((prev) => ({ ...prev, start: newValue }))
              }
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />
            <DatePicker
              label="End Date"
              value={tempDateRange.end}
              onChange={(newValue) =>
                setTempDateRange((prev) => ({ ...prev, end: newValue }))
              }
              minDate={tempDateRange.start || undefined}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button size="small" onClick={handleCustomDateClose}>
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleCustomDateApply}
                disabled={!tempDateRange.start || !tempDateRange.end}
                sx={{
                  bgcolor: "black",
                  "&:hover": { bgcolor: "#333" },
                }}
              >
                Apply
              </Button>
            </Box>
          </Stack>
        </Box>
      </LocalizationProvider>
    </Popover>
  );

  // Profile Dropdown
  const profileDropdown = (
    <Popover
      open={Boolean(profileAnchor)}
      anchorEl={profileAnchor}
      onClose={handleProfileClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      PaperProps={{
        sx: {
          mt: 1,
          minWidth: 250,
        },
      }}
    >
      <Box
        display={"flex"}
        flexDirection={"column"}
        alignItems={"center"}
        justifyContent={"center"}
        sx={{ p: 2 }}
      >
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          {user?.firstName} {user?.lastName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {company?.companyName}
        </Typography>

        <Divider sx={{ mb: 1, width: "100%" }} />

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            "&:hover": {
              backgroundColor: "rgba(255, 0, 0, 0.08)",
              "& .MuiListItemIcon-root": {
                color: "error.main",
              },
              "& .MuiListItemText-primary": {
                color: "error.main",
              },
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Popover>
  );

  const logoSrc = company?.thumbnailUrl || company?.logoUrl;
  const showInitials = !logoSrc || imageError;

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: "white",
          color: "black",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ fontWeight: "bold" }}
          >
            Invoices
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop - only filters */}
          {!isMobile && desktopFilters}

          {/* Profile Section */}
          {user && (
            <Box
              onClick={handleProfileClick}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                p: 0.5,
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
                ml: 2,
              }}
            >
              <Avatar
                src={showInitials ? undefined : logoSrc}
                sx={{
                  bgcolor: "primary.main",
                  width: 36,
                  height: 36,
                }}
                imgProps={{
                  crossOrigin: "anonymous",
                  onError: () => setImageError(true),
                }}
              >
                {showInitials && (user.firstName?.charAt(0) || "U")}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user.firstName}
              </Typography>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {customDatePopover}
      {profileDropdown}
    </>
  );
};

export default DashboardHeader;
