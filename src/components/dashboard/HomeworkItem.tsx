'use client';
import type { HomeworkTask } from '@/lib/types';
import { AppContext } from '@/contexts/AppContext';
import { useContext, useState } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { format, isBefore, startOfDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { CalendarClock, ChevronsLeft, Lock, Pencil, Trash2 } from 'lucide-react';
import AddTaskDialog from './AddTaskDialog';
import { cn } from '@/lib/utils';
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
import { Checkbox } from '@/components/ui/checkbox';


export default function HomeworkItem({ task, showDueDate = true }: { task: HomeworkTask, showDueDate?: boolean }) {
  const context = useContext(AppContext);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const controls = useAnimation();
  const itemControls = useAnimation();

  if (!context) return null;

  const { updateTask, deleteTask } = context;

  const isLocked = task.isLocked;
  const isOverdue = !task.isCompleted && isBefore(startOfDay(new Date(task.dueDate)), startOfDay(new Date()));

  const handleDelete = () => {
    itemControls.start({
      opacity: 0,
      height: 0,
      transition: { duration: 0.4, ease: "easeInOut" }
    }).then(() => {
      deleteTask(task.id);
    });
  };

  const handleEdit = () => {
    controls.start({ x: 0 });
    setIsEditing(true);
  };

  const handleCompletionChange = (checked: boolean) => {
    if (isLocked || isOverdue) return;
    updateTask(task.id, { isCompleted: checked });
  };

  const onDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isLocked) return;
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

  const borderColor = isOverdue && !task.isCompleted ? 'hsl(var(--destructive))' : task.subjectColor || 'hsl(var(--border))';

  return (
    <>
      <motion.div 
        animate={itemControls} 
        className={cn("w-full", (isLocked || task.isCompleted) && "opacity-60")}
      >
        <div className="relative w-full overflow-hidden rounded-lg">
          {/* Hidden Action Buttons Container */}
          {!isLocked && (
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
          )}

          {/* Draggable Event Item */}
          <motion.div
            className="relative z-10 w-full"
            drag={isLocked ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={onDragEnd}
            animate={controls}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          >
            <div 
              className="flex items-stretch bg-card rounded-lg border-l-8"
              style={{ borderColor }}
            >
                {/* Main Content */}
                <div className="flex-grow p-3 flex items-center gap-4">
                    <Checkbox
                        id={`task-${task.id}`}
                        checked={task.isCompleted}
                        onCheckedChange={handleCompletionChange}
                        disabled={isLocked || isOverdue}
                        className="h-6 w-6 rounded-full"
                    />
                    <div className="flex-1">
                        <p className="font-semibold text-lg text-card-foreground">{task.subjectName}</p>
                        {task.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">{task.description}</p>
                        )}
                        {showDueDate && (
                            <div className={cn(
                                "flex items-center gap-1.5 text-xs font-medium pt-1 text-muted-foreground",
                                isOverdue && !task.isCompleted && "text-destructive font-semibold"
                            )}>
                                <CalendarClock className="h-3 w-3" />
                                <span>
                                    Termen: {format(new Date(task.dueDate), "d MMM, HH:mm", { locale: ro })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side Handle */}
                <div className="flex-shrink-0 w-12 flex items-center justify-center rounded-r-lg">
                    {isLocked ? (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <motion.div animate={{ x: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                            <ChevronsLeft className="h-6 w-6 text-muted-foreground" />
                        </motion.div>
                    )}
                </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {<AddTaskDialog open={isEditing} onOpenChange={setIsEditing} taskToEdit={task} />}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești absolut sigur?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Tema la <strong>{task.subjectName}</strong> va fi ștearsă definitiv.
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
