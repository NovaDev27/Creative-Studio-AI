import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  QueryConstraint
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

export function useFirestore<T>(collectionPath: string, constraints: QueryConstraint[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collectionPath), ...constraints);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as T);
      });
      setData(items);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError(err.message);
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, collectionPath);
    });

    return () => unsubscribe();
  }, [collectionPath, JSON.stringify(constraints)]);

  const add = async (newData: any) => {
    try {
      return await addDoc(collection(db, collectionPath), {
        ...newData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, collectionPath);
    }
  };

  const update = async (id: string, updateData: any) => {
    try {
      const docRef = doc(db, collectionPath, id);
      return await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${collectionPath}/${id}`);
    }
  };

  const remove = async (id: string) => {
    try {
      const docRef = doc(db, collectionPath, id);
      return await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionPath}/${id}`);
    }
  };

  return { data, loading, error, add, update, remove };
}
