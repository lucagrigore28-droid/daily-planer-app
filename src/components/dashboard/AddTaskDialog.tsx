"use client";

import React, { useContext, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { AppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Subject } from '@/lib/types';
import { Slider } from '../ui/slider';

type AddTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Helper function to format date to YYYY-MM-DD for the input
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

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setSelectedSubject(null);
      setDescription('');
      setDueDate(new Date());
      setEstimatedTime(0);
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
    });
    
    toast({
        title: 'Temă adăugată!',
        description: `Tema pentru "${selectedSubject.name}" a fost adăugată cu succes.`,
    });

    onOpenChange(false);
  };

  const handleSubjectChange = (subjectId: string) => {
    const subject = context?.userData.subjects.find(s => s.id === subjectId);
    setSelectedSubject(subject || null);
  };
  
  const handleDateChange = (dateString: string) => {
    // The input gives a YYYY-MM-DD string. We need to parse it correctly.
    // Parsing as ISO and adding timezone info to avoid off-by-one day errors.
    const date = new Date(dateString + 'T00:00:00');
    setDueDate(date);
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
            <Select onValueChange={handleSubjectChange} value={selectedSubject?.id || ''}>
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
            <Input
              id="due-date"
              type="date"
              value={formatDateForInput(dueDate)}
              onChange={(e) => handleDateChange(e.target.value)}
              className="col-span-3"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="estimated-time" className="text-right">Timp estimat</Label>
            <div className="col-span-3 flex items-center gap-4">
                <Slider 
                    value={[estimatedTime]} 
                    max={180} 
                    step={5} 
                    onValueChange={(value) => setEstimatedTime(value[0])}
                    className="flex-1"
                />
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold w-12 text-right">{estimatedTime > 0 ? `${estimatedTime} min` : 'N/A'}</span>
                </div>
            </div>
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
