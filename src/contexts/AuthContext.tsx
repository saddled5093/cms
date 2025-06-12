
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@prisma/client'; // Assuming User type from Prisma
// UserRole enum is no longer directly imported as it's represented by string in schema for SQLite

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
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Non-JSON error response from /api/auth/login. Status:", response.status, "Body:", responseText);
        }
        throw new Error(errorMessage);
      }
      
      const data = JSON.parse(responseText); 
      
      const loggedInUser = data.user as User; // User type from Prisma will have role: string
      setCurrentUser(loggedInUser);
      router.push('/'); 
      return true;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.');
      setCurrentUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    setCurrentUser(null); 
    router.push('/login'); 
  }, [router]);

  useEffect(() => {
    setIsLoading(true);
    // Temporarily default to admin user
    const defaultAdminUser: User = {
      id: 'default-admin-id', // Placeholder ID
      username: 'admin',
      role: "ADMIN", // Role is now a string literal
      password: '', // Password hash is not stored/used on client
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentUser(defaultAdminUser);
    setIsLoading(false);
  }, []); 

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
