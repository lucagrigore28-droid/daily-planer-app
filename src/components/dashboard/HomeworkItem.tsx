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
import { CornerDownLeft, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type HomeworkItemProps = {
  task: HomeworkTask;
};

export default function HomeworkItem({ task }: HomeworkItemProps) {
  const context = useContext(AppContext);
  const [description, setDescription] = useState(task.description);
  const [isCompleted, setIsCompleted] = useState(task.isCompleted);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const handleCompletionChange = (checked: boolean) => {
    setIsCompleted(checked);
    context?.updateTask(task.id, { isCompleted: checked });
  };
  
  const handleSaveDescription = () => {
    setIsSaving(true);
    context?.updateTask(task.id, { description });
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleDelete = () => {
    context?.deleteTask(task.id);
    setIsDeleteDialogOpen(false);
  }
  
  useEffect(() => {
    setDescription(task.description);
    setIsCompleted(task.isCompleted);
  }, [task]);

  const hasChanged = description !== task.description;

  return (
    <>
      <div
        className={cn(
          "transition-all duration-500",
          isCompleted && "opacity-70"
        )}
      >
        <Card className={cn(
          "transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
          isCompleted ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800' : 'bg-card'
        )}>
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
                          "flex-1 text-lg font-medium cursor-pointer transition-colors",
                          isCompleted && "text-muted-foreground line-through"
                      )}
                  >
                    {task.subjectName}
                  </Label>
                  {!isCompleted && <AccordionTrigger className="p-2 [&[data-state=open]>svg]:text-primary" />}
                </div>
                <AccordionContent className="pl-12 pr-4 pt-2 animate-accordion-down">
                  <div className="space-y-3">
                     <Textarea
                      placeholder="Adaugă detalii despre temă..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[80px]"
                     />
                     <div className="flex justify-between items-center">
                        <div>
                            {hasChanged && (
                              <Button size="sm" onClick={handleSaveDescription} disabled={isSaving}>
                                  <CornerDownLeft className="mr-2 h-4 w-4"/>
                                  {isSaving ? 'Se salvează...' : 'Salvează descrierea'}
                              </Button>
                            )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Șterge
                        </Button>
                     </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești absolut sigur?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Tema pentru <strong>{task.subjectName}</strong> va fi ștearsă definitiv.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Da, șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
