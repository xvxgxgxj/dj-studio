"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowRight, Music2, Plus, Trash2, Disc3 } from "lucide-react"
import { createClient, requireSession } from "@/lib/supabase/client"
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
    const session = await requireSession()
    if (!session) return
    const { data } = await supabase.from("songs").select("*").eq("user_id", session.user.id)
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
  const available = allSongs.filter((s) => !albumSongIds.has(s.id))
  const songs = albumSongs.map((as) => as.song!).filter(Boolean)

  if (!album) return null

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-white/50 hover:text-white transition-all">
          <ArrowRight size={20} />
          <span className="text-sm">رجوع</span>
        </button>

        <div className="flex items-center gap-6">
          <div className="h-48 w-48 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
            {album.cover_url ? (
              <img src={album.cover_url} alt={album.title} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <Disc3 size={64} className="text-white/30" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{album.title}</h1>
            {album.description && <p className="text-white/50 mt-2">{album.description}</p>}
            <p className="text-sm text-white/40 mt-1">{songs.length} أغنية</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={18} className="ml-2" />
            إضافة أغنية
          </Button>
        </div>

        {songs.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Music2 size={28} className="text-white/20" />
            </div>
            <p className="text-white/50">هذا الألبوم فارغ</p>
          </div>
        ) : (
          <Card className="divide-y divide-white/5 p-2">
            {songs.map((song) => (
              <div key={song.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <SongCard song={song} allSongs={songs} />
                </div>
                <button
                  onClick={() => removeSong(albumSongs.find((as) => as.song?.id === song.id)?.id!)}
                  className="text-white/20 hover:text-red-400 transition-all p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </Card>
        )}

        <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="إضافة أغنية للألبوم">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {available.length === 0 ? (
              <p className="text-white/50 text-center py-8">جميع الأغاني موجودة بالفعل في الألبوم</p>
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
