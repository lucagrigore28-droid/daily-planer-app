"use client";

import React, { useContext, useEffect, useMemo, useState } from 'react';
import type { EmblaCarouselType } from 'embla-carousel-react'
import { AppContext } from '@/contexts/AppContext';
import { format, isSameDay, startOfDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import HomeworkList from './HomeworkList';
import ManualTimeDialog from './ManualTimeDialog';
import AddTaskDialog from './AddTaskDialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

export default function HomeworkDashboard() {
  const context = useContext(AppContext);
  const [isManualTimeOpen, setManualTimeOpen] = useState(false);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [api, setApi] = useState<EmblaCarouselType>()
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  useEffect(() => {
    if (context?.isDataLoaded && context.hasGpsAccess === null) {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        if (permissionStatus.state === 'denied') {
          context.setHasGpsAccess(false);
          setManualTimeOpen(true);
        } else {
          context.setHasGpsAccess(true);
        }
        permissionStatus.onchange = () => {
            const hasAccess = permissionStatus.state !== 'denied';
            context.setHasGpsAccess(hasAccess);
            if(!hasAccess) setManualTimeOpen(true);
        };
      });
    } else if (context?.isDataLoaded && context.hasGpsAccess === false) {
      setManualTimeOpen(true);
    }
  }, [context?.isDataLoaded, context?.hasGpsAccess, context]);
  
  const relevantDays = useMemo(() => {
    return context?.getRelevantSchoolDays() || [];
  }, [context]);

  useEffect(() => {
    if (!api || !relevantDays.length) return;

    const onSelect = () => {
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }

    const today = startOfDay(context!.currentDate);
    const todayIndex = relevantDays.findIndex(day => isSameDay(day, today));
    
    // If today is a school day, scroll to it, otherwise scroll to the next available one
    let startIndex = todayIndex;
    if (startIndex === -1) {
        startIndex = relevantDays.findIndex(day => day > today);
    }
    if(startIndex === -1) startIndex = relevantDays.length -1; // default to last day if no future days

    api.scrollTo(startIndex, true);
    onSelect();
    api.on('select', onSelect)
    
    return () => {
      api.off('select', onSelect)
    }
  }, [api, relevantDays, context]);


  if (!context) return null;
  const { userData, currentDate } = context;

  const scrollPrev = () => api?.scrollPrev();
  const scrollNext = () => api?.scrollNext();

  return (
    <main className="container mx-auto max-w-3xl py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Salut, {userData.name}!
        </h1>
        <p className="text-muted-foreground">
          Azi este {format(currentDate, "EEEE, d MMMM", { locale: ro })}.
        </p>
      </header>
      
      <div className="space-y-8">
         <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
                {relevantDays.map(day => {
                    const formattedDate = format(day, "EEEE, d MMMM", { locale: ro });
                    return (
                        <CarouselItem key={day.toISOString()}>
                             <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-headline font-semibold capitalize">
                                    Teme pentru {formattedDate}
                                    </h2>
                                </div>
                                <HomeworkList displayDate={day} />
                            </div>
                        </CarouselItem>
                    )
                })}
            </CarouselContent>
            <div className="flex items-center justify-center gap-4 mt-6">
                <Button variant="outline" size="icon" onClick={scrollPrev} disabled={!canScrollPrev}>
                    <ArrowLeft />
                    <span className="sr-only">Ziua precedentă</span>
                </Button>
                 <Button size="sm" onClick={() => setAddTaskOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Adaugă temă
                </Button>
                <Button variant="outline" size="icon" onClick={scrollNext} disabled={!canScrollNext}>
                    <ArrowRight />
                    <span className="sr-only">Următoarea zi</span>
                </Button>
            </div>
        </Carousel>
      </div>
      
      <ManualTimeDialog open={isManualTimeOpen} onOpenChange={setManualTimeOpen} />
      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setAddTaskOpen} />
    </main>
  );
}
