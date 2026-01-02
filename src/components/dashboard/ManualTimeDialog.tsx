"use client";

import React, { useContext, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { AppContext } from '@/contexts/AppContext';
import { setDay, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';

type ManualTimeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ManualTimeDialog({ open, onOpenChange }: ManualTimeDialogProps) {
  const context = useContext(AppContext);
  const [selectedDay, setSelectedDay] = useState<string | undefined>(String(new Date().getDay()));

  const handleSubmit = () => {
    if (selectedDay !== undefined) {
      const now = new Date();
      let newDate = setDay(now, Number(selectedDay));
      // Reset time to avoid confusion, user can set it if needed, but for now day is enough
      newDate = setHours(newDate, now.getHours());
      newDate = setMinutes(newDate, now.getMinutes());
      newDate = setSeconds(newDate, now.getSeconds());
      newDate = setMilliseconds(newDate, now.getMilliseconds());
      context?.setCurrentDate(newDate);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Locația nu este disponibilă</DialogTitle>
          <DialogDescription>
            Pentru a calcula corect temele, te rog să selectezi ziua curentă.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger>
              <SelectValue placeholder="Selectează ziua curentă" />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map((day, index) => (
                <SelectItem key={index} value={String(index)}>{day}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={selectedDay === undefined}>Confirmă</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
