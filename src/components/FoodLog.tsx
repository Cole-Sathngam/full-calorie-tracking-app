import { useState, useImperativeHandle, forwardRef } from "react";

// Interface for logged food items
interface LoggedFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portionSize: number; // grams
  timestamp: Date;
}

// Interface for the component props
interface FoodLogProps {
  className?: string;
  style?: React.CSSProperties;
}

// Interface for the ref methods that parent can call
export interface FoodLogRef {
  addFood: (name: string, calories: number, protein: number, carbs: number, fat: number, portionSize?: number) => void;
}

const FoodLog = forwardRef<FoodLogRef, FoodLogProps>(({ className, style }, ref) => {
  // State for food log
  const [foodLog, setFoodLog] = useState<LoggedFood[]>([]);

  // Add food to log
  const addToFoodLog = (name: string, calories: number, protein: number, carbs: number, fat: number, portionSize: number = 50) => {
    const newLogEntry: LoggedFood = {
      id: Date.now().toString(),
      name,
      calories: Math.round((calories / 100) * portionSize),
      protein: Math.round(((protein / 100) * portionSize) * 10) / 10, // Round to 1 decimal
      carbs: Math.round(((carbs / 100) * portionSize) * 10) / 10,
      fat: Math.round(((fat / 100) * portionSize) * 10) / 10,
      portionSize,
      timestamp: new Date()
    };
    setFoodLog(prev => [newLogEntry, ...prev]); // Add to beginning of array
  };

  // Remove food from log
  const removeFromFoodLog = (id: string) => {
    setFoodLog(prev => prev.filter(item => item.id !== id));
  };

  // Clear entire food log
  const clearFoodLog = () => {
    setFoodLog([]);
  };

  // Calculate total calories for the day
  const getTotalCalories = () => {
    return foodLog.reduce((total, food) => total + food.calories, 0);
  };

  // Calculate total protein for the day
  const getTotalProtein = () => {
    return Math.round(foodLog.reduce((total, food) => total + food.protein, 0) * 10) / 10;
  };

  // Calculate total carbs for the day
  const getTotalCarbs = () => {
    return Math.round(foodLog.reduce((total, food) => total + food.carbs, 0) * 10) / 10;
  };

  // Calculate total fat for the day
  const getTotalFat = () => {
    return Math.round(foodLog.reduce((total, food) => total + food.fat, 0) * 10) / 10;
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    addFood: addToFoodLog
  }));

  return (
    <section style={{ 
      padding: '25px', 
      backgroundColor: '#fff3cd', 
      borderRadius: '10px',
      border: '1px solid #ffeaa7',
      marginBottom: '30px',
      ...style
    }} className={className}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#856404', margin: 0 }}>
          📋 Food Log
        </h2>
        {foodLog.length > 0 && (
          <button
            onClick={clearFoodLog}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {foodLog.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#856404',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #ffeaa7'
        }}>
          <p style={{ margin: 0, fontSize: '16px' }}>
            🍽️ No foods logged yet
          </p>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
            Search and select foods above to start tracking your calories
          </p>
        </div>
      ) : (
        <>
          {/* Total Calories Display */}
          <div style={{
            backgroundColor: '#e8f5e8',
            padding: '15px',
            borderRadius: '6px',
            border: '1px solid #c3e6cb',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#155724', marginBottom: '5px' }}>
              Daily Totals
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
                  {getTotalCalories()}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Calories</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d63384' }}>
                  {getTotalProtein()}g
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Protein</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fd7e14' }}>
                  {getTotalCarbs()}g
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Carbs</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#198754' }}>
                  {getTotalFat()}g
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Fat</div>
              </div>
            </div>
          </div>

          {/* Food Log Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {foodLog.map((food) => (
              <div
                key={food.id}
                style={{
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '6px',
                  border: '1px solid #ffeaa7',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', color: '#495057', marginBottom: '5px' }}>
                    {food.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '3px' }}>
                    {food.portionSize}g • {food.calories} calories • {food.timestamp.toLocaleTimeString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d', display: 'flex', gap: '10px' }}>
                    <span style={{ color: '#d63384' }}>{food.protein}g</span>
                    <span style={{ color: '#fd7e14' }}>{food.carbs}g</span>
                    <span style={{ color: '#198754' }}>{food.fat}g</span>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFromFoodLog(food.id)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#dc3545',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '5px'
                  }}
                  title="Remove from log"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
});

FoodLog.displayName = 'FoodLog';

export default FoodLog; 