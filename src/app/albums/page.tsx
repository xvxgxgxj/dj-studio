"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Disc3, Plus, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import type { Album } from "@/lib/types"

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()
  const router = useRouter()

  const fetchAlbums = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("albums")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    setAlbums(data || [])
  }

  useEffect(() => { fetchAlbums() }, [])

  const createAlbum = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("يجب تسجيل الدخول أولاً"); setCreating(false); return }

    const { error: insertError } = await supabase.from("albums").insert({
      user_id: user.id,
      title: newTitle.trim(),
      description: newDesc.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      setCreating(false)
      return
    }

    setNewTitle("")
    setNewDesc("")
    setError("")
    setShowCreate(false)
    setCreating(false)
    fetchAlbums()
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">الألبومات</h1>
            <p className="text-sm text-white/50 mt-1">{albums.length} ألبوم</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={18} className="ml-2" />
            ألبوم جديد
          </Button>
        </div>

        {albums.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Disc3 size={28} className="text-white/20" />
            </div>
            <p className="text-white/50">لا توجد ألبومات بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((album) => (
              <Card
                key={album.id}
                hover
                onClick={() => router.push(`/albums/${album.id}`)}
                className="p-0 overflow-hidden"
              >
                <div className="aspect-square bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                  {album.cover_url ? (
                    <img src={album.cover_url} alt={album.title} className="h-full w-full object-cover" />
                  ) : (
                    <Disc3 size={40} className="text-white/30" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-white truncate">{album.title}</p>
                  <p className="text-xs text-white/40 mt-1">{album.song_count || 0} أغنية</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showCreate} onClose={() => { setShowCreate(false); setError("") }} title="ألبوم جديد">
          <div className="space-y-4">
            <Input
              label="اسم الألبوم"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="أدخل اسم الألبوم"
            />
            <Input
              label="الوصف (اختياري)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="وصف الألبوم"
            />
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <Button onClick={createAlbum} className="w-full" disabled={!newTitle.trim() || creating}>
              {creating ? "جاري الإنشاء..." : "إنشاء الألبوم"}
            </Button>
          </div>
        </Dialog>
      </div>
    </AppShell>
  )
}
