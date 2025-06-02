import { useState, useRef, useEffect } from "react";
import { useEnhancedAuth } from "./hooks/useEnhancedAuth";
import SessionIndicator from "./components/SessionIndicator";
import ErrorDisplay from "./components/ErrorDisplay";
import { apiClient, ApiError, Food } from "./services/apiClient";
import { useCombobox } from 'downshift'

// Convert ApiError to a compatible error format for display
interface DisplayError {
  code: string;
  message: string;
  name: string;
}

// Interface for food lookup results
interface FoodLookupResult {
  name: string;
  caloriesPer100g: number;
  caloriesPer50g: number;
  found: boolean;
}

const convertApiErrorToDisplayError = (apiError: ApiError): DisplayError => ({
  code: apiError.code,
  message: apiError.message,
  name: 'ApiError'
});

function App() {
  const { user, signOut } = useEnhancedAuth();
  const [apiError, setApiError] = useState<DisplayError | null>(null);

  // State for calorie lookup feature
  const [lookupResult, setLookupResult] = useState<FoodLookupResult | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  // Downshift autocomplete state
  const [suggestions, setSuggestions] = useState<Food[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleApiError = (error: unknown) => {
    if (error && typeof error === 'object' && 'code' in error) {
      const apiError = error as ApiError;
      setApiError(convertApiErrorToDisplayError(apiError));
    } else {
      setApiError({
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        name: 'ApiError'
      });
    }
  };

  const clearApiError = () => {
    setApiError(null);
  };

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
    if (selectedItem) {
      // Automatically trigger lookup for selected suggestion
      const caloriesPer100g = selectedItem.calories;
      const caloriesPer50g = Math.round((caloriesPer100g / 100) * 50);
      
      setLookupResult({
        name: selectedItem.name,
        caloriesPer100g,
        caloriesPer50g,
        found: true
      });
    }
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Manual calorie lookup function
  const handleCalorieLookup = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      alert("Please enter a food name to lookup calories");
      return;
    }

    try {
      setIsLookupLoading(true);
      setApiError(null);
      
      const results = await apiClient.searchFood(searchTerm.trim());
      console.log('🔍 Lookup Results:', results);
      
      if (results.length > 0) {
        const food = results[0] as { name: string; calories: number };
        const caloriesPer100g = food.calories;
        const caloriesPer50g = Math.round((caloriesPer100g / 100) * 50);
        
        setLookupResult({
          name: food.name,
          caloriesPer100g,
          caloriesPer50g,
          found: true
        });
      } else {
        setLookupResult({
          name: searchTerm.trim(),
          caloriesPer100g: 0,
          caloriesPer50g: 0,
          found: false
        });
      }
    } catch (error) {
      handleApiError(error);
      setLookupResult(null);
    } finally {
      setIsLookupLoading(false);
    }
  };

  const clearLookupResult = () => {
    setLookupResult(null);
    resetCombobox();
  };

  // Downshift setup
  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    inputValue,
    highlightedIndex,
    reset: resetCombobox
  } = useCombobox({
    items: suggestions,
    onInputValueChange: ({ inputValue }) => {
      if (inputValue !== undefined) {
        setLookupResult(null); // Clear previous result
        debouncedFetchSuggestions(inputValue);
      }
    },
    onSelectedItemChange: ({ selectedItem }) => {
      handleSelection(selectedItem);
    },
    itemToString: (item) => item ? item.name : '',
  });

  return (
    <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>
          🍎 {user?.signInDetails?.loginId || user?.username}'s Calorie Tracking App
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
          <span style={{ color: '#27ae60', fontSize: '14px' }}>
            ✅ Authenticated as {user?.username}
          </span>
          <button
            onClick={signOut}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            👋 Sign Out
          </button>
        </div>
      </header>

      <SessionIndicator showDetails />

      {apiError && (
        <div style={{ marginBottom: '20px' }}>
          <ErrorDisplay
            error={apiError}
            title="API Error"
            onRetry={clearApiError}
          />
        </div>
      )}

      {/* Calorie Lookup Section with Downshift */}
      <section style={{ 
        padding: '25px', 
        backgroundColor: '#e8f5e8', 
        borderRadius: '10px',
        border: '1px solid #c3e6cb',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#155724', marginBottom: '20px' }}>
          🔍 Calorie Lookup - Per 50 Grams
        </h2>
        
        <div style={{ 
          padding: '15px', 
          backgroundColor: 'white', 
          borderRadius: '6px',
          border: '1px solid #c3e6cb'
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                {...getInputProps({
                  placeholder: "Enter food name (e.g., Apple, Chicken Breast)...",
                  disabled: isLookupLoading,
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
            
            <button 
              onClick={() => handleCalorieLookup(inputValue)}
              disabled={isLookupLoading || !inputValue.trim()}
              style={{ 
                padding: '12px 20px', 
                backgroundColor: isLookupLoading || !inputValue.trim() ? '#95a5a6' : '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: isLookupLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {isLookupLoading ? '⏳ Looking up...' : '🔍 Lookup Calories'}
            </button>
          </div>

          {/* Results Display */}
          {lookupResult && (
            <div style={{
              padding: '15px',
              backgroundColor: lookupResult.found ? '#d4edda' : '#f8d7da',
              border: `1px solid ${lookupResult.found ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '6px',
              position: 'relative'
            }}>
              <button
                onClick={clearLookupResult}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
                title="Clear result"
              >
                ✕
              </button>

              {lookupResult.found ? (
                <div>
                  <h3 style={{ 
                    color: '#155724', 
                    marginBottom: '15px', 
                    fontSize: '18px',
                    marginTop: 0
                  }}>
                    📊 Nutrition Information: {lookupResult.name}
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      border: '1px solid #c3e6cb'
                    }}>
                      <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>
                        Per 100 grams:
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
                        {lookupResult.caloriesPer100g} cal
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#fff3cd',
                      borderRadius: '4px',
                      border: '2px solid #ffeaa7'
                    }}>
                      <div style={{ fontSize: '14px', color: '#856404', marginBottom: '5px' }}>
                        Per 50 grams:
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>
                        {lookupResult.caloriesPer50g} cal
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
                    💡 Tip: 50 grams is approximately the size of a small to medium portion
                  </div>
                </div>
              ) : (
                <div>
                  <h3 style={{ 
                    color: '#721c24', 
                    marginBottom: '10px', 
                    fontSize: '18px',
                    marginTop: 0
                  }}>
                    ❌ Food Not Found: "{lookupResult.name}"
                  </h3>
                  <p style={{ color: '#721c24', margin: 0 }}>
                    Sorry, we couldn't find nutritional information for this food item. 
                    Try a different name or check the spelling.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: '15px', fontSize: '14px', color: '#6c757d' }}>
          <strong>📝 Note:</strong> Calorie values are calculated assuming the stored data represents calories per 100g (standard nutritional format)
        </div>
      </section>
    </main>
  );
}

export default App;
