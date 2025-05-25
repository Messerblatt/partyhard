-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS event_images CASCADE;
DROP TABLE IF EXISTS event_bookings CASCADE;
DROP TABLE IF EXISTS artist_tags CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Tags Table (Genres)
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO tags (name) VALUES
('Techno'),
('House'),
('Trance'),
('Drum and Bass'),
('Jungle'),
('Electro'),
('Ambient'),
('IDM'),
('Acid'),
('Hardcore'),
('Dubstep'),
('Breakbeat'),
('Minimal'),
('Industrial'),
('Synthwave'),
('Progressive'),
('Gabber'),
('Leftfield'),
('Glitch'),
('Experimental');

-- Artists Table
CREATE TABLE artists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('DJ', 'Live', 'Drag Performance')),
  label VARCHAR(255),
  members TEXT,
  agency VARCHAR(255),
  notes VARCHAR(500),
  email VARCHAR(255),
  phone VARCHAR(255),
  web VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Join Table: artist_tags
CREATE TABLE artist_tags (
  artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (artist_id, tag_id)
);

-- Users Table (will be managed by Supabase Auth, but we keep this for additional user data)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Booker', 'Door', 'Event Manager', 'Other')) DEFAULT 'Other',
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events Table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Concert', 'Rave')) DEFAULT 'Concert',
  title VARCHAR(255) NOT NULL,
  start_ TIMESTAMP WITH TIME ZONE,
  end_ TIMESTAMP WITH TIME ZONE,
  doors_open TIMESTAMP WITH TIME ZONE,
  state VARCHAR(50) CHECK (state IN ('Confirmed', 'Option', 'Idea', 'Cancelled')),
  floors VARCHAR(50) CHECK (floors IN ('Eli', 'Xxs', 'Garderobenfloor', 'Open Air')),
  responsible_id UUID REFERENCES users(id),
  light_id UUID REFERENCES users(id),
  sound_id UUID REFERENCES users(id),
  artist_care_id UUID REFERENCES users(id),
  with_options JSONB DEFAULT '{}'::JSONB,
  admission INTEGER CHECK (admission >= 0 AND admission <= 100),
  break_even INTEGER CHECK (break_even >= 0 AND break_even <= 100),
  presstext TEXT,
  notes_internal TEXT,
  technical_notes TEXT,
  api_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Join Table: event_bookings
CREATE TABLE event_bookings (
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, artist_id)
);

-- Event Images Table
CREATE TABLE event_images (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow authenticated users to read/write)
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage users" ON users FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'
  )
);

CREATE POLICY "Authenticated users can view events" ON events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage events" ON events FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view artists" ON artists FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage artists" ON artists FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view tags" ON tags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage tags" ON tags FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view event_bookings" ON event_bookings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage event_bookings" ON event_bookings FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view event_images" ON event_images FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage event_images" ON event_images FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view artist_tags" ON artist_tags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage artist_tags" ON artist_tags FOR ALL USING (auth.role() = 'authenticated');

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Other')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
