/**
 * EditPropertyForm — Wrapper de PropertyFormBase pour l'édition de biens.
 * Toute la logique est dans PropertyFormBase.tsx
 */
import PropertyFormBase from './PropertyFormBase';

interface EditPropertyFormProps {
  propertyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPropertyForm({ propertyId, onClose, onSuccess }: EditPropertyFormProps) {
  return <PropertyFormBase mode="edit" propertyId={propertyId} onClose={onClose} onSuccess={onSuccess} />;
}
