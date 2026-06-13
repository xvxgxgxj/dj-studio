"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Plus, ArrowUpDown } from "lucide-react"
import { createClient, requireSession } from "@/lib/supabase/client"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SongCard } from "@/components/music/SongCard"
import { UploadDialog } from "@/components/music/UploadDialog"
import { formatDuration } from "@/lib/utils"
import type { Song } from "@/lib/types"

export default function LibraryPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [filtered, setFiltered] = useState<Song[]>([])
  const [search, setSearch] = useState("")
  const [showUpload, setShowUpload] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "name">("date")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const fetchSongs = useCallback(async () => {
    const session = await requireSession()
    if (!session) return
    const { data } = await supabase
      .from("songs")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
    setSongs(data || [])
  }, [])

  const fetchFavorites = useCallback(async () => {
    const session = await requireSession()
    if (!session) return
    const { data } = await supabase
      .from("favorites")
      .select("song_id")
      .eq("user_id", session.user.id)
    setFavorites(new Set(data?.map((f) => f.song_id) || []))
  }, [])

  useEffect(() => {
    fetchSongs()
    fetchFavorites()
  }, [fetchSongs, fetchFavorites])

  useEffect(() => {
    let result = [...songs]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist?.toLowerCase().includes(q) ||
          s.album?.toLowerCase().includes(q)
      )
    }
    if (sortBy === "name") {
      result.sort((a, b) => a.title.localeCompare(b.title))
    }
    setFiltered(result)
  }, [songs, search, sortBy])

  const toggleFavorite = async (songId: string) => {
    const session = await requireSession()
    if (!session) return
    if (favorites.has(songId)) {
      const { error } = await supabase.from("favorites").delete().eq("song_id", songId).eq("user_id", session.user.id)
      if (!error) setFavorites((prev) => { const n = new Set(prev); n.delete(songId); return n })
    } else {
      const { error } = await supabase.from("favorites").insert({ song_id: songId, user_id: session.user.id })
      if (!error) setFavorites((prev) => new Set(prev).add(songId))
    }
  }

  const totalDuration = songs.reduce((acc, s) => acc + s.duration, 0)

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">المكتبة</h1>
            <p className="text-sm text-white/50 mt-1">
              {songs.length} أغنية • {formatDuration(totalDuration)}
            </p>
          </div>
          <Button onClick={() => setShowUpload(true)}>
            <Plus size={18} className="ml-2" />
            إضافة أغنية
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="ابحث عن أغنية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pr-10 pl-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 text-sm"
            />
          </div>
          <button
            onClick={() => setSortBy(sortBy === "date" ? "name" : "date")}
            className="h-10 px-4 rounded-xl bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm flex items-center gap-2 transition-all"
          >
            <ArrowUpDown size={16} />
            {sortBy === "date" ? "الأحدث" : "الاسم"}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-white/20" />
            </div>
            <p className="text-white/50">
              {search ? "لا توجد نتائج للبحث" : "مكتبتك فارغة - أضف أغانيك الآن"}
            </p>
          </div>
        ) : (
          <Card className="divide-y divide-white/5 p-2">
            {filtered.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                isFavorite={favorites.has(song.id)}
                onToggleFavorite={() => toggleFavorite(song.id)}
                allSongs={filtered}
              />
            ))}
          </Card>
        )}

        <UploadDialog
          open={showUpload}
          onClose={() => setShowUpload(false)}
          onUploadComplete={() => { fetchSongs(); fetchFavorites() }}
        />
      </div>
    </AppShell>
  )
}
