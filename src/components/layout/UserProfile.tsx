// src/components/layout/UserProfile.tsx

import { useState } from 'react';
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
  const [logoError, setLogoError] = useState(false);

  if (!user || !company) {
    return null;
  }

  // ✅ Determine logo source
  const logoSrc = company.thumbnailUrl || company.logoUrl;
  const showInitials = !logoSrc || logoError;

  return (
    <List>
      <ListItem sx={{ gap: 2 }}>
        <Avatar 
          src={showInitials ? undefined : logoSrc}
          sx={{ bgcolor: "primary.main" }}
          imgProps={{
            onError: () => {
              console.error("❌ Logo failed to load");
              setLogoError(true);
            }
          }}
        >
          {showInitials && (user.firstName?.charAt(0) || "U")}
        </Avatar>
        <Box>
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