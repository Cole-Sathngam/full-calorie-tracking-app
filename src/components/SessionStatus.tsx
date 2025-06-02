import React from 'react';
import { useSessionManager } from '../hooks/useSessionManager';

interface SessionStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

const SessionStatus: React.FC<SessionStatusProps> = ({
  showDetails = false,
  compact = false
}) => {
  const {
    sessionInfo,
    isOnline,
    isRefreshing,
    lastRefresh,
    error,
    refreshSession,
    clearError
  } = useSessionManager();

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

  const getStatusColor = () => {
    if (!isOnline) return '#95a5a6'; // Gray for offline
    if (!sessionInfo.isValid) return '#e74c3c'; // Red for invalid
    if (sessionInfo.isExpiringSoon) return '#f39c12'; // Orange for expiring soon
    return '#27ae60'; // Green for valid
  };

  const getStatusIcon = () => {
    if (!isOnline) return '📵';
    if (!sessionInfo.isValid) return '🔒';
    if (sessionInfo.isExpiringSoon) return '⏰';
    return '✅';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (!sessionInfo.isValid) return 'Session Invalid';
    if (sessionInfo.isExpiringSoon) return 'Expires Soon';
    return 'Session Active';
  };

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 8px',
        borderRadius: '12px',
        backgroundColor: getStatusColor() + '20',
        border: `1px solid ${getStatusColor()}`,
        fontSize: '12px'
      }}>
        <span>{getStatusIcon()}</span>
        <span style={{ color: getStatusColor(), fontWeight: '500' }}>
          {getStatusText()}
        </span>
        {sessionInfo.timeUntilExpiry && (
          <span style={{ color: '#666', fontSize: '11px' }}>
            ({formatTimeRemaining(sessionInfo.timeUntilExpiry)})
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      padding: '15px',
      border: `2px solid ${getStatusColor()}`,
      borderRadius: '8px',
      backgroundColor: getStatusColor() + '10',
      margin: '10px 0'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: showDetails ? '10px' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{getStatusIcon()}</span>
          <span style={{ fontWeight: 'bold', color: getStatusColor() }}>
            {getStatusText()}
          </span>
          {sessionInfo.timeUntilExpiry && (
            <span style={{ color: '#666', fontSize: '14px' }}>
              - {formatTimeRemaining(sessionInfo.timeUntilExpiry)} remaining
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {error && (
            <button
              onClick={clearError}
              style={{
                padding: '4px 8px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              ❌ Clear Error
            </button>
          )}
          
          <button
            onClick={refreshSession}
            disabled={isRefreshing || !isOnline}
            style={{
              padding: '4px 8px',
              backgroundColor: isRefreshing || !isOnline ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: isRefreshing || !isOnline ? 'not-allowed' : 'pointer'
            }}
          >
            {isRefreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '8px',
          backgroundColor: '#fadbd8',
          border: '1px solid #e74c3c',
          borderRadius: '4px',
          marginBottom: showDetails ? '10px' : '0',
          fontSize: '14px',
          color: '#c0392b'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {showDetails && (
        <div style={{
          fontSize: '12px',
          color: '#666',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <div>
            <strong>Connection:</strong> {isOnline ? '🌐 Online' : '📵 Offline'}
          </div>
          {sessionInfo.expiresAt && (
            <div>
              <strong>Expires:</strong> {sessionInfo.expiresAt.toLocaleTimeString()}
            </div>
          )}
          {lastRefresh && (
            <div>
              <strong>Last Refresh:</strong> {lastRefresh.toLocaleTimeString()}
            </div>
          )}
          <div>
            <strong>Status:</strong> {sessionInfo.isValid ? 'Valid' : 'Invalid'}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionStatus; 