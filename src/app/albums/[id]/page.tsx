"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowRight, Music2, Plus, Trash2, Disc3 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { SongCard } from "@/components/music/SongCard"
import type { Album, AlbumSong, Song } from "@/lib/types"

export default function AlbumDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [album, setAlbum] = useState<Album | null>(null)
  const [albumSongs, setAlbumSongs] = useState<AlbumSong[]>([])
  const [allSongs, setAllSongs] = useState<Song[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const supabase = createClient()

  const fetchAlbum = async () => {
    const { data } = await supabase.from("albums").select("*").eq("id", params.id).maybeSingle()
    setAlbum(data as Album | null)
  }

  const fetchAlbumSongs = async () => {
    const { data } = await supabase
      .from("album_songs")
      .select("*, song:songs(*)")
      .eq("album_id", params.id)
      .order("position", { ascending: true })
    setAlbumSongs(data || [])
  }

  const fetchAllSongs = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("songs").select("*").eq("user_id", user.id)
    setAllSongs(data || [])
  }

  useEffect(() => {
    fetchAlbum()
    fetchAlbumSongs()
    fetchAllSongs()
  }, [params.id])

  const addSong = async (songId: string) => {
    const { error } = await supabase.from("album_songs").insert({
      album_id: params.id as string,
      song_id: songId,
      position: albumSongs.length,
    })
    if (error) {
      alert("فشل إضافة الأغنية: " + error.message)
      return
    }
    setShowAdd(false)
    fetchAlbumSongs()
  }

  const removeSong = async (albumSongId: string) => {
    const { error } = await supabase.from("album_songs").delete().eq("id", albumSongId)
    if (error) {
      alert("فشل حذف الأغنية: " + error.message)
      return
    }
    fetchAlbumSongs()
  }

  const albumSongIds = new Set(albumSongs.map((as) => as.song?.id))
  const availableSongs = allSongs.filter((s) => !albumSongIds.has(s.id))
  const songs = albumSongs.map((as) => as.song!).filter(Boolean)

  if (!album) return null

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <button onClick={() => router.push("/albums")} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <ArrowRight size={18} />
          <span className="text-sm">العودة للألبومات</span>
        </button>

        <div className="flex items-start gap-6">
          <div className="h-48 w-48 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex-shrink-0 flex items-center justify-center">
            {album.cover_url ? (
              <img src={album.cover_url} alt={album.title} className="h-full w-full object-cover rounded-2xl" />
            ) : (
              <Disc3 size={60} className="text-white/30" />
            )}
          </div>
          <div className="flex-1 pt-4">
            <h1 className="text-3xl font-bold text-white">{album.title}</h1>
            {album.description && <p className="text-white/50 mt-2">{album.description}</p>}
            <p className="text-sm text-white/40 mt-2">{albumSongs.length} أغنية</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">الأغاني</h2>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={16} className="ml-1" />
            إضافة أغنية
          </Button>
        </div>

        {songs.length === 0 ? (
          <div className="text-center py-12">
            <Music2 size={32} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/50">لا توجد أغاني في هذا الألبوم</p>
          </div>
        ) : (
          <Card className="divide-y divide-white/5 p-2">
            {songs.map((song, index) => (
              <div key={song.id} className="group flex items-center gap-2">
                <span className="text-xs text-white/30 w-6 text-center">{index + 1}</span>
                <div className="flex-1"><SongCard song={song} allSongs={songs} /></div>
                <button onClick={() => removeSong(albumSongs[index].id)} className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </Card>
        )}

        <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="إضافة أغنية">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {availableSongs.length === 0 ? (
              <p className="text-center text-white/50 py-4">جميع الأغاني مضافة بالفعل</p>
            ) : (
              availableSongs.map((song) => (
                <button key={song.id} onClick={() => addSong(song.id)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-right">
                  <Music2 size={18} className="text-white/40 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{song.title}</p>
                    <p className="text-xs text-white/40 truncate">{song.artist || "فنان غير معروف"}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </Dialog>
      </div>
    </AppShell>
  )
}
