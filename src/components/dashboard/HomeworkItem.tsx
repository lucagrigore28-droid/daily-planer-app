"use client";

import React, { useContext, useState, useEffect } from 'react';
import type { HomeworkTask } from '@/lib/types';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '../ui/button';
import { CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type HomeworkItemProps = {
  task: HomeworkTask;
};

export default function HomeworkItem({ task }: HomeworkItemProps) {
  const context = useContext(AppContext);
  const [description, setDescription] = useState(task.description);
  const [isCompleted, setIsCompleted] = useState(task.isCompleted);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleCompletionChange = (checked: boolean) => {
    setIsCompleted(checked);
    // No fade out, just update the state
    context?.updateTask(task.id, { isCompleted: checked });
  };
  
  const handleSaveDescription = () => {
    setIsSaving(true);
    context?.updateTask(task.id, { description });
    setTimeout(() => setIsSaving(false), 1000);
  };
  
  // Sync local state if task prop changes from context
  useEffect(() => {
    setDescription(task.description);
    setIsCompleted(task.isCompleted);
  }, [task]);

  const hasChanged = description !== task.description;

  return (
    <div
      className={cn(
        "transition-all duration-300",
        isCompleted && "bg-green-500/10 rounded-lg"
        )}
    >
      <Card className={cn(isCompleted ? 'border-green-500/20' : '')}>
        <CardContent className="p-3">
          <Accordion type="single" collapsible disabled={isCompleted}>
            <AccordionItem value="item-1" className="border-b-0">
              <div className="flex items-center gap-4">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={isCompleted}
                  onCheckedChange={handleCompletionChange}
                  className="h-6 w-6 rounded-full"
                />
                <Label 
                    htmlFor={`task-${task.id}`} 
                    className={cn(
                        "flex-1 text-lg font-medium cursor-pointer",
                        isCompleted && "line-through text-muted-foreground"
                    )}
                >
                  {task.subjectName}
                </Label>
                {!isCompleted && <AccordionTrigger className="p-2 [&[data-state=open]>svg]:text-accent" />}
              </div>
              <AccordionContent className="pl-12 pr-4 pt-2">
                <div className="space-y-2">
                   <Textarea
                    placeholder="Adaugă detalii despre temă..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[80px]"
                   />
                   {hasChanged && (
                    <Button size="sm" onClick={handleSaveDescription} disabled={isSaving}>
                        <CornerDownLeft className="mr-2 h-4 w-4"/>
                        {isSaving ? 'Se salvează...' : 'Salvează descrierea'}
                    </Button>
                   )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
