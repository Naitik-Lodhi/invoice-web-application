// src/components/layout/UserProfile.tsx
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

  // ✅ Add safety check
  if (!user || !company) {
    return null;
  }

  return (
    <List>
      <ListItem sx={{ gap: 2 }}>
        <Avatar 
          src={company.companyName} // ✅ Changed from companyName
          sx={{ bgcolor: "primary.main" }}
        >
          {user.firstName?.charAt(0) || "U"}
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