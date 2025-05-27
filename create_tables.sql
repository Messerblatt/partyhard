
-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS artist_tags CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS event_bookings CASCADE;
DROP TABLE IF EXISTS event_images CASCADE;



-- Tags Table (Genres)
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
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
    web VARCHAR(255)
);

-- Join Table: artist_tags
CREATE TABLE artist_tags (
    artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (artist_id, tag_id)
);


-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Booker', 'Door', 'Event Manager', 'Other')),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(255),
    password VARCHAR(255) NOT NULL
);

INSERT INTO users (role, name, email, password) VALUES ('Admin', 'Markus', 'markusmeyer2000@protonmail.com', '1234');


-- Events Table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Concert', 'Rave')),
    title VARCHAR(255) NOT NULL,
    start_ TIMESTAMP,
    end_ TIMESTAMP,
    doors_open TIMESTAMP,

    state VARCHAR(50) CHECK (state IN ('Confirmed', 'Option', 'Idea', 'Cancelled')),
    floors VARCHAR(50) CHECK (floors IN ('Eli', 'Xxs', 'Garderobenfloor', 'Open Air')),

    responsible_id INTEGER REFERENCES users(id),
    light_id INTEGER REFERENCES users(id),
    sound_id INTEGER REFERENCES users(id),
    artist_care_id INTEGER REFERENCES users(id),

    with_options JSONB DEFAULT '{}'::JSONB,

    admission INTEGER CHECK (admission >= 0 AND admission <= 100),
    break_even INTEGER CHECK (break_even >= 0 AND break_even <= 100),

    presstext TEXT,
    notes_internal TEXT,
    technical_notes TEXT,
    api_notes TEXT
);



-- Join Table: event_bookings
CREATE TABLE event_bookings (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, artist_id)
);


CREATE TABLE event_images (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,  -- This is the full image URL for display
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
