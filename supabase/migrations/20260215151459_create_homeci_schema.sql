/*
  # HOMECI Platform Database Schema
  
  ## Overview
  Complete database schema for the HOMECI real estate platform supporting property listings,
  user management, transactions, and document verification for Côte d'Ivoire market.
  
  ## New Tables
  
  ### 1. profiles
  Extended user profiles with role-based access control
  - `id` (uuid, references auth.users)
  - `email` (text)
  - `full_name` (text)
  - `phone` (text)
  - `role` (text) - 'locataire', 'proprietaire', 'agent', 'admin'
  - `avatar_url` (text)
  - `company_name` (text) - for agents
  - `verified` (boolean) - email/phone verification
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. properties
  Main property listings table supporting all property types
  - `id` (uuid, primary key)
  - `owner_id` (uuid, references profiles)
  - `title` (text)
  - `description` (text)
  - `property_type` (text) - 'appartement', 'maison', 'villa', 'terrain', 'hotel', 'appart_hotel'
  - `transaction_type` (text) - 'location', 'vente', 'both'
  - `price` (numeric) - in FCFA
  - `city` (text) - 'Abidjan', 'Bouaké', 'Yamoussoukro', etc.
  - `commune` (text) - for Abidjan
  - `quartier` (text)
  - `address` (text)
  - `latitude` (numeric)
  - `longitude` (numeric)
  - `bedrooms` (integer)
  - `bathrooms` (integer)
  - `surface_area` (numeric) - in m²
  - `land_area` (numeric) - in m² for terrains
  - `rooms_count` (integer) - for hotels
  - `hotel_stars` (integer) - for hotels (1-5)
  - `furnished` (boolean)
  - `parking` (boolean)
  - `amenities` (jsonb) - array of amenities
  - `status` (text) - 'draft', 'pending', 'published', 'rented', 'sold', 'rejected'
  - `verified_notaire` (boolean)
  - `verification_date` (timestamptz)
  - `views_count` (integer)
  - `featured` (boolean)
  - `available_from` (date)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 3. property_images
  Images and videos for properties
  - `id` (uuid, primary key)
  - `property_id` (uuid, references properties)
  - `url` (text)
  - `type` (text) - 'image', 'video', 'virtual_tour'
  - `is_primary` (boolean)
  - `order_index` (integer)
  - `created_at` (timestamptz)
  
  ### 4. property_documents
  Legal documents for property verification
  - `id` (uuid, primary key)
  - `property_id` (uuid, references properties)
  - `document_type` (text) - 'acd', 'attestation_village', 'autorisation_exploitation', 'titre_foncier'
  - `document_url` (text)
  - `verified` (boolean)
  - `verified_by` (uuid, references profiles)
  - `verification_notes` (text)
  - `uploaded_at` (timestamptz)
  - `verified_at` (timestamptz)
  
  ### 5. favorites
  User favorite properties
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `property_id` (uuid, references properties)
  - `created_at` (timestamptz)
  
  ### 6. bookings
  Property reservations and visits
  - `id` (uuid, primary key)
  - `property_id` (uuid, references properties)
  - `user_id` (uuid, references profiles)
  - `booking_type` (text) - 'visit', 'reservation', 'rental'
  - `start_date` (date)
  - `end_date` (date)
  - `status` (text) - 'pending', 'confirmed', 'cancelled', 'completed'
  - `total_amount` (numeric)
  - `deposit_amount` (numeric)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 7. transactions
  Payment transactions
  - `id` (uuid, primary key)
  - `booking_id` (uuid, references bookings)
  - `user_id` (uuid, references profiles)
  - `property_id` (uuid, references properties)
  - `amount` (numeric)
  - `payment_method` (text) - 'orange_money', 'mtn_momo', 'wave', 'flooz'
  - `transaction_ref` (text)
  - `status` (text) - 'pending', 'completed', 'failed', 'refunded'
  - `movapay_transaction_id` (text)
  - `created_at` (timestamptz)
  - `completed_at` (timestamptz)
  
  ### 8. messages
  User messaging system
  - `id` (uuid, primary key)
  - `property_id` (uuid, references properties)
  - `sender_id` (uuid, references profiles)
  - `receiver_id` (uuid, references profiles)
  - `message` (text)
  - `read` (boolean)
  - `created_at` (timestamptz)
  
  ### 9. alerts
  User search alerts
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `name` (text)
  - `filters` (jsonb) - search criteria
  - `active` (boolean)
  - `created_at` (timestamptz)
  
  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users based on roles
  - Admin-only access for verification and moderation
  - Users can only modify their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'locataire' CHECK (role IN ('locataire', 'proprietaire', 'agent', 'admin')),
  avatar_url text,
  company_name text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  property_type text NOT NULL CHECK (property_type IN ('appartement', 'maison', 'villa', 'terrain', 'hotel', 'appart_hotel')),
  transaction_type text NOT NULL CHECK (transaction_type IN ('location', 'vente', 'both')),
  price numeric NOT NULL CHECK (price >= 0),
  city text NOT NULL,
  commune text,
  quartier text,
  address text,
  latitude numeric,
  longitude numeric,
  bedrooms integer DEFAULT 0 CHECK (bedrooms >= 0),
  bathrooms integer DEFAULT 0 CHECK (bathrooms >= 0),
  surface_area numeric CHECK (surface_area > 0),
  land_area numeric CHECK (land_area > 0),
  rooms_count integer CHECK (rooms_count >= 0),
  hotel_stars integer CHECK (hotel_stars BETWEEN 1 AND 5),
  furnished boolean DEFAULT false,
  parking boolean DEFAULT false,
  amenities jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rented', 'sold', 'rejected')),
  verified_notaire boolean DEFAULT false,
  verification_date timestamptz,
  views_count integer DEFAULT 0,
  featured boolean DEFAULT false,
  available_from date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published properties"
  ON properties FOR SELECT
  TO authenticated
  USING (status = 'published' OR owner_id = auth.uid());

CREATE POLICY "Owners can insert own properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  type text DEFAULT 'image' CHECK (type IN ('image', 'video', 'virtual_tour')),
  is_primary boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view property images"
  ON property_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND (properties.status = 'published' OR properties.owner_id = auth.uid())
    )
  );

CREATE POLICY "Property owners can manage images"
  ON property_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Create property_documents table
CREATE TABLE IF NOT EXISTS property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('acd', 'attestation_village', 'autorisation_exploitation', 'titre_foncier', 'autre')),
  document_url text NOT NULL,
  verified boolean DEFAULT false,
  verified_by uuid REFERENCES profiles(id),
  verification_notes text,
  uploaded_at timestamptz DEFAULT now(),
  verified_at timestamptz
);

ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property owners can view own documents"
  ON property_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_documents.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can upload documents"
  ON property_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_documents.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  booking_type text NOT NULL CHECK (booking_type IN ('visit', 'reservation', 'rental')),
  start_date date NOT NULL,
  end_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_amount numeric DEFAULT 0 CHECK (total_amount >= 0),
  deposit_amount numeric DEFAULT 0 CHECK (deposit_amount >= 0),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = bookings.property_id
    AND properties.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('orange_money', 'mtn_momo', 'wave', 'flooz')),
  transaction_ref text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  movapay_transaction_id text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = transactions.property_id
    AND properties.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts"
  ON alerts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();