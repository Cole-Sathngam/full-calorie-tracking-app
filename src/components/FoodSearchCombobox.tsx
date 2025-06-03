import { useState, useRef, useEffect } from "react";
import { useCombobox } from 'downshift';
import { apiClient, Food } from "../services/apiClient";

interface FoodSearchComboboxProps {
  placeholder?: string;
  onSelection: (selectedFood: Food | null) => void;
  onInputChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const FoodSearchCombobox = ({ 
  placeholder = "Enter food name...",
  onSelection,
  onInputChange,
  disabled = false,
  className,
  style 
}: FoodSearchComboboxProps) => {
  // Internal state for autocomplete
  const [suggestions, setSuggestions] = useState<Food[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions with debouncing
  const fetchSuggestions = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      const results = await apiClient.searchFood(searchTerm);
      setSuggestions(results.slice(0, 10)); // Limit to 10 suggestions
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const debouncedFetchSuggestions = (searchTerm: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 300);
  };

  // Handle selection from dropdown
  const handleSelection = (selectedItem: Food | null) => {
    onSelection(selectedItem);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Downshift setup
  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex
  } = useCombobox({
    items: suggestions,
    onInputValueChange: ({ inputValue }) => {
      if (inputValue !== undefined) {
        onInputChange?.(inputValue);
        debouncedFetchSuggestions(inputValue);
      }
    },
    onSelectedItemChange: ({ selectedItem }) => {
      handleSelection(selectedItem);
    },
    itemToString: (item) => item ? item.name : '',
  });

  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      <input 
        {...getInputProps({
          placeholder,
          disabled,
          style: { 
            width: '100%',
            padding: '12px', 
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '16px'
          }
        })}
      />
      
      {/* Downshift Autocomplete Dropdown */}
      <div 
        {...getMenuProps()}
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: isOpen && suggestions.length > 0 ? '1px solid #ced4da' : 'none',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: isOpen && suggestions.length > 0 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
        }}
      >
        {isOpen && suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            {...getItemProps({ item: suggestion, index })}
            style={{
              padding: '12px',
              cursor: 'pointer',
              backgroundColor: highlightedIndex === index ? '#e9ecef' : 'white',
              borderBottom: index < suggestions.length - 1 ? '1px solid #e9ecef' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontWeight: '500' }}>{suggestion.name}</span>
            <span style={{ fontSize: '14px', color: '#6c757d' }}>
              {suggestion.calories} cal/100g
            </span>
          </div>
        ))}
        
        {isOpen && isLoadingSuggestions && (
          <div style={{
            padding: '12px',
            textAlign: 'center',
            color: '#6c757d',
            fontSize: '14px'
          }}>
            🔍 Searching...
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodSearchCombobox; 