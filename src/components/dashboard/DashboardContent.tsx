"use client"

import { useEffect, useState } from "react"
import {
  Music2,
  Disc3,
  HardDrive,
  Clock,
  TrendingUp,
  ListMusic,
  Heart,
} from "lucide-react"
import { createClient, requireSession } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { formatFileSize, formatDuration } from "@/lib/utils"
import type { Song } from "@/lib/types"

export function DashboardContent() {
  const [songCount, setSongCount] = useState(0)
  const [albumCount, setAlbumCount] = useState(0)
  const [playlistCount, setPlaylistCount] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [storageUsed, setStorageUsed] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [recentPlays, setRecentPlays] = useState<Song[]>([])
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      const session = await requireSession()
      if (!session || cancelled) return
      const user = session.user

      const [songsRes, albumsRes, playlistsRes, favoritesRes, historyRes] =
        await Promise.all([
          supabase.from("songs").select("file_size, duration").eq("user_id", user.id),
          supabase.from("albums").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("playlists").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("play_history")
            .select("song_id, played_at")
            .eq("user_id", user.id)
            .order("played_at", { ascending: false })
            .limit(5),
        ])

      if (cancelled) return

      const songs = songsRes.data || []
      setSongCount(songs.length)
      setAlbumCount(albumsRes.count ?? 0)
      setPlaylistCount(playlistsRes.count ?? 0)
      setFavoriteCount(favoritesRes.count ?? 0)
      setStorageUsed(songs.reduce((acc, s) => acc + (s as { file_size: number }).file_size, 0))
      setTotalDuration(songs.reduce((acc, s) => acc + (s as { duration: number }).duration, 0))

      if (historyRes.data && historyRes.data.length > 0) {
        const songIds = historyRes.data.map((h: { song_id: string }) => h.song_id)
        const { data: historySongs } = await supabase
          .from("songs")
          .select("*")
          .in("id", songIds)
        if (historySongs) setRecentPlays(historySongs as Song[])
      }
    }

    loadStats()
    return () => { cancelled = true }
  }, [])

  const statCards = [
    { label: "الأغاني", value: songCount, icon: Music2, color: "from-blue-500 to-blue-600" },
    { label: "الألبومات", value: albumCount, icon: Disc3, color: "from-purple-500 to-purple-600" },
    { label: "قوائم التشغيل", value: playlistCount, icon: ListMusic, color: "from-green-500 to-green-600" },
    { label: "المفضلة", value: favoriteCount, icon: Heart, color: "from-red-500 to-red-600" },
    { label: "المساحة المستخدمة", value: formatFileSize(storageUsed), icon: HardDrive, color: "from-yellow-500 to-yellow-600" },
    { label: "إجمالي المدة", value: formatDuration(totalDuration), icon: Clock, color: "from-cyan-500 to-cyan-600" },
  ]

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">الرئيسية</h1>
        <p className="text-white/50 mt-1">مرحباً بك في مكتبتك الموسيقية</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-white/50 mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {recentPlays.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">آخر الاستماع</h2>
          <div className="grid gap-2">
            {recentPlays.map((song) => (
              <Card key={song.id} className="flex items-center gap-4 p-3">
                <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Music2 size={18} className="text-white/50" />
                </div>
                <div>
                  <p className="text-sm text-white">{song.title}</p>
                  <p className="text-xs text-white/50">{song.artist || "فنان غير معروف"}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-white/10 rounded-2xl p-6 text-center">
        <TrendingUp size={32} className="mx-auto mb-3 text-blue-400" />
        <p className="text-white/70">
          {songCount === 0
            ? "ابدأ بإضافة أغانيك إلى المكتبة"
            : `لديك ${songCount} أغنية في مكتبتك`}
        </p>
      </div>
    </div>
  )
}
