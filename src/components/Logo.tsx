import { BookOpenCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2 text-primary", className)}>
      <BookOpenCheck className="h-8 w-8" />
      <span className="text-xl font-bold text-foreground">Daily Planner Pro</span>
    </div>
  );
}
