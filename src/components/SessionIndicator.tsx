import React from 'react';
import { useEnhancedAuth } from '../hooks/useEnhancedAuth';

interface SessionIndicatorProps {
  showDetails?: boolean;
}

const SessionIndicator: React.FC<SessionIndicatorProps> = ({ showDetails = false }) => {
  const { sessionInfo, authError, isRefreshing, refreshSession, clearError } = useEnhancedAuth();

  const formatTimeRemaining = (milliseconds: number | null): string => {
    if (!milliseconds || milliseconds <= 0) return 'Expired';
    
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Don't show anything if not authenticated
  if (!sessionInfo.isValid && !authError) {
    return null;
  }

  return (
    <div style={{ marginBottom: '10px' }}>
      {/* Session Status */}
      {sessionInfo.isValid && (
        <div style={{
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: sessionInfo.isExpiringSoon ? '#fff3cd' : '#d4edda',
          border: `1px solid ${sessionInfo.isExpiringSoon ? '#ffeaa7' : '#c3e6cb'}`,
          color: sessionInfo.isExpiringSoon ? '#856404' : '#155724',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            {sessionInfo.isExpiringSoon ? '⏰' : '✅'} Session {sessionInfo.isExpiringSoon ? 'expires soon' : 'active'}
            {sessionInfo.timeUntilExpiry && ` (${formatTimeRemaining(sessionInfo.timeUntilExpiry)} remaining)`}
          </span>
          
          {sessionInfo.isExpiringSoon && (
            <button
              onClick={refreshSession}
              disabled={isRefreshing}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: '#ffc107',
                color: '#212529',
                border: 'none',
                borderRadius: '4px',
                cursor: isRefreshing ? 'not-allowed' : 'pointer'
              }}
            >
              {isRefreshing ? '⏳' : '🔄'} {isRefreshing ? 'Refreshing...' : 'Extend'}
            </button>
          )}
        </div>
      )}

      {/* Auth Error */}
      {authError && (
        <div style={{
          padding: '12px',
          borderRadius: '6px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          fontSize: '14px',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <strong>⚠️ Authentication Issue:</strong> {authError.message}
            </span>
            <button
              onClick={clearError}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✕ Dismiss
            </button>
          </div>
          
          {showDetails && (
            <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
              Error Code: {authError.code} | Time: {authError.timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionIndicator; 