import { useStore } from '../store/useStore';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Checks if the user can generate a work based on their credits or lifetime status.
 */
export const canGenerateWork = (): boolean => {
  const { credits, isLifetime, user } = useStore.getState();
  
  if (!user) return false;
  if (isLifetime) return true;
  return credits >= 2;
};

/**
 * Checks if the user can perform an action based on their credits or lifetime status.
 * All individual AI actions (suggestions, editor tools) are now free as per user request.
 */
export const canPerformAction = (amount: number = 0): boolean => {
  return true;
};

/**
 * Consumes credits for generating a work if the user is not a lifetime member.
 * Cost is exactly 2 credits as per user request.
 */
export const consumeCreditsForWork = async (): Promise<boolean> => {
  const { credits, isLifetime, user, setCredits } = useStore.getState();
  
  if (!user) return false;
  if (isLifetime) return true;
  
  if (credits < 2) return false;
  
  const newCredits = Math.max(0, credits - 2);
  
  const userRef = doc(db, 'users', user.uid);
  try {
    await updateDoc(userRef, { 
      credits: newCredits,
      updatedAt: serverTimestamp()
    });
    setCredits(newCredits);
    return true;
  } catch (error) {
    console.error("Error consuming credits:", error);
    return false;
  }
};

/**
 * Consumes a specific amount of credits for an action.
 * All individual AI actions are now free.
 */
export const consumeCreditsForAction = async (amount: number = 0): Promise<boolean> => {
  return true;
};
