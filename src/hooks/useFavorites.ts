import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { analyticsService } from '../services/analyticsService';

export function useFavorites(userId: string | undefined) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    if (!userId) {
      setFavoriteIds([]);
      return;
    }
    setLoadingFavorites(true);
    // Charger depuis la sous-collection users/{uid}/favorites
    getDocs(collection(db, 'users', userId, 'favorites'))
      .then(snap => {
        setFavoriteIds(snap.docs.map(d => d.id));
      })
      .catch(console.error)
      .finally(() => setLoadingFavorites(false));
  }, [userId]);

  const toggleFavorite = async (propertyId: string) => {
    if (!userId) return;
    const favRef = doc(db, 'users', userId, 'favorites', propertyId);
    if (favoriteIds.includes(propertyId)) {
      // Retirer des favoris
      setFavoriteIds(prev => prev.filter(id => id !== propertyId));
      await deleteDoc(favRef);
      analyticsService.favoriteProperty(propertyId, 'remove');
    } else {
      // Ajouter aux favoris
      setFavoriteIds(prev => [...prev, propertyId]);
      await setDoc(favRef, { added_at: new Date().toISOString() });
      analyticsService.favoriteProperty(propertyId, 'add');
    }
  };

  const isFavorite = (propertyId: string) => favoriteIds.includes(propertyId);

  return { favoriteIds, toggleFavorite, isFavorite, loadingFavorites };
}
