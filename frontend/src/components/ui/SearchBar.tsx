import { useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function SearchBar({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  onSearch,
  className = '',
  disabled = false,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState('');

  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  }

  function handleClear() {
    const newValue = '';
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
    onSearch?.(newValue);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      onSearch?.(value);
    }
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      <SearchIcon
        className="absolute left-3 text-gray-400"
        sx={{ fontSize: 20 }}
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
      />
      {value && (
        <IconButton
          onClick={handleClear}
          disabled={disabled}
          size="small"
          className="absolute right-1"
          sx={{ padding: '4px' }}
        >
          <ClearIcon sx={{ fontSize: 18 }} />
        </IconButton>
      )}
    </div>
  );
}
