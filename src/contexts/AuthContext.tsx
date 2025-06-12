
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@prisma/client'; // Assuming User type from Prisma

interface AuthContextType {
  currentUser: User | null;
  login: (username_or_email: string, password_raw: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (username: string, password_raw: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: password_raw }),
      });
      
      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `Login failed with status: ${response.status}`;
        try {
          // Try to parse the response text as JSON if it's an error
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If parsing fails, the responseText itself might be the error (e.g., HTML)
          // For development, you might want to log responseText, but avoid showing it directly to the user in production.
          console.error("Non-JSON error response from /api/auth/login. Status:", response.status, "Body:", responseText);
        }
        throw new Error(errorMessage);
      }
      
      // If response.ok is true, we expect valid JSON
      const data = JSON.parse(responseText); 
      
      const loggedInUser = data.user as User;
      setCurrentUser(loggedInUser);
      localStorage.setItem('noterAppUser', JSON.stringify(loggedInUser));
      router.push('/'); 
      return true;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.');
      setCurrentUser(null);
      localStorage.removeItem('noterAppUser');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('noterAppUser');
    router.push('/login');
  }, [router]);

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedUser = localStorage.getItem('noterAppUser');
      if (storedUser) {
        const user = JSON.parse(storedUser) as User;
        setCurrentUser(user);
      }
    } catch (e) {
      // Invalid JSON or other error, ensure user is logged out
      console.error("Failed to load user from localStorage", e);
      setCurrentUser(null);
      localStorage.removeItem('noterAppUser');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to handle redirection based on auth state
  useEffect(() => {
    if (!isLoading && !currentUser && pathname !== '/login') {
      router.push('/login');
    }
  }, [isLoading, currentUser, pathname, router]);


  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

