"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowRight, ListMusic, Plus, Play, Trash2 } from "lucide-react"
import { createClient, requireSession } from "@/lib/supabase/client"
import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { SongCard } from "@/components/music/SongCard"
import { usePlayerStore } from "@/store/playerStore"
import type { Playlist, PlaylistSong, Song } from "@/lib/types"

export default function PlaylistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([])
  const [allSongs, setAllSongs] = useState<Song[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const supabase = createClient()
  const setQueue = usePlayerStore((s) => s.setQueue)

  const fetchData = async () => {
    const { data: pl } = await supabase.from("playlists").select("*").eq("id", params.id).maybeSingle()
    setPlaylist(pl as Playlist | null)

    const { data: ps } = await supabase
      .from("playlist_songs")
      .select("*, song:songs(*)")
      .eq("playlist_id", params.id)
      .order("position", { ascending: true })
    setPlaylistSongs(ps || [])
  }

  const fetchAllSongs = async () => {
    const session = await requireSession()
    if (!session) return
    const { data } = await supabase.from("songs").select("*").eq("user_id", session.user.id)
    setAllSongs(data || [])
  }

  useEffect(() => { fetchData(); fetchAllSongs() }, [params.id])

  const addSong = async (songId: string) => {
    const { error } = await supabase.from("playlist_songs").insert({
      playlist_id: params.id as string,
      song_id: songId,
      position: playlistSongs.length,
    })
    if (error) {
      alert("فشل إضافة الأغنية: " + error.message)
      return
    }
    setShowAdd(false)
    fetchData()
  }

  const removeSong = async (psId: string) => {
    const { error } = await supabase.from("playlist_songs").delete().eq("id", psId)
    if (error) {
      alert("فشل حذف الأغنية: " + error.message)
      return
    }
    fetchData()
  }

  const psIds = new Set(playlistSongs.map((ps) => ps.song?.id))
  const available = allSongs.filter((s) => !psIds.has(s.id))
  const songs = playlistSongs.map((ps) => ps.song!).filter(Boolean)

  if (!playlist) return null

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-white/50 hover:text-white transition-all">
          <ArrowRight size={20} />
          <span className="text-sm">رجوع</span>
        </button>

        <div className="flex items-center gap-6">
          <div className="h-48 w-48 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center flex-shrink-0">
            <ListMusic size={64} className="text-white/30" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{playlist.title}</h1>
            <p className="text-sm text-white/40 mt-1">{songs.length} أغنية</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={18} className="ml-2" />
            إضافة أغنية
          </Button>
          {songs.length > 0 && (
            <Button variant="secondary" onClick={() => setQueue(songs, 0)}>
              <Play size={18} className="ml-2" />
              تشغيل الكل
            </Button>
          )}
        </div>

        {songs.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <ListMusic size={28} className="text-white/20" />
            </div>
            <p className="text-white/50">هذه القائمة فارغة</p>
          </div>
        ) : (
          <Card className="divide-y divide-white/5 p-2">
            {songs.map((song) => (
              <div key={song.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <SongCard song={song} allSongs={songs} />
                </div>
                <button
                  onClick={() => removeSong(playlistSongs.find((ps) => ps.song?.id === song.id)?.id!)}
                  className="text-white/20 hover:text-red-400 transition-all p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </Card>
        )}

        <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="إضافة أغنية للقائمة">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {available.length === 0 ? (
              <p className="text-white/50 text-center py-8">جميع الأغاني موجودة بالفعل في القائمة</p>
            ) : (
              available.map((song) => (
                <button
                  key={song.id}
                  onClick={() => addSong(song.id)}
                  className="w-full text-right p-3 rounded-xl hover:bg-white/5 transition-all text-white text-sm"
                >
                  {song.title}
                </button>
              ))
            )}
          </div>
        </Dialog>
      </div>
    </AppShell>
  )
}
