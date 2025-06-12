
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@prisma/client';

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
  const [isLoading, setIsLoading] = useState(true); // Start as true
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
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Non-JSON error response from /api/auth/login. Status:", response.status, "Body:", responseText);
        }
        throw new Error(errorMessage);
      }
      
      const data = JSON.parse(responseText); 
      
      // Ensure the user object from API aligns with Prisma's User type or is cast appropriately.
      // The API returns { id, username, role }. Prisma User has more fields.
      // For context, this partial user is fine as long as 'id' is correct.
      const loggedInUser = data.user as User; 
      setCurrentUser(loggedInUser);
      router.push('/'); 
      return true;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.');
      setCurrentUser(null); // Ensure currentUser is null on login failure
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    setCurrentUser(null); 
    router.push('/login'); 
  }, [router]);

  // Effect to check authentication status on initial load
  useEffect(() => {
    // In a real app, you might check a token here.
    // For this app, we assume no persistent session beyond page reloads,
    // so currentUser starts as null.
    setIsLoading(false); // Finished initial "check" (which is none here)
  }, []); 

  // Effect for route protection
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
