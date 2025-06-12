
"use client"; // Add "use client" because we're using hooks (useAuth)

import Link from 'next/link';
import { AppLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ListChecks, LayoutDashboard, BookOpenText, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { useRouter } from 'next/navigation';

export default function Header() {
  const { currentUser, logout } = useAuth(); // Get currentUser and logout function
  const router = useRouter();

  const handleLogout = () => {
    logout();
    // router.push('/login'); // logout() in AuthContext already handles redirection
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
          <AppLogo className="h-6 w-6 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">یادداشت‌گاه</span>
        </Link>
        
        {currentUser && ( // Only show nav links if user is logged in
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-sm font-medium text-muted-foreground hover:text-primary">
              <Link href="/">
                <LayoutDashboard className="ml-2 h-4 w-4" />
                داشبورد
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-sm font-medium text-muted-foreground hover:text-primary">
              <Link href="/notes">
                <BookOpenText className="ml-2 h-4 w-4" />
                همه یادداشت‌ها
              </Link>
            </Button>
            {currentUser.role === 'ADMIN' && ( // Show only if user is ADMIN
              <Button variant="ghost" asChild className="text-sm font-medium text-muted-foreground hover:text-primary">
                <Link href="/categories">
                  <ListChecks className="ml-2 h-4 w-4" />
                  مدیریت دسته‌بندی‌ها
                </Link>
              </Button>
            )}
          </nav>
        )}

        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <UserCircle className="h-5 w-5" />
              <span>{currentUser.username} ({currentUser.role})</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="ml-2 h-4 w-4" />
              خروج
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
