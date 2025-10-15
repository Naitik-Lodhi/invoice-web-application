// src/components/layout/AppSidebar.tsx
import { Box, Drawer, Divider, Toolbar } from "@mui/material";
import NavLinks from "./layout/NavLinks";
import UserProfile from "./layout/UserProfile";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  drawerWidth: number;
}

const AppSidebar = ({
  isOpen,
  onClose,
  isMobile,
  drawerWidth,
}: AppSidebarProps) => {
  return (
    <Drawer
      variant={isMobile ? "temporary" : "persistent"}
      open={isOpen}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          // Mobile: full height from top, Desktop: below header
          top: { xs: 0, sm: "64px" },
          height: { xs: "100%", sm: "calc(100% - 64px)" },
          overflow: "auto",
          // Mobile par higher z-index to overlay header
          zIndex: (theme) => theme.zIndex.drawer + (isMobile ? 2 : 0),
        },
      }}
    >
      <Box 
        sx={{ 
          display: "flex", 
          flexDirection: "column", 
          height: "100%",
          overflow: "auto",
        }}
      >
        {/* Mobile par header ki height ke barabar space */}
        {isMobile && <Toolbar />}
        
        <Box sx={{ flexGrow: 1, overflow: "auto" }}>
          <NavLinks onClose={onClose} isMobile={isMobile} />
        </Box>
        <Divider />
        <Box sx={{ flexShrink: 0 }}>
          <UserProfile />
        </Box>
      </Box>
    </Drawer>
  );
};

export default AppSidebar;