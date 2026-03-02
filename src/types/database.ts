export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          role: 'locataire' | 'proprietaire' | 'agent' | 'admin' | 'notaire'
          avatar_url: string | null
          company_name: string | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          role?: 'locataire' | 'proprietaire' | 'agent' | 'admin' | 'notaire'
          avatar_url?: string | null
          company_name?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          role?: 'locataire' | 'proprietaire' | 'agent' | 'admin' | 'notaire'
          avatar_url?: string | null
          company_name?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string
          property_type: 'appartement' | 'maison' | 'villa' | 'terrain' | 'hotel' | 'appart_hotel'
          transaction_type: 'location' | 'vente' | 'both'
          price: number
          city: string
          commune: string | null
          quartier: string | null
          address: string | null
          latitude: number | null
          longitude: number | null
          bedrooms: number
          bathrooms: number
          surface_area: number | null
          land_area: number | null
          rooms_count: number | null
          hotel_stars: number | null
          furnished: boolean
          parking: boolean
          amenities: Json
          status: 'draft' | 'pending' | 'published' | 'rented' | 'sold' | 'rejected'
          verified_notaire: boolean
          verification_date: string | null
          views_count: number
          featured: boolean
          available_from: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description: string
          property_type: 'appartement' | 'maison' | 'villa' | 'terrain' | 'hotel' | 'appart_hotel'
          transaction_type: 'location' | 'vente' | 'both'
          price: number
          city: string
          commune?: string | null
          quartier?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          bedrooms?: number
          bathrooms?: number
          surface_area?: number | null
          land_area?: number | null
          rooms_count?: number | null
          hotel_stars?: number | null
          furnished?: boolean
          parking?: boolean
          amenities?: Json
          status?: 'draft' | 'pending' | 'published' | 'rented' | 'sold' | 'rejected'
          verified_notaire?: boolean
          verification_date?: string | null
          views_count?: number
          featured?: boolean
          available_from?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string
          property_type?: 'appartement' | 'maison' | 'villa' | 'terrain' | 'hotel' | 'appart_hotel'
          transaction_type?: 'location' | 'vente' | 'both'
          price?: number
          city?: string
          commune?: string | null
          quartier?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          bedrooms?: number
          bathrooms?: number
          surface_area?: number | null
          land_area?: number | null
          rooms_count?: number | null
          hotel_stars?: number | null
          furnished?: boolean
          parking?: boolean
          amenities?: Json
          status?: 'draft' | 'pending' | 'published' | 'rented' | 'sold' | 'rejected'
          verified_notaire?: boolean
          verification_date?: string | null
          views_count?: number
          featured?: boolean
          available_from?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      property_images: {
        Row: {
          id: string
          property_id: string
          url: string
          type: 'image' | 'video' | 'virtual_tour'
          is_primary: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          url: string
          type?: 'image' | 'video' | 'virtual_tour'
          is_primary?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          url?: string
          type?: 'image' | 'video' | 'virtual_tour'
          is_primary?: boolean
          order_index?: number
          created_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          property_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          property_id: string
          user_id: string
          booking_type: 'visit' | 'reservation' | 'rental'
          start_date: string
          end_date: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          total_amount: number
          deposit_amount: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          user_id: string
          booking_type: 'visit' | 'reservation' | 'rental'
          start_date: string
          end_date?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          total_amount?: number
          deposit_amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          user_id?: string
          booking_type?: 'visit' | 'reservation' | 'rental'
          start_date?: string
          end_date?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          total_amount?: number
          deposit_amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      property_documents: {
        Row: {
          id: string
          property_id: string
          document_type: 'acd' | 'attestation_village' | 'autorisation_exploitation' | 'titre_foncier' | 'autre'
          document_url: string
          verified: boolean
          verified_by: string | null
          verification_notes: string | null
          uploaded_at: string
          verified_at: string | null
        }
        Insert: {
          id?: string
          property_id: string
          document_type: 'acd' | 'attestation_village' | 'autorisation_exploitation' | 'titre_foncier' | 'autre'
          document_url: string
          verified?: boolean
          verified_by?: string | null
          verification_notes?: string | null
          uploaded_at?: string
          verified_at?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          document_type?: 'acd' | 'attestation_village' | 'autorisation_exploitation' | 'titre_foncier' | 'autre'
          document_url?: string
          verified?: boolean
          verified_by?: string | null
          verification_notes?: string | null
          uploaded_at?: string
          verified_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
