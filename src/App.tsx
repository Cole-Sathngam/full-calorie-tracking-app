import { useState, useRef } from "react";
import { useEnhancedAuth } from "./hooks/useEnhancedAuth";
import ErrorDisplay from "./components/ErrorDisplay";
import FoodSearchCombobox from "./components/FoodSearchCombobox";
import FoodLog, { FoodLogRef } from "./components/FoodLog";
import MacroRecommendations from "./components/MacroRecommendations";
import { apiClient, ApiError, Food } from "./services/apiClient";

interface DisplayError {
  code: string;
  message: string;
  name: string;
}

// Interface for food lookup results
interface FoodLookupResult {
  name: string;
  caloriesPer100g: number;
  caloriesPerPortion: number;
  proteinPer100g: number;
  proteinPerPortion: number;
  carbsPer100g: number;
  carbsPerPortion: number;
  fatPer100g: number;
  fatPerPortion: number;
  portionSize: number;
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

  // State for weight tracking
  const [currentWeight, setCurrentWeight] = useState<number | string>('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('lbs');

  // State for calorie lookup feature
  const [lookupResult, setLookupResult] = useState<FoodLookupResult | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [currentInputValue, setCurrentInputValue] = useState("");
  const [gramInput, setGramInput] = useState<string>("100");

  // Ref to access FoodLog component methods
  const foodLogRef = useRef<FoodLogRef>(null);

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

  // Handle weight input changes
  const handleWeightChange = (value: string) => {
    // Allow empty string or valid numbers (including decimals)
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCurrentWeight(value);
    }
  };

  // Convert weight between units for display
  const getConvertedWeight = () => {
    const weight = typeof currentWeight === 'string' ? parseFloat(currentWeight) : currentWeight;
    if (isNaN(weight) || weight <= 0) return null;
    
    if (weightUnit === 'kg') {
      return {
        primary: `${weight} kg`,
        secondary: `${(weight * 2.20462).toFixed(1)} lbs`
      };
    } else {
      return {
        primary: `${weight} lbs`,
        secondary: `${(weight / 2.20462).toFixed(1)} kg`
      };
    }
  };

  // Handle selection from combobox
  const handleFoodSelection = (selectedFood: Food | null) => {
    if (selectedFood) {
      // Calculate nutrition based on exact gram input
      const gramValue = Number(gramInput) || 0;
      const caloriesPer100g = selectedFood.calories;
      const caloriesPerPortion = Math.round((caloriesPer100g / 100) * gramValue);
      
      setLookupResult({
        name: selectedFood.name,
        caloriesPer100g,
        caloriesPerPortion,
        proteinPer100g: selectedFood.protein,
        proteinPerPortion: Math.round(((selectedFood.protein / 100) * gramValue) * 10) / 10,
        carbsPer100g: selectedFood.carbs,
        carbsPerPortion: Math.round(((selectedFood.carbs / 100) * gramValue) * 10) / 10,
        fatPer100g: selectedFood.fat,
        fatPerPortion: Math.round(((selectedFood.fat / 100) * gramValue) * 10) / 10,
        portionSize: gramValue,
        found: true
      });

      // Note: No longer automatically adding to food log here
    }
  };

  // Handle adding food to log (separate from selection)
  const handleAddToLog = () => {
    if (lookupResult && lookupResult.found) {
      foodLogRef.current?.addFood(
        lookupResult.name, 
        lookupResult.caloriesPer100g, 
        lookupResult.proteinPer100g, 
        lookupResult.carbsPer100g, 
        lookupResult.fatPer100g, 
        lookupResult.portionSize
      );
    }
  };

  // Handle input changes from combobox
  const handleInputChange = (value: string) => {
    setCurrentInputValue(value);
    setLookupResult(null); // Clear previous result
  };

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
        const food = results[0] as Food;
        const gramValue = Number(gramInput) || 0;
        const caloriesPer100g = food.calories;
        const caloriesPerPortion = Math.round((caloriesPer100g / 100) * gramValue);
        
        setLookupResult({
          name: food.name,
          caloriesPer100g,
          caloriesPerPortion,
          proteinPer100g: food.protein,
          proteinPerPortion: Math.round(((food.protein / 100) * gramValue) * 10) / 10,
          carbsPer100g: food.carbs,
          carbsPerPortion: Math.round(((food.carbs / 100) * gramValue) * 10) / 10,
          fatPer100g: food.fat,
          fatPerPortion: Math.round(((food.fat / 100) * gramValue) * 10) / 10,
          portionSize: gramValue,
          found: true
        });

        // Note: No longer automatically adding to food log here
      } else {
        const gramValue = Number(gramInput) || 0;
        setLookupResult({
          name: searchTerm.trim(),
          caloriesPer100g: 0,
          caloriesPerPortion: 0,
          proteinPer100g: 0,
          proteinPerPortion: 0,
          carbsPer100g: 0,
          carbsPerPortion: 0,
          fatPer100g: 0,
          fatPerPortion: 0,
          portionSize: gramValue,
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
    setCurrentInputValue("");
  };

  return (
    <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Dashboard */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#495057', fontSize: '24px' }}>
            Dashboard
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
            Welcome back, {user?.signInDetails?.loginId || user?.username}
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            backgroundColor: '#e8f5e8',
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            color: '#155724',
            fontWeight: '500'
          }}>
            🟢 Online
          </div>
          
          <button
            onClick={signOut}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
          >
            Sign Out
          </button>
        </div>
      </div>

      {apiError && (
        <div style={{ marginBottom: '20px' }}>
          <ErrorDisplay
            error={apiError}
            title="API Error"
            onRetry={clearApiError}
          />
        </div>
      )}

      {/* Weight Input Section */}
      <section style={{ 
        padding: '25px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '10px',
        border: '1px solid #90caf9',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#1565c0', marginBottom: '20px' }}>
          ⚖️ Current Weight
        </h2>
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: 'white', 
          borderRadius: '6px',
          border: '1px solid #90caf9'
        }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={currentWeight}
                onChange={(e) => handleWeightChange(e.target.value)}
                placeholder="Enter your weight..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '2px solid #e3f2fd',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1976d2'}
                onBlur={(e) => e.target.style.borderColor = '#e3f2fd'}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setWeightUnit('lbs')}
                style={{
                  padding: '12px 20px',
                  backgroundColor: weightUnit === 'lbs' ? '#1976d2' : '#f5f5f5',
                  color: weightUnit === 'lbs' ? 'white' : '#666',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                lbs
              </button>
              <button
                onClick={() => setWeightUnit('kg')}
                style={{
                  padding: '12px 20px',
                  backgroundColor: weightUnit === 'kg' ? '#1976d2' : '#f5f5f5',
                  color: weightUnit === 'kg' ? 'white' : '#666',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                kg
              </button>
            </div>
          </div>

          {/* Weight Display */}
          {getConvertedWeight() && (
            <div style={{
              padding: '15px',
              backgroundColor: '#e8f5e8',
              border: '1px solid #c3e6cb',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724', marginBottom: '5px' }}>
                {getConvertedWeight()?.primary}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                ({getConvertedWeight()?.secondary})
              </div>
            </div>
          )}

          {/* Macro Recommendations */}
          <MacroRecommendations weight={typeof currentWeight === 'string' ? parseFloat(currentWeight) : currentWeight} weightUnit={weightUnit} />
          
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#6c757d' }}>
            <strong>💡 Tip:</strong> Tracking your weight helps with accurate calorie and nutrition planning
          </div>
        </div>
      </section>

      {/* Calorie Lookup Section with FoodSearchCombobox */}
      <section style={{ 
        padding: '25px', 
        backgroundColor: '#e8f5e8', 
        borderRadius: '10px',
        border: '1px solid #c3e6cb',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#155724', marginBottom: '20px' }}>
          🔍 Food Lookup - Custom Portion Size
        </h2>
        
        <div style={{ 
          padding: '15px', 
          backgroundColor: 'white', 
          borderRadius: '6px',
          border: '1px solid #c3e6cb'
        }}>
          {/* Input Row */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <FoodSearchCombobox
                placeholder="Enter food name (e.g., Apple, Chicken Breast)..."
                onSelection={handleFoodSelection}
                onInputChange={handleInputChange}
                disabled={isLookupLoading}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="number"
                value={gramInput}
                onChange={(e) => {
                  const value = e.target.value;
                  // Prevent leading zeros (except for just "0" temporarily)
                  if (value.length > 1 && value.startsWith('0') && value[1] !== '.') {
                    return; // Don't allow leading zeros like "01", "02", etc.
                  }
                  setGramInput(value);
                }}
                onBlur={(e) => {
                  const num = Number(e.target.value);
                  if (isNaN(num) || num < 1) {
                    setGramInput("1");
                  } else if (num > 2000) {
                    setGramInput("2000");
                  }
                }}
                min="1"
                max="2000"
                style={{
                  width: '80px',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid #e3f2fd',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
              <span style={{ fontSize: '14px', color: '#6c757d', whiteSpace: 'nowrap' }}>grams</span>
            </div>
            
            <button 
              onClick={() => handleCalorieLookup(currentInputValue)}
              disabled={isLookupLoading || !currentInputValue.trim()}
              style={{ 
                padding: '12px 20px', 
                backgroundColor: isLookupLoading || !currentInputValue.trim() ? '#95a5a6' : '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: isLookupLoading || !currentInputValue.trim() ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}
            >
              {isLookupLoading ? '⏳ Looking up...' : '🔍 Lookup'}
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
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#155724', marginBottom: '8px' }}>
                        {lookupResult.caloriesPer100g} cal
                      </div>
                      <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ color: '#d63384' }}>Protein: {lookupResult.proteinPer100g}g</div>
                        <div style={{ color: '#fd7e14' }}>Carbs: {lookupResult.carbsPer100g}g</div>
                        <div style={{ color: '#198754' }}>Fat: {lookupResult.fatPer100g}g</div>
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#fff3cd',
                      borderRadius: '4px',
                      border: '2px solid #ffeaa7'
                    }}>
                      <div style={{ fontSize: '14px', color: '#856404', marginBottom: '5px' }}>
                        Per {lookupResult.portionSize} grams:
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#856404', marginBottom: '8px' }}>
                        {lookupResult.caloriesPerPortion} cal
                      </div>
                      <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ color: '#d63384' }}>Protein: {lookupResult.proteinPerPortion}g</div>
                        <div style={{ color: '#fd7e14' }}>Carbs: {lookupResult.carbsPerPortion}g</div>
                        <div style={{ color: '#198754' }}>Fat: {lookupResult.fatPerPortion}g</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
                    💡 Tip: Adjust the gram amount above to match your actual portion size for precise nutrition tracking
                  </div>
                  
                  {/* Add to Log Button */}
                  <div style={{ marginTop: '15px', textAlign: 'center' }}>
                    <button
                      onClick={handleAddToLog}
                      style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,123,255,0.3)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
                    >
                      📝 Add to Food Log
                    </button>
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
          <strong>📝 Note:</strong> Enter any portion size in grams. All nutritional values are automatically calculated based on your custom portion size.
        </div>
      </section>

      {/* Food Log Component */}
      <FoodLog ref={foodLogRef} />
    </main>
  );
}

export default App;
