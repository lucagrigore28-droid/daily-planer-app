
"use client";

import { useState, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { AppContext } from '@/contexts/AppContext';
import { Label } from '../ui/label';
import type { PersonalEvent } from '@/lib/types';


interface AddEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddEventDialog({ isOpen, onClose }: AddEventDialogProps) {
  const context = useContext(AppContext);
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setDate(new Date());
      setStartTime('');
      setEndTime('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title || !date) {
      toast({
        title: 'Câmpuri Incomplete',
        description: 'Titlul și data sunt obligatorii.',
        variant: 'destructive',
      });
      return;
    }
    if (!context) return;

    setIsSubmitting(true);
    
    const eventData: Omit<PersonalEvent, 'id'> = {
        title,
        description,
        eventDate: date.toISOString(),
    };

    if (startTime) {
        eventData.startTime = startTime;
    }
    if (endTime) {
        eventData.endTime = endTime;
    }

    try {
      await context.addEvent(eventData);
      toast({
        title: 'Eveniment adăugat!',
        description: `"${title}" a fost adăugat în calendar.`,
      });
      onClose();
    } catch (error) {
      console.error("Error adding event:", error);
      toast({
        title: 'Eroare',
        description: 'A apărut o eroare la adăugarea evenimentului.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adaugă un Eveniment Nou</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Titlu</Label>
            <Input
              id="title"
              placeholder="Titlul evenimentului (ex: Antrenament)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
           <div className="grid gap-2">
             <Label htmlFor="description">Descriere (opțional)</Label>
            <Textarea
              id="description"
              placeholder="Adaugă detalii..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
           <div className="grid gap-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${!date && "text-muted-foreground"}`}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP', { locale: ro }) : <span>Alege o dată</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="start-time">Ora de început (opțional)</Label>
                <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="end-time">Ora de final (opțional)</Label>
                <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anulează</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Se adaugă...' : 'Adaugă Eveniment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
