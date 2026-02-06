'use client';
import type { PersonalEvent } from '@/lib/types';
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
import AddEventDialog from './AddEventDialog';

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
    const openMenuThreshold = -80;

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
          {/* Hidden Action Buttons Container (Black Background) */}
          <div className="absolute top-0 right-0 h-full flex items-center bg-background">
            <button
              onClick={handleEdit}
              className="h-full w-20 flex items-center justify-center transition-colors hover:bg-white/5"
            >
              <Pencil size={22} className="text-primary" />
            </button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="h-full w-20 flex items-center justify-center transition-colors hover:bg-white/5"
            >
              <Trash2 size={22} className="text-accent" />
            </button>
          </div>

          {/* Draggable Event Item */}
          <motion.div
            className="relative z-10 w-full flex items-stretch"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={onDragEnd}
            animate={controls}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          >
            {/* Left Side (Accent Color) */}
            <div className="flex-grow bg-accent text-black rounded-l-lg p-3">
                <div className="flex items-start justify-between gap-4 h-full">
                  <div className="flex flex-col flex-1 space-y-1">
                    <p className="font-semibold">{event.title}</p>
                    {event.description && <p className="text-sm opacity-80">{event.description}</p>}
                  </div>
                  {(event.startTime || event.endTime) && (
                    <div className="flex items-center gap-1.5 text-xs opacity-90 pt-1 flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>
                        {event.startTime} {event.endTime ? ` - ${event.endTime}` : ''}
                      </span>
                    </div>
                  )}
                </div>
            </div>

            {/* Right Side Handle (Card Color) */}
            <div className="flex-shrink-0 w-12 flex items-center justify-center bg-card rounded-r-lg">
                <motion.div animate={{ x: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                    <ChevronsLeft className="h-6 w-6 text-muted-foreground" />
                </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {isEditing && <AddEventDialog eventToEdit={event} open={isEditing} onOpenChange={setIsEditing} />}
      
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
