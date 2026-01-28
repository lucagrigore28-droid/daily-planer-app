'use client';

import React, { useContext, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import HomeworkItem from './HomeworkItem';
import { CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function AllTasksView() {
  const context = useContext(AppContext);
  const { tasks } = context!;

  const allVisibleTasks = useMemo(() => {
    if (!tasks) return [];
    
    // Filter for incomplete and unlocked tasks, then sort by due date
    return tasks
      .filter(task => !task.isCompleted && !task.isLocked)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  }, [tasks]);

  if (allVisibleTasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold">Felicitări!</h3>
            <p className="text-muted-foreground">Nu mai ai nicio temă de făcut. Ești la zi!</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
        <CardContent className="p-4">
            <h2 className="text-2xl font-semibold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
                Toate temele active
            </h2>
            <div className="space-y-4">
                {allVisibleTasks.map(task => (
                     <div key={task.id} className="flex items-center justify-between gap-4">
                        <div className="flex-grow"><HomeworkItem task={task} /></div>
                        <div className="flex-shrink-0 w-28 text-right text-sm text-muted-foreground">
                            <p className="font-semibold">{format(new Date(task.dueDate), "EEEE", { locale: ro })}</p>
                            <p>{format(new Date(task.dueDate), "d MMMM", { locale: ro })}</p>
                        </div>
                     </div>
                ))}
            </div>
        </CardContent>
    </Card>
  );
}
