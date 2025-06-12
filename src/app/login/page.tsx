
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import { AppLogo } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error: authError, clearError, currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      router.push('/'); // Redirect if already logged in
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError(); // Clear previous errors
    await login(username, password);
    // Navigation is handled by the login function or the AuthContext effect
  };

  // Don't render the form if the user is already logged in and redirection is in progress
  if (currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <p className="text-foreground">در حال هدایت به داشبورد...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="space-y-1 text-center">
           <div className="flex justify-center items-center mb-4">
            <AppLogo className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">ورود به یادداشت‌گاه</CardTitle>
          <CardDescription className="text-muted-foreground">
            نام کاربری و رمز عبور خود را وارد کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {authError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطا در ورود</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username_login">نام کاربری</Label>
              <Input
                id="username_login"
                type="text"
                placeholder="مثال: admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-input text-foreground"
                autoComplete="username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password_login">رمز عبور</Label>
              <Input
                id="password_login"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-input text-foreground"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? 'در حال ورود...' : 'ورود'}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-xs text-center block text-muted-foreground">
           نام کاربری/رمز عبور پیش‌فرض برای ادمین: admin/123
           <br />
           نام کاربری/رمز عبور پیش‌فرض برای کاربران: userX/123
        </CardFooter>
      </Card>
    </div>
  );
}
