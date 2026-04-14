import { createContext, useContext } from 'react';

interface AuthContextValue {
  onLogout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  onLogout: () => {},
});

export const useAuth = () => useContext(AuthContext);
