'use client';
import type { PersonalEvent } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function EventItem({ event }: { event: PersonalEvent }) {
  return (
    <Card className="bg-card/90 border-l-4 border-accent">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <p className="font-semibold">{event.title}</p>
            {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
          </div>
          {(event.startTime || event.endTime) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Clock className="h-3 w-3" />
                <span>
                  {event.startTime} {event.endTime ? ` - ${event.endTime}` : ''}
                </span>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
