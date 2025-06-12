
"use client"; 

import Link from 'next/link';
import { AppLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ListChecks, LayoutDashboard, BookOpenText, LogOut, UserCircle, Globe, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; 
import { useRouter } from 'next/navigation';

export default function Header() {
  const { currentUser, logout } = useAuth(); 
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
          <AppLogo className="h-6 w-6 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">یادداشت‌گاه</span>
        </Link>
        
        <nav className="flex items-center gap-1 md:gap-2">
          {currentUser && (
            <Button variant="ghost" asChild className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary">
              <Link href="/">
                <LayoutDashboard className="ml-1 md:ml-2 h-4 w-4" />
                داشبورد
              </Link>
            </Button>
          )}
          <Button variant="ghost" asChild className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary">
            <Link href="/all-notes">
              <Globe className="ml-1 md:ml-2 h-4 w-4" />
              همه یادداشت‌ها
            </Link>
          </Button>
          {currentUser && (
            <>
              <Button variant="ghost" asChild className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary">
                <Link href="/my-notes">
                  <User className="ml-1 md:ml-2 h-4 w-4" />
                  یادداشت‌های من
                </Link>
              </Button>
              {currentUser.role === 'ADMIN' && ( 
                <Button variant="ghost" asChild className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary">
                  <Link href="/categories">
                    <ListChecks className="ml-1 md:ml-2 h-4 w-4" />
                    دسته‌بندی‌ها
                  </Link>
                </Button>
              )}
            </>
          )}
        </nav>

        {currentUser && (
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
              <UserCircle className="h-5 w-5" />
              <span>{currentUser.username} ({currentUser.role})</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="ml-1 md:ml-2 h-4 w-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        )}
        {!currentUser && (
           <Button variant="outline" size="sm" asChild>
             <Link href="/login">
                ورود
             </Link>
           </Button>
        )}
      </div>
    </header>
  );
}
