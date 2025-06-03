interface MacroRecommendationsProps {
  weight: number | string;
  weightUnit: 'kg' | 'lbs';
}

interface MacroCalculations {
  protein: {
    sedentary: string;
    active: string;
    athlete: string;
  };
  carbs: {
    sedentary: string;
    moderate: string;
    veryActive: string;
  };
  fat: {
    minimum: string;
    recommended: string;
  };
}

const MacroRecommendations: React.FC<MacroRecommendationsProps> = ({ weight, weightUnit }) => {
  // Calculate macro recommendations based on weight
  const getMacroRecommendations = (): MacroCalculations | null => {
    const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight;
    if (isNaN(weightNum) || weightNum <= 0) return null;
    
    // Convert to lbs if needed for calculations
    const weightInLbs = weightUnit === 'kg' ? weightNum * 2.20462 : weightNum;
    
    return {
      protein: {
        sedentary: (weightInLbs * 0.8).toFixed(1),
        active: `${(weightInLbs * 1.0).toFixed(1)}-${(weightInLbs * 1.2).toFixed(1)}`,
        athlete: (weightInLbs * 1.4).toFixed(1)
      },
      carbs: {
        sedentary: `${(weightInLbs * 1.5).toFixed(1)}-${(weightInLbs * 2.0).toFixed(1)}`,
        moderate: `${(weightInLbs * 2.0).toFixed(1)}-${(weightInLbs * 2.5).toFixed(1)}`,
        veryActive: `${(weightInLbs * 2.5).toFixed(1)}-${(weightInLbs * 3.0).toFixed(1)}`
      },
      fat: {
        minimum: (weightInLbs * 0.25).toFixed(1),
        recommended: `${(weightInLbs * 0.3).toFixed(1)}-${(weightInLbs * 0.4).toFixed(1)}`
      }
    };
  };

  const macroData = getMacroRecommendations();

  if (!macroData) return null;

  return (
    <div style={{
      marginTop: '20px',
      padding: '20px',
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '6px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#856404', fontSize: '18px' }}>
        📊 Daily Macro Recommendations (grams)
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
        {/* Protein */}
        <div style={{
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #ffeaa7'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#d63384', fontSize: '16px' }}>
            🥩 Protein
          </h4>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <div><strong>Sedentary:</strong> {macroData.protein.sedentary}g</div>
            <div><strong>Active:</strong> {macroData.protein.active}g</div>
            <div><strong>Athlete/Building Muscle:</strong> {macroData.protein.athlete}g</div>
          </div>
        </div>

        {/* Carbohydrates */}
        <div style={{
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #ffeaa7'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#fd7e14', fontSize: '16px' }}>
            🍞 Carbohydrates
          </h4>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <div><strong>Sedentary:</strong> {macroData.carbs.sedentary}g</div>
            <div><strong>Active:</strong> {macroData.carbs.moderate}g</div>
            <div><strong>Athlete/Endurance:</strong> {macroData.carbs.veryActive}g</div>
          </div>
        </div>

        {/* Fats */}
        <div style={{
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #ffeaa7'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#198754', fontSize: '16px' }}>
            🥑 Fats
          </h4>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <div><strong>Minimum:</strong> {macroData.fat.minimum}g</div>
            <div><strong>Recommended:</strong> {macroData.fat.recommended}g</div>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#856404', fontStyle: 'italic' }}>
        💡 These recommendations are based on your body weight. Choose the activity level that best matches your lifestyle.
      </div>
    </div>
  );
};

export default MacroRecommendations; 