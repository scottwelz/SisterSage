import { BriefcaseBusiness, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-2">
        <BriefcaseBusiness className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Stock Pilot</h1>
      </div>
      <div className="ml-auto">
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </div>
    </header>
  );
}
