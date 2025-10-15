// src/components/layout/NavLinks.tsx (Alternative with better styling)
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, alpha } from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptIcon from '@mui/icons-material/Receipt';

const navLinks = [
  { text: 'Dashboard', icon: <DashboardIcon />, to: '/' },
  { text: 'Item List', icon: <ReceiptIcon />, to: '/itemlist' },
];

interface NavLinksProps {
  onClose?: () => void;
  isMobile?: boolean;
}

const NavLinks = ({ onClose, isMobile }: NavLinksProps) => {
  const location = useLocation();
  
  const handleClick = () => {
    // Close sidebar on mobile after clicking a link
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <List sx={{ px: 1 }}>
      {navLinks.map((item) => {
        const isActive = item.to === '/' 
          ? location.pathname === '/' 
          : location.pathname.startsWith(item.to);
        
        return (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              component={NavLink} 
              to={item.to}
              onClick={handleClick}
              sx={{
                borderRadius: 1,
                mx: 0.5,
                position: 'relative',
                backgroundColor: isActive ? alpha('#000', 0.08) : 'transparent',
                '&:hover': {
                  backgroundColor: isActive 
                    ? alpha('#000', 0.12) 
                    : alpha('#000', 0.04),
                },
                '&::before': isActive ? {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: '70%',
                  backgroundColor: '#000',
                  borderRadius: '0 2px 2px 0',
                } : {},
                '& .MuiListItemIcon-root': {
                  minWidth: 40,
                  color: isActive ? '#000' : '#666',
                },
                '& .MuiListItemText-primary': {
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.9rem',
                  color: isActive ? '#000' : '#333',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
};

export default NavLinks;