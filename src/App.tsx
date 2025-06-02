import { useState, useRef, useEffect } from "react";
import { useEnhancedAuth } from "./hooks/useEnhancedAuth";
import SessionIndicator from "./components/SessionIndicator";
import ErrorDisplay from "./components/ErrorDisplay";
import { apiClient, ApiError, Food } from "./services/apiClient";

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
  const { user, signOut } = useEnhancedAuth(); // Enhanced but still uses Amplify
  const [apiError, setApiError] = useState<DisplayError | null>(null);

  // New state for calorie lookup feature
  const [lookupTerm, setLookupTerm] = useState("");
  const [lookupResult, setLookupResult] = useState<FoodLookupResult | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Food[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // Autocomplete functions
  const fetchSuggestions = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      const results = await apiClient.searchFood(searchTerm);
      setSuggestions(results.slice(0, 10)); // Limit to 10 suggestions
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
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
    }, 300); // 300ms delay
  };

  const handleInputChange = (value: string) => {
    setLookupTerm(value);
    setLookupResult(null); // Clear previous result
    debouncedFetchSuggestions(value);
  };

  const selectSuggestion = (suggestion: Food) => {
    setLookupTerm(suggestion.name);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // Automatically trigger lookup for selected suggestion
    const caloriesPer100g = suggestion.calories;
    const caloriesPer50g = Math.round((caloriesPer100g / 100) * 50);
    
    setLookupResult({
      name: suggestion.name,
      caloriesPer100g,
      caloriesPer50g,
      found: true
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        } else {
          handleCalorieLookup();
        }
        break;
      case 'Escape':
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
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

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideInput = inputRef.current && inputRef.current.contains(target);
      const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(target);
      
      if (!isInsideInput && !isInsideDropdown) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSuggestions]);

  // New function for calorie lookup
  const handleCalorieLookup = async () => {
    if (!lookupTerm.trim()) {
      alert("Please enter a food name to lookup calories");
      return;
    }

    try {
      setIsLookupLoading(true);
      setApiError(null);
      
      const results = await apiClient.searchFood(lookupTerm.trim());
      console.log('🔍 Lookup Results:', results);
      
      if (results.length > 0) {
        // Take the first matching result
        const food = results[0] as { name: string; calories: number };
        
        // Assume the stored calories are per 100g (standard nutritional info)
        // Calculate calories per 50g
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
          name: lookupTerm.trim(),
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
    setLookupTerm("");
  };

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

      {/* Session Management - Shows session status and auth errors */}
      <SessionIndicator showDetails />

      {/* API Error Display */}
      {apiError && (
        <div style={{ marginBottom: '20px' }}>
          <ErrorDisplay
            error={apiError}
            title="API Error"
            onRetry={clearApiError}
          />
        </div>
      )}

      {/* NEW: Calorie Lookup Section */}
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
                ref={inputRef}
                type="text" 
                value={lookupTerm}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Enter food name (e.g., Apple, Chicken Breast)..."
                disabled={isLookupLoading}
                style={{ 
                  width: '100%',
                  padding: '12px', 
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                onKeyDown={handleKeyDown}
              />
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={dropdownRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ced4da',
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      onClick={() => selectSuggestion(suggestion)}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        backgroundColor: selectedSuggestionIndex === index ? '#e9ecef' : 'white',
                        borderBottom: index < suggestions.length - 1 ? '1px solid #e9ecef' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    >
                      <span style={{ fontWeight: '500' }}>{suggestion.name}</span>
                      <span style={{ fontSize: '14px', color: '#6c757d' }}>
                        {suggestion.calories} cal/100g
                      </span>
                    </div>
                  ))}
                  
                  {isLoadingSuggestions && (
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
              )}
            </div>
            
            <button 
              onClick={handleCalorieLookup}
              disabled={isLookupLoading || !lookupTerm.trim()}
              style={{ 
                padding: '12px 20px', 
                backgroundColor: isLookupLoading || !lookupTerm.trim() ? '#95a5a6' : '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: isLookupLoading || !lookupTerm.trim() ? 'not-allowed' : 'pointer',
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
