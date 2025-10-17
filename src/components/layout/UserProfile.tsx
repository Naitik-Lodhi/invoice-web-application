// src/components/layout/UserProfile.tsx
// Replace entire file

import { useState, useEffect } from "react";
import {
  Box,
  List,
  ListItem,
  Avatar,
  Typography,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useAuth } from "../../context/AuthContext";

const UserProfile = () => {
  const { user, company, logout, refreshLogo } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Reset error when company changes
  useEffect(() => {
    setImageError(false);
  }, [company?.companyID, company?.thumbnailUrl]);

  // ✅ Handle logo refresh
  const handleRefreshLogo = async () => {
    setIsRefreshing(true);
    setImageError(false);

    try {
      await refreshLogo();
      console.log("✅ Logo refreshed from UserProfile");
    } catch (error) {
      console.error("❌ Failed to refresh logo:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ✅ NEW: Convert and save logo to base64 when loaded successfully
  const handleLogoLoad = async (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    console.log("✅ UserProfile logo loaded successfully");

    if (!company?.companyID || !company?.thumbnailUrl) return;

    try {
      // Convert image to base64 and save
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const base64data = canvas.toDataURL('image/png');

      // Save to localStorage
      localStorage.setItem(`company_logo_base64_${company.companyID}`, base64data);
      console.log(`💾 Logo saved to localStorage (${(base64data.length / 1024).toFixed(2)} KB)`);
    } catch (error) {
      console.error("❌ Failed to save logo to localStorage:", error);
    }
  };

  if (!user || !company) {
    return null;
  }

  const logoSrc = company.thumbnailUrl || company.logoUrl;
  const showInitials = !logoSrc || imageError;

  console.log("👤 UserProfile - Logo source:", logoSrc);
  console.log("👤 UserProfile - Show initials:", showInitials);

  return (
    <List>
      <ListItem sx={{ gap: 2, position: "relative" }}>
        <Avatar
          src={showInitials ? undefined : logoSrc}
          sx={{ bgcolor: "primary.main" }}
          imgProps={{
            crossOrigin: "anonymous", // ✅ Important for canvas
            onError: (_e) => {
              console.error("❌ UserProfile logo failed to load:", logoSrc);
              setImageError(true);
            },
            onLoad: handleLogoLoad, // ✅ Save to localStorage on successful load
          }}
        >
          {showInitials && (user.firstName?.charAt(0) || "U")}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            {user.firstName} {user.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {company.companyName}
          </Typography>
        </Box>

        {/* ✅ Refresh logo button (shows only if logo failed) */}
        {imageError && (
          <Tooltip title="Refresh logo">
            <IconButton
              size="small"
              onClick={handleRefreshLogo}
              disabled={isRefreshing}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton onClick={logout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </ListItem>
    </List>
  );
};

export default UserProfile;