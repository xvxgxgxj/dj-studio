"use client"

import { useEffect, useState } from "react"
import { Users, HardDrive, Music2, Disc3, TrendingUp } from "lucide-react"
import { createClient, requireSession } from "@/lib/supabase/client"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { formatFileSize } from "@/lib/utils"
import type { User } from "@/lib/types"

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalSongs, setTotalSongs] = useState(0)
  const [totalStorage, setTotalStorage] = useState(0)
  const [totalAlbums, setTotalAlbums] = useState(0)
  const [users, setUsers] = useState<(User & { song_count: number; storage_used: number })[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function checkAndLoad() {
      const session = await requireSession()
      if (!session) return

      const { data: currentUser } = await supabase.from("users").select("is_admin").eq("id", session.user.id).maybeSingle()
      if (!currentUser?.is_admin) { setIsAdmin(false); return }

      setIsAdmin(true)

      const [usersRes, songsRes, albumsRes] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("songs").select("*"),
        supabase.from("albums").select("id", { count: "exact", head: true }),
      ])

      const usersData = usersRes.data || []
      const songsData = songsRes.data || []
      setTotalUsers(usersData.length)
      setTotalSongs(songsData.length)
      setTotalStorage(songsData.reduce((acc, s) => acc + s.file_size, 0))
      setTotalAlbums(albumsRes.count || 0)
      setUsers(usersData.map((u) => ({
        ...u,
        song_count: songsData.filter((s) => s.user_id === u.id).length,
        storage_used: songsData.filter((s) => s.user_id === u.id).reduce((acc, s) => acc + s.file_size, 0),
      })))
    }
    checkAndLoad()
  }, [])

  if (isAdmin === null) return null
  if (!isAdmin) return <AppShell><div className="p-6 text-center text-white/50 text-lg mt-20">غير مصرح لك بالوصول إلى لوحة التحكم</div></AppShell>

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide">المستخدمون</p>
                <p className="text-2xl font-bold text-white mt-1">{totalUsers}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users size={20} className="text-blue-400" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide">الأغاني</p>
                <p className="text-2xl font-bold text-white mt-1">{totalSongs}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Music2 size={20} className="text-green-400" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide">التخزين</p>
                <p className="text-2xl font-bold text-white mt-1">{formatFileSize(totalStorage)}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <HardDrive size={20} className="text-purple-400" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide">الألبومات</p>
                <p className="text-2xl font-bold text-white mt-1">{totalAlbums}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Disc3 size={20} className="text-orange-400" />
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">المستخدمون</h2>
          </div>
          <div className="divide-y divide-white/5">
            {users.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Users size={14} className="text-white/40" />
                  </div>
                  <div>
                    <p className="text-white">{u.email || "بدون بريد"}</p>
                    <p className="text-white/30 text-xs">{u.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-white/50">{u.song_count} أغنية</span>
                  <span className="text-white/50">{formatFileSize(u.storage_used)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
