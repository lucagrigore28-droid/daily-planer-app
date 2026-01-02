"use client";

import React, { useContext, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { AppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type AddTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const context = useContext(AppContext);
  const { toast } = useToast();
  const [subjectName, setSubjectName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());

  const handleAddTask = () => {
    if (!subjectName.trim() || !dueDate) {
      toast({
        title: 'Câmpuri incomplete',
        description: 'Te rog să introduci numele materiei și termenul limită.',
        variant: 'destructive',
      });
      return;
    }

    context?.addTask({
      subjectId: 'manual_' + subjectName.toLowerCase().replace(/\s/g, '_'),
      subjectName: subjectName.trim(),
      description: description.trim(),
      dueDate: dueDate.toISOString(),
      isCompleted: false,
      isManual: true,
    });
    
    toast({
        title: 'Temă adăugată!',
        description: `Tema pentru "${subjectName}" a fost adăugată cu succes.`,
    });

    // Reset form and close dialog
    setSubjectName('');
    setDescription('');
    setDueDate(new Date());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adaugă o temă manuală</DialogTitle>
          <DialogDescription>
            Completează detaliile pentru noua temă.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject-name" className="text-right">Materie</Label>
            <Input id="subject-name" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="due-date" className="text-right">Termen</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal col-span-3",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP", { locale: ro }) : <span>Alege o dată</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">Descriere</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAddTask}>Adaugă Tema</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
