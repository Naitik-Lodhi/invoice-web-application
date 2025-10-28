// src/components/layout/UserProfile.tsx
// REPLACE ENTIRE FILE

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
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../context/AuthContext";

const UserProfile = () => {
  const { user, company, logout } = useAuth();
  const [imageError, setImageError] = useState(false);

  // ✅ Reset error when company changes
  useEffect(() => {
    setImageError(false);
  }, [company?.companyID, company?.thumbnailUrl]);

  if (!user || !company) {
    return null;
  }

  const logoSrc = company.thumbnailUrl || company.logoUrl;
  const showInitials = !logoSrc || imageError;

  return (
    <List>
      <ListItem sx={{ gap: 2 }}>
        <Avatar
          src={showInitials ? undefined : logoSrc}
          sx={{ bgcolor: "primary.main" }}
          imgProps={{
            onError: () => {
              console.error("❌ UserProfile logo failed to load:", logoSrc);
              setImageError(true);
            },
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