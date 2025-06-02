import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface AppWrapperProps {
  children: React.ReactNode;
}

const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  const { authStatus } = useAuthenticator();
  const isAuthenticated = authStatus === 'authenticated';

  return (
    <div className={isAuthenticated ? 'app-container' : 'auth-container'}>
      {children}
    </div>
  );
};

export default AppWrapper; 