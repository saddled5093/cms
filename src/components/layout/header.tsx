import Link from 'next/link';
import { AppLogo } from '@/components/icons';

interface HeaderProps {
  onNewNoteClick: () => void;
}

export default function Header({ onNewNoteClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <AppLogo className="h-6 w-6 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">یادداشت‌گاه</span>
        </Link>
        {/* "New Note" button moved to page.tsx for better state management access */}
      </div>
    </header>
  );
}
