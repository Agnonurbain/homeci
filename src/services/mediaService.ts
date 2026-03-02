import { supabase } from '../lib/supabase';

export interface PropertyMedia {
  id: string;
  property_id: string;
  url: string;
  type: 'image';
  is_primary: boolean;
  order_index: number;
  created_at: string;
}

export const mediaService = {
  async getMediaByProperty(propertyId: string): Promise<PropertyMedia[]> {
    const { data, error } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', propertyId)
      .order('order_index', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as PropertyMedia[];
  },

  async insertMedia(media: Omit<PropertyMedia, 'id' | 'created_at'>[]): Promise<void> {
    if (media.length === 0) return;
    const { error } = await supabase.from('property_images').insert(media);
    if (error) throw new Error(error.message);
  },

  async deleteMedia(id: string): Promise<void> {
    const { error } = await supabase.from('property_images').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async setPrimaryMedia(propertyId: string, primaryId: string): Promise<void> {
    const { data: allMedia, error: fetchError } = await supabase
      .from('property_images')
      .select('id')
      .eq('property_id', propertyId);

    if (fetchError) throw new Error(fetchError.message);

    const updates = (allMedia || []).map((m) =>
      supabase
        .from('property_images')
        .update({ is_primary: m.id === primaryId })
        .eq('id', m.id)
    );

    await Promise.all(updates);
  },
};
