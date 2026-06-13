"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ListMusic, Plus, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import type { Playlist } from "@/lib/types"

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()
  const router = useRouter()

  const fetchPlaylists = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    setPlaylists(data || [])
  }

  useEffect(() => { fetchPlaylists() }, [])

  const createPlaylist = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("يجب تسجيل الدخول أولاً"); setCreating(false); return }

    const { error: insertError } = await supabase.from("playlists").insert({
      user_id: user.id,
      title: newTitle.trim(),
    })

    if (insertError) {
      setError(insertError.message)
      setCreating(false)
      return
    }

    setNewTitle("")
    setError("")
    setShowCreate(false)
    setCreating(false)
    fetchPlaylists()
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">قوائم التشغيل</h1>
            <p className="text-sm text-white/50 mt-1">{playlists.length} قائمة</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={18} className="ml-2" />
            قائمة جديدة
          </Button>
        </div>

        {playlists.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <ListMusic size={28} className="text-white/20" />
            </div>
            <p className="text-white/50">لا توجد قوائم تشغيل بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map((playlist) => (
              <Card key={playlist.id} hover onClick={() => router.push(`/playlists/${playlist.id}`)} className="p-0 overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center">
                  <ListMusic size={40} className="text-white/30" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-white truncate">{playlist.title}</p>
                  <p className="text-xs text-white/40 mt-1">{playlist.song_count || 0} أغنية</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showCreate} onClose={() => { setShowCreate(false); setError("") }} title="قائمة تشغيل جديدة">
          <div className="space-y-4">
            <Input label="اسم القائمة" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="أدخل اسم القائمة" />
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <Button onClick={createPlaylist} className="w-full" disabled={!newTitle.trim() || creating}>
              {creating ? "جاري الإنشاء..." : "إنشاء القائمة"}
            </Button>
          </div>
        </Dialog>
      </div>
    </AppShell>
  )
}
