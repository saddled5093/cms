
import Link from 'next/link';
import { AppLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ListChecks, LayoutDashboard, BookOpenText } from 'lucide-react';

// No props needed anymore as "New Note" button is managed by specific pages
export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
          <AppLogo className="h-6 w-6 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">یادداشت‌گاه</span>
        </Link>
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
          <Button variant="ghost" asChild className="text-sm font-medium text-muted-foreground hover:text-primary">
            <Link href="/categories">
              <ListChecks className="ml-2 h-4 w-4" />
              مدیریت دسته‌بندی‌ها
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

    