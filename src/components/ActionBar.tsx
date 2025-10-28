import {
  Box,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Divider,
  Typography,
  useTheme,
  useMediaQuery,
  Stack,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
} from "@mui/material";
import { useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import ClearIcon from "@mui/icons-material/Clear";
import CloseIcon from "@mui/icons-material/Close";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import LockIcon from "@mui/icons-material/Lock"; // ✅ ADD THIS

export interface Column {
  field: string;
  headerName: string;
  visible: boolean;
}

interface ActionBarProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  onNewInvoice: () => void;
  onExport: () => void;
  columns: Column[];
  onColumnVisibilityChange: (field: string, visible: boolean) => void;
  totalRecords?: number;
  buttonName?: string;
  searchBarPlaceholder?: string;
  isNewButtonDisabled?: boolean;
  isExportDisabled?: boolean;
}

const ActionBar = ({
  searchText,
  onSearchChange,
  onNewInvoice,
  onExport,
  columns,
  onColumnVisibilityChange,
  totalRecords = 0,
  buttonName,
  searchBarPlaceholder,
  isNewButtonDisabled = false,
  isExportDisabled,
}: ActionBarProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [mobileColumnDrawer, setMobileColumnDrawer] = useState(false);

  // ✅ Helper function to check if column is locked
  const isColumnLocked = (field: string) => {
    return field === "actions";
  };

  // Desktop Menu handlers
  const handleColumnMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (isMobile) {
      setMobileColumnDrawer(true);
    } else {
      setColumnMenuAnchor(event.currentTarget);
    }
  };

  const handleColumnMenuClose = () => {
    setColumnMenuAnchor(null);
  };

  const handleMobileDrawerClose = () => {
    setMobileColumnDrawer(false);
  };

  const handleColumnToggle = (field: string) => {
    // ✅ Prevent toggling locked columns
    if (isColumnLocked(field)) return;

    const column = columns.find((col) => col.field === field);
    if (column) {
      onColumnVisibilityChange(field, !column.visible);
    }
  };

  const handleClearSearch = () => {
    onSearchChange("");
  };

  const handleShowAll = () => {
    // ✅ Only toggle non-locked columns
    columns.forEach((col) => {
      if (!isColumnLocked(col.field)) {
        onColumnVisibilityChange(col.field, true);
      }
    });
  };

  const handleHideAll = () => {
    // ✅ Only toggle non-locked columns
    columns.forEach((col) => {
      if (!isColumnLocked(col.field)) {
        onColumnVisibilityChange(col.field, false);
      }
    });
  };

  // Mobile Drawer for Column Selection
  const MobileColumnSelector = (
    <Drawer
      anchor="bottom"
      open={mobileColumnDrawer}
      onClose={handleMobileDrawerClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: "80vh",
        },
      }}
    >
      {/* Header */}
      <AppBar
        position="sticky"
        sx={{ backgroundColor: "white", color: "black" }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 600 }}>
            Show/Hide Columns
          </Typography>
          <IconButton onClick={handleMobileDrawerClose} size="small">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Column List */}
      <List sx={{ pb: 2 }}>
        {columns.map((column) => {
          const isLocked = isColumnLocked(column.field);
          
          return (
            <ListItem key={column.field} disablePadding>
              <ListItemButton 
                onClick={() => handleColumnToggle(column.field)}
                disabled={isLocked} // ✅ Disable locked columns
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {isLocked ? (
                    <LockIcon sx={{ color: "#999", fontSize: "1.2rem" }} />
                  ) : column.visible ? (
                    <CheckBoxIcon sx={{ color: "#000" }} />
                  ) : (
                    <CheckBoxOutlineBlankIcon sx={{ color: "#666" }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={column.headerName}
                  primaryTypographyProps={{
                    fontSize: "0.9rem",
                    fontWeight: column.visible ? 600 : 400,
                    color: isLocked ? "#999" : "inherit", // ✅ Grayed out
                  }}
                />
                {isLocked && (
                  <Typography variant="caption" sx={{ color: "#999", ml: 1 }}>
                    Always visible
                  </Typography>
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Action Buttons */}
      <Box
        sx={{ p: 2, display: "flex", gap: 1, borderTop: "1px solid #e0e0e0" }}
      >
        <Button
          variant="outlined"
          onClick={handleShowAll}
          sx={{ flex: 1, textTransform: "none" }}
        >
          Show All
        </Button>
        <Button
          variant="outlined"
          onClick={handleHideAll}
          sx={{ flex: 1, textTransform: "none" }}
        >
          Hide All
        </Button>
      </Box>
    </Drawer>
  );

  // Desktop Menu for Column Selection
  const DesktopColumnMenu = (
    <Menu
      anchorEl={columnMenuAnchor}
      open={Boolean(columnMenuAnchor)}
      onClose={handleColumnMenuClose}
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
          maxHeight: 400,
          width: 250,
        },
      }}
    >
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Show/Hide Columns
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ maxHeight: 300, overflow: "auto" }}>
        {columns.map((column) => {
          const isLocked = isColumnLocked(column.field);
          
          return (
            <MenuItem
              key={column.field}
              onClick={() => handleColumnToggle(column.field)}
              sx={{ 
                py: 0.5,
                cursor: isLocked ? "not-allowed" : "pointer", // ✅ Change cursor
                opacity: isLocked ? 0.6 : 1, // ✅ Visual feedback
              }}
              disabled={isLocked} // ✅ Disable menu item
            >
              <FormControlLabel
                control={
                  isLocked ? (
                    <LockIcon sx={{ color: "#999", fontSize: "1.2rem", ml: 0.5, mr: 1 }} />
                  ) : (
                    <Checkbox
                      checked={column.visible}
                      size="small"
                      sx={{
                        color: "#666",
                        "&.Mui-checked": {
                          color: "#000",
                        },
                      }}
                    />
                  )
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontSize: "0.875rem" }}>
                      {column.headerName}
                    </Typography>
                    {isLocked && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: "#999", 
                          fontSize: "0.7rem",
                          fontStyle: "italic"
                        }}
                      >
                        (Always visible)
                      </Typography>
                    )}
                  </Box>
                }
                sx={{
                  width: "100%",
                  m: 0,
                  "& .MuiFormControlLabel-label": {
                    fontSize: "0.875rem",
                  },
                }}
              />
            </MenuItem>
          );
        })}
      </Box>
      <Divider />
      <Box sx={{ p: 1, display: "flex", gap: 1 }}>
        <Button
          size="small"
          onClick={handleShowAll}
          sx={{ flex: 1, textTransform: "none" }}
        >
          Show All
        </Button>
        <Button
          size="small"
          onClick={handleHideAll}
          sx={{ flex: 1, textTransform: "none" }}
        >
          Hide All
        </Button>
      </Box>
    </Menu>
  );

  // Mobile view
  if (isMobile) {
    return (
      <>
        <Box sx={{ mb: 2 }}>
          {/* Search Bar - Full width on mobile */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={searchBarPlaceholder}
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchText && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            {totalRecords > 0 && searchText && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 0.5,
                  color: "text.secondary",
                  fontSize: "0.7rem",
                }}
              >
                {totalRecords} results found
              </Typography>
            )}
          </Box>

          {/* Action Buttons - Horizontal on mobile */}
          <Box
            sx={{ display: "flex", gap: 1, justifyContent: "space-between" }}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onNewInvoice}
              size="small"
              disabled={isNewButtonDisabled}
              sx={{
                bgcolor: "black",
                "&:hover": { bgcolor: "#333" },
                textTransform: "none",
                flex: 1,
                fontSize: "0.8rem",
              }}
            >
              {buttonName}
            </Button>

            <Tooltip title={isExportDisabled ? "No data to export" : "Export"}>
              <span>
                <IconButton
                  onClick={onExport}
                  disabled={isExportDisabled}
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                  }}
                >
                  <FileDownloadIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Columns">
              <IconButton
                onClick={handleColumnMenuOpen}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  backgroundColor: columns.some((c) => !c.visible && !isColumnLocked(c.field))
                    ? "#f3f4f6"
                    : "transparent",
                }}
              >
                <ViewColumnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Mobile Column Selector Drawer */}
        {MobileColumnSelector}
      </>
    );
  }

  // Desktop/Tablet view
  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: isTablet ? "wrap" : "nowrap",
        }}
      >
        {/* Left side - Search Bar */}
        <Box sx={{ flex: isTablet ? "1 1 100%" : "0 1 400px" }}>
          <TextField
            fullWidth
            size="small"
            placeholder={searchBarPlaceholder}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchText && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
          {totalRecords > 0 && searchText && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 0.5,
                color: "text.secondary",
              }}
            >
              {totalRecords} results found
            </Typography>
          )}
        </Box>

        {/* Right side - Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewInvoice}
            disabled={isNewButtonDisabled}
            sx={{
              bgcolor: "black",
              "&:hover": { bgcolor: "#333" },
              textTransform: "none",
              px: 2.5,
            }}
          >
            {buttonName}
          </Button>

          <Tooltip
            title={isExportDisabled ? "No data to export" : "Export to Excel"}
            arrow
          >
            <span>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={onExport}
                disabled={isExportDisabled}
                sx={{
                  textTransform: "none",
                  borderColor: "#e0e0e0",
                  color: isExportDisabled ? "#9e9e9e" : "#666",
                  "&:hover": {
                    borderColor: isExportDisabled ? "#e0e0e0" : "#666",
                    bgcolor: isExportDisabled
                      ? "transparent"
                      : "rgba(0, 0, 0, 0.04)",
                  },
                  "&:disabled": {
                    borderColor: "#e0e0e0",
                    color: "#9e9e9e",
                  },
                }}
                fullWidth={isMobile}
              >
                Export ({totalRecords})
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Show/hide columns">
            <Button
              variant="outlined"
              startIcon={<ViewColumnIcon />}
              onClick={handleColumnMenuOpen}
              sx={{
                borderColor: "#e0e0e0",
                color: "#333",
                "&:hover": {
                  borderColor: "#999",
                  bgcolor: "rgba(0,0,0,0.04)",
                },
                textTransform: "none",
                minWidth: "auto",
                px: isTablet ? 1 : 2,
              }}
            >
              {!isTablet && "Columns"}
            </Button>
          </Tooltip>
        </Stack>
      </Box>

      {/* Desktop Column Menu */}
      {DesktopColumnMenu}
    </>
  );
};

export default ActionBar;