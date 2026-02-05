import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ITask } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sortează un array de teme pe baza urgenței. (TEMPORAR DEZACTIVAT PENTRU DEBUG)
 */
export const sortByUrgency = (tasks: ITask[]): ITask[] => {
    // Pur și simplu returnează array-ul fără sortare pentru a testa dacă aceasta cauzează înghețarea
    return tasks;
};

/**
 * Mută un element într-un array de la un index la altul.
 */
export function arrayMove<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const newArray = [...array];
  const [item] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, item);
  return newArray;
}
