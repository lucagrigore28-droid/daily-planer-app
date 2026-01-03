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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Subject } from '@/lib/types';

type AddTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const context = useContext(AppContext);
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleAddTask = () => {
    if (!selectedSubject || !dueDate) {
      toast({
        title: 'Câmpuri incomplete',
        description: 'Te rog să selectezi materia și termenul limită.',
        variant: 'destructive',
      });
      return;
    }

    context?.addTask({
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      description: description.trim(),
      dueDate: dueDate.toISOString(),
      isCompleted: false,
      isManual: true,
    });
    
    toast({
        title: 'Temă adăugată!',
        description: `Tema pentru "${selectedSubject.name}" a fost adăugată cu succes.`,
    });

    // Reset form and close dialog
    setSelectedSubject(null);
    setDescription('');
    setDueDate(new Date());
    onOpenChange(false);
  };

  const handleSubjectChange = (subjectId: string) => {
    const subject = context?.userData.subjects.find(s => s.id === subjectId);
    setSelectedSubject(subject || null);
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    setDueDate(date);
    setIsCalendarOpen(false);
  }

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
            <Select onValueChange={handleSubjectChange} value={selectedSubject?.id}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Alege materia" />
                </SelectTrigger>
                <SelectContent>
                    {context?.userData.subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="due-date" className="text-right">Termen</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal col-span-3",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP", { locale: ro }) : <span>Alege o dată</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  locale={ro}
                  classNames={{
                    day_selected: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90 rounded-lg',
                    day_today: 'bg-accent/50 rounded-lg',
                    day: 'h-12 w-12 text-base rounded-lg',
                    head_cell: 'text-muted-foreground rounded-md w-12 font-normal text-sm',
                    row: 'flex w-full mt-2',
                    cell: 'text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
                    caption: 'flex items-center justify-between pt-1 px-2 relative',
                    caption_label: 'text-xl font-extrabold text-primary uppercase',
                    nav_button_previous: 'h-8 w-8',
                    nav_button_next: 'h-8 w-8',
                  }}
                  components={{
                    CaptionLabel: ({ displayMonth }) => (
                      <>
                        <span className="text-xl font-extrabold text-primary uppercase">
                          {format(displayMonth, 'LLLL', { locale: ro })}
                        </span>
                        <span className="text-xl font-extrabold text-foreground ml-2">
                          {format(displayMonth, 'yyyy', { locale: ro })}
                        </span>
                      </>
                    )
                  }}
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
