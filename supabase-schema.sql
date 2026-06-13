-- DJ Studio - Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (syncs with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 524288000, -- 500MB
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  genre TEXT,
  duration DOUBLE PRECISION DEFAULT 0,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL,
  cover_url TEXT,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_songs_user_id ON songs(user_id);
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_created_at ON songs(created_at DESC);

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own songs"
  ON songs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own songs"
  ON songs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own songs"
  ON songs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own songs"
  ON songs FOR DELETE
  USING (auth.uid() = user_id);

-- Albums table
CREATE TABLE IF NOT EXISTS albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_albums_user_id ON albums(user_id);

ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own albums"
  ON albums FOR ALL
  USING (auth.uid() = user_id);

-- Album songs junction table
CREATE TABLE IF NOT EXISTS album_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(album_id, song_id)
);

CREATE INDEX idx_album_songs_album_id ON album_songs(album_id);

ALTER TABLE album_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own album songs"
  ON album_songs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM albums WHERE albums.id = album_songs.album_id AND albums.user_id = auth.uid()
    )
  );

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playlists_user_id ON playlists(user_id);

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own playlists"
  ON playlists FOR ALL
  USING (auth.uid() = user_id);

-- Playlist songs junction table
CREATE TABLE IF NOT EXISTS playlist_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, song_id)
);

CREATE INDEX idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);

ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own playlist songs"
  ON playlist_songs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM playlists WHERE playlists.id = playlist_songs.playlist_id AND playlists.user_id = auth.uid()
    )
  );

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);

-- Play history table
CREATE TABLE IF NOT EXISTS play_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_play_history_user_id ON play_history(user_id);
CREATE INDEX idx_play_history_played_at ON play_history(played_at DESC);

ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own history"
  ON play_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON play_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Storage buckets setup
-- Create buckets via Supabase Dashboard or API:
-- 1. songs - for audio files
-- 2. covers - for album/playlist cover art
-- 3. avatars - for user avatars

-- Storage RLS Policies (run in Supabase SQL editor for each bucket)
-- For songs bucket:
-- CREATE POLICY "Users can read own songs"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'songs' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);
--
-- CREATE POLICY "Users can upload own songs"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'songs' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);
--
-- CREATE POLICY "Users can delete own songs"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'songs' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
