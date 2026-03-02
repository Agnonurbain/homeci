import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFavorites(userId: string | undefined) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    if (!userId) {
      setFavoriteIds([]);
      return;
    }
    setLoadingFavorites(true);
    getDoc(doc(db, 'favorites', userId))
      .then(snap => {
        if (snap.exists()) setFavoriteIds(snap.data().ids || []);
      })
      .catch(console.error)
      .finally(() => setLoadingFavorites(false));
  }, [userId]);

  const toggleFavorite = async (propertyId: string) => {
    if (!userId) return;
    const updated = favoriteIds.includes(propertyId)
      ? favoriteIds.filter(id => id !== propertyId)
      : [...favoriteIds, propertyId];
    setFavoriteIds(updated);
    await setDoc(doc(db, 'favorites', userId), { ids: updated });
  };

  const isFavorite = (propertyId: string) => favoriteIds.includes(propertyId);

  return { favoriteIds, toggleFavorite, isFavorite, loadingFavorites };
}
