import { 
    addDoc, 
    collection, 
    deleteDoc, 
    doc, 
    getDocs, 
    query, 
    serverTimestamp, 
    updateDoc, 
    where 
} from "firebase/firestore";
import { db } from "@/firebase/config"; // Check path
import { IEvent, PartialEvent } from "@/lib/types";

const EVENTS_COLLECTION = "events";

/**
 * Adds a new event to the Firestore database for a specific user.
 * @param userId - The ID of the user.
 * @param eventData - The event data to add (without id, userId, createdAt).
 * @returns The newly created event object with its ID.
 */
export const addEventToAPI = async (
    userId: string,
    eventData: Omit<IEvent, 'id' | 'userId' | 'createdAt'>
): Promise<IEvent> => {
    const docRef = await addDoc(collection(db, `users/${userId}/${EVENTS_COLLECTION}`), {
        ...eventData,
        createdAt: serverTimestamp(),
        userId: userId,
    });
    return {
        id: docRef.id,
        userId: userId,
        ...eventData,
        createdAt: eventData.date, // Approximate for return, actual is server-set
    } as IEvent;
};

/**
 * Fetches all events for a specific user from Firestore.
 * @param userId - The ID of the user.
 * @returns An array of event objects.
 */
export const getEventsFromAPI = async (userId: string): Promise<IEvent[]> => {
    const q = query(collection(db, `users/${userId}/${EVENTS_COLLECTION}`));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as IEvent));
};

/**
 * Updates an event in the Firestore database.
 * @param userId - The ID of the user.
 * @param eventId - The ID of the event to update.
 * @param updates - An object with the fields to update.
 */
export const updateEventInAPI = async (
    userId: string,
    eventId: string,
    updates: PartialEvent
): Promise<void> => {
    const eventRef = doc(db, `users/${userId}/${EVENTS_COLLECTION}`, eventId);
    await updateDoc(eventRef, updates);
};

/**
 * Deletes an event from the Firestore database.
 * @param userId - The ID of the user.
 * @param eventId - The ID of the event to delete.
 */
export const deleteEventFromAPI = async (userId: string, eventId: string): Promise<void> => {
    await deleteDoc(doc(db, `users/${userId}/${EVENTS_COLLECTION}`, eventId));
};
