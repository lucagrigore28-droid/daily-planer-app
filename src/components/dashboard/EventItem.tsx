'use client';
import type { PersonalEvent } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Trash2, Pencil, ChevronsLeft } from 'lucide-react';
import { AppContext } from '@/contexts/AppContext';
import { useContext, useState } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddEventDialog } from './AddEventDialog';

export default function EventItem({ event }: { event: PersonalEvent }) {
  const context = useContext(AppContext);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const controls = useAnimation();
  const itemControls = useAnimation();

  const handleDelete = () => {
    itemControls.start({
      opacity: 0,
      height: 0,
      transition: { duration: 0.4, ease: "easeInOut" }
    }).then(() => {
      if (context) {
        context.deleteEvent(event.id);
      }
    });
  };

  const handleEdit = () => {
    controls.start({ x: 0 });
    setIsEditing(true);
  };

  const onDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeToDeleteThreshold = -180;
    const openMenuThreshold = -60;

    if (info.offset.x < swipeToDeleteThreshold) {
      controls.start({ x: 0 });
      setIsDeleteDialogOpen(true);
    } else if (info.offset.x < openMenuThreshold) {
      controls.start({ x: -160 });
    } else {
      controls.start({ x: 0 });
    }
  };

  return (
    <>
      <motion.div animate={itemControls} className="w-full">
        <div className="relative w-full overflow-hidden rounded-lg">
          <div className="absolute top-0 right-0 h-full flex items-center">
            <button
              onClick={handleEdit}
              className="h-full w-20 flex items-center justify-center bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Pencil size={20} />
            </button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="h-full w-20 flex items-center justify-center bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
            >
              <Trash2 size={20} />
            </button>
          </div>

          <motion.div
            className="relative z-10 w-full flex items-center bg-accent rounded-lg"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElasticity={0.1}
            onDragEnd={onDragEnd}
            animate={controls}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          >
            <Card className="flex-grow bg-transparent shadow-none border-none">
              <CardContent className="p-3 text-accent-foreground">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">{event.title}</p>
                    {event.description && <p className="text-sm opacity-80">{event.description}</p>}
                  </div>
                  {(event.startTime || event.endTime) && (
                    <div className="flex items-center gap-1.5 text-xs opacity-90 pt-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {event.startTime} {event.endTime ? ` - ${event.endTime}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="flex-shrink-0 h-full w-10 flex items-center justify-center bg-accent/80 rounded-r-lg">
                <motion.div animate={{ x: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                    <ChevronsLeft className="h-6 w-6 text-gradient" />
                </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {isEditing && <AddEventDialog eventToEdit={event} onClose={() => setIsEditing(false)} />}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești absolut sigur?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Evenimentul <strong>"{event.title}"</strong> va fi șters definitiv.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => controls.start({ x: 0 })}>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Da, șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
