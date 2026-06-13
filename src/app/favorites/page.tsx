"use client"

import { useEffect, useState } from "react"
import { Heart, Music2 } from "lucide-react"
import { createClient, requireSession } from "@/lib/supabase/client"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { SongCard } from "@/components/music/SongCard"
import type { Song } from "@/lib/types"

export default function FavoritesPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchFavorites() {
      const session = await requireSession()
      if (!session) return
      const { data } = await supabase
        .from("favorites")
        .select("*, song:songs(*)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
      setSongs((data || []).map((f: { song: Song }) => f.song).filter(Boolean))
    }
    fetchFavorites()
  }, [])

  const removeFavorite = async (songId: string) => {
    const session = await requireSession()
    if (!session) return
    const { error } = await supabase.from("favorites").delete().eq("song_id", songId).eq("user_id", session.user.id)
    if (error) {
      alert("فشل إزالة الأغنية من المفضلة: " + error.message)
      return
    }
    setSongs((prev) => prev.filter((s) => s.id !== songId))
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">المفضلة</h1>
          <p className="text-sm text-white/50 mt-1">{songs.length} أغنية مفضلة</p>
        </div>

        {songs.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Heart size={28} className="text-white/20" />
            </div>
            <p className="text-white/50">لا توجد أغاني مفضلة بعد</p>
          </div>
        ) : (
          <Card className="divide-y divide-white/5 p-2">
            {songs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                isFavorite
                onToggleFavorite={() => removeFavorite(song.id)}
                allSongs={songs}
              />
            ))}
          </Card>
        )}
      </div>
    </AppShell>
  )
}
