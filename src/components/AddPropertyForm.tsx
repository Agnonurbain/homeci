/**
 * AddPropertyForm — Wrapper de PropertyFormBase pour la création de biens.
 * Toute la logique est dans PropertyFormBase.tsx
 */
import PropertyFormBase from './PropertyFormBase';

interface AddPropertyFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPropertyForm({ onClose, onSuccess }: AddPropertyFormProps) {
  return <PropertyFormBase mode="create" onClose={onClose} onSuccess={onSuccess} />;
}
