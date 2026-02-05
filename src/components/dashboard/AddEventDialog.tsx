"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
// import { addEventToAPI } from '@/helpers/events-api'; // To be added later
// import { useAuth } from '@/contexts/AuthContext'; // To be added later

interface AddEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddEventDialog({ isOpen, onClose }: AddEventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // const { user } = useAuth();

  const handleSubmit = async () => {
    if (!title || !date) {
      toast.error('Titlul și data sunt obligatorii.');
      return;
    }
    // if (!user) return;

    setIsSubmitting(true);
    console.log('Submitting Event:', { title, description, date, startTime, endTime });
    // try {
    //   await addEventToAPI(user.uid, { title, description, date, startTime, endTime });
    //   toast.success('Eveniment adăugat!');
    //   onClose();
    // } catch (error) {
    //   console.error(error);
    //   toast.error('A apărut o eroare.');
    // }
    setIsSubmitting(false);
    onClose(); // Temporary
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adaugă un Eveniment Nou</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="title"
            placeholder="Titlul evenimentului (ex: Antrenament)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            id="description"
            placeholder="Descriere (opțional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="start-time"
              type="time"
              placeholder="Ora de început"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              id="end-time"
              type="time"
              placeholder="Ora de final"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
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
