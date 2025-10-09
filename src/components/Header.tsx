import { AppBar, Toolbar, Typography } from "@mui/material";
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
export default function Header() {
  return (
    <AppBar position="static" color="inherit" elevation={0} sx={{color:"black", margin:0, borderBottom: '1px solid #e0e0e0', height: 64 }}>
      <Toolbar  sx={{ justifyContent: "center",}}>
        <DescriptionOutlinedIcon fontSize="large" sx={{ mr: 1 }} />
        <Typography variant="h6" color="inherit" fontWeight={500}>
          Invoice App
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
