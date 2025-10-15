// src/components/common/SearchBar.tsx
import { Paper, InputBase, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchBar = ({ placeholder = "Search…", value, onChange }: SearchBarProps) => {
  return (
    <Paper
      component="form"
      sx={{ 
        p: '2px 4px', 
        display: 'flex', 
        alignItems: 'center', 
        width: { xs: '100%', sm: 300 }, // Responsive width
        borderRadius: '20px' 
      }}
    >
      <IconButton sx={{ p: '10px' }} aria-label="search">
        <SearchIcon />
      </IconButton>
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        inputProps={{ 'aria-label': 'search' }}
      />
    </Paper>
  );
};

export default SearchBar;