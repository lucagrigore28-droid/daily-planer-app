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


export default function EventItem({ event }: { event: PersonalEvent }) {
  const context = useContext(AppContext);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
    // În pasul următor, vom deschide dialogul de editare aici
    controls.start({ x: 0 });
    console.log("Edit action triggered for event:", event.id);
  };

  const onDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeToDeleteThreshold = -180; // Prag pentru ștergere directă
    const openMenuThreshold = -60;   // Prag pentru a deschide meniul

    if (info.offset.x < swipeToDeleteThreshold) {
      setIsDeleteDialogOpen(true);
      controls.start({ x: 0 }); // Resetează poziția după drag
    } else if (info.offset.x < openMenuThreshold) {
      controls.start({ x: -160 }); // Deschide meniul
    } else {
      controls.start({ x: 0 }); // Închide meniul
    }
  };

  return (
    <>
      <motion.div animate={itemControls} className="w-full">
        <div className="relative w-full overflow-hidden rounded-lg">
          {/* Action Buttons Container */}
          <div className="absolute top-0 right-0 h-full flex items-center">
            <button
              onClick={handleEdit}
              className="h-full w-20 flex items-center justify-center bg-blue-500 text-white transition-colors hover:bg-blue-600"
            >
              <Pencil size={20} />
            </button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="h-full w-20 flex items-center justify-center bg-red-500 text-white transition-colors hover:bg-red-600"
            >
              <Trash2 size={20} />
            </button>
          </div>

          {/* Draggable Event Item */}
          <motion.div
            className="relative z-10 w-full flex items-center"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElasticity={0.1}
            onDragEnd={onDragEnd}
            animate={controls}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          >
            <Card className="flex-grow bg-card/90 border-l-4 border-accent rounded-lg-none">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">{event.title}</p>
                    {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                  </div>
                  {(event.startTime || event.endTime) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {event.startTime} {event.endTime ? ` - ${event.endTime}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="flex-shrink-0 h-full w-10 flex items-center justify-center bg-card">
                <motion.div animate={{ x: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                    <ChevronsLeft className="h-6 w-6 text-gradient" />
                </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      
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
