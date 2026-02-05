
"use client";

import React, { useContext, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { AppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Subject } from '@/lib/types';
import { Slider } from '../ui/slider';
import { Separator } from '@/components/ui/separator';

type AddTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const formatDateForInput = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export default function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const context = useContext(AppContext);
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    if (open) {
      // Reset all fields when dialog opens
      setSelectedSubject(null);
      setDescription('');
      setDueDate(new Date());
      setEstimatedTime(0);
      setScheduledDate(null);
      setScheduledTime('');
    }
  }, [open]);

  const handleAddTask = () => {
    if (!selectedSubject) {
      toast({
        title: 'Câmpuri incomplete',
        description: 'Te rog să selectezi materia.',
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
      estimatedTime: estimatedTime > 0 ? estimatedTime : undefined,
      scheduledDate: scheduledDate ? scheduledDate.toISOString() : undefined,
      scheduledTime: scheduledTime || undefined,
    });
    
    toast({
        title: 'Temă adăugată!',
        description: `Tema pentru "${selectedSubject.name}" a fost adăugată cu succes.`,
    });

    onOpenChange(false);
  };

  const handleSubjectChange = (subjectId: string) => {
    const subject = context?.userData?.subjects.find(s => s.id === subjectId);
    setSelectedSubject(subject || null);
  };
  
  const handleDateChange = (dateString: string, setter: (date: Date) => void) => {
    const date = new Date(dateString + 'T00:00:00');
    setter(date);
  }
  
  const handleScheduledDateChange = (dateString: string) => {
      if (dateString) {
          const date = new Date(dateString + 'T00:00:00');
          setScheduledDate(date);
      } else {
          setScheduledDate(null);
          setScheduledTime(''); // Also clear time if date is cleared
      }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adaugă o temă manuală</DialogTitle>
          <DialogDescription>
            Completează detaliile pentru noua temă.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">

          {/* --- Basic Info --- */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="subject-name">Materie</Label>
            <Select onValueChange={handleSubjectChange} value={selectedSubject?.id || ''}>
                <SelectTrigger id="subject-name">
                    <SelectValue placeholder="Alege materia" />
                </SelectTrigger>
                <SelectContent>
                    {context?.userData?.subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="due-date">Termen Limită</Label>
            <Input
              id="due-date"
              type="date"
              value={formatDateForInput(dueDate)}
              onChange={(e) => handleDateChange(e.target.value, setDueDate)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descriere</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <Separator className="my-2" />

          {/* --- Planning Section --- */}
          <div>
            <h4 className="font-semibold text-md mb-3">Planificare (Opțional)</h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="estimated-time">Timp estimat</Label>
                    <div className="flex items-center gap-4 bg-background rounded-md p-2 border">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Slider 
                            id="estimated-time"
                            value={[estimatedTime]} 
                            max={180} 
                            step={5} 
                            onValueChange={(value) => setEstimatedTime(value[0])}
                            className="flex-1"
                        />
                        <span className="font-bold w-16 text-right">{estimatedTime > 0 ? `${estimatedTime} min` : 'N/A'}</span>
                    </div>
                </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                 <div className="flex flex-col gap-2">
                    <Label htmlFor="scheduled-date">Ziua de lucru</Label>
                     <Input
                        id="scheduled-date"
                        type="date"
                        value={scheduledDate ? formatDateForInput(scheduledDate) : ''}
                        onChange={(e) => handleScheduledDateChange(e.target.value)}
                        />
                 </div>
                 <div className="flex flex-col gap-2">
                    <Label htmlFor="scheduled-time">Ora de început</Label>
                     <Input
                        id="scheduled-time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        disabled={!scheduledDate} // Disable time if no date is set
                        />
                 </div>
             </div>
          </div>

        </div>
        <DialogFooter>
          <Button onClick={handleAddTask}>Adaugă Tema</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
