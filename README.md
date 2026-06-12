<<<<<<< HEAD
# DJ Studio - Personal Music Library PWA

## Prerequisites
- Node.js 18+
- npm
- Supabase account
- Railway account (for deployment)

## Setup

1. **Clone and install**
```bash
git clone <repo-url>
cd dj-studio
npm install
```

2. **Supabase Setup**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy the SQL from `supabase-schema.sql` and run it in Supabase SQL editor
   - Create storage buckets: `songs`, `covers`, `avatars`
   - Enable RLS policies for storage (see SQL file for examples)

3. **Environment Variables**
```bash
cp .env.local.example .env.local
```
Fill in your Supabase credentials from Project Settings > API.

4. **Run Development**
```bash
npm run dev
```

5. **Build for Production**
```bash
npm run build
npm start
```

## Deploy to Railway

1. Push to GitHub
2. Connect repo to Railway
3. Add environment variables in Railway dashboard
4. Deploy

## Features
- User authentication (signup, login, password reset)
- Personal music library with upload support (MP3, WAV, FLAC, M4A, AAC)
- Music player with play, pause, skip, shuffle, repeat, queue
- Albums system with cover art
- Playlist management
- Favorites
- Admin dashboard
- PWA support (installable on iPhone/Android)
- RTL Arabic UI
- Dark/light theme
- Responsive design
=======
# dj-studio
DJ Studio - Personal Music Library Web App (PWA) with private uploads, playlists, and music player
>>>>>>> e5107f62653ee7bbd698ce56fa2ca2b975d3c1db
