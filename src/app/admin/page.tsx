"use client"

import { useEffect, useState } from "react"
import { Users, HardDrive, Music2, Disc3, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsAdmin(false); return }

      const { data: currentUser } = await supabase.from("users").select("is_admin").eq("id", user.id).maybeSingle()
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

  if (isAdmin === null) return <AppShell><div className="p-6 text-center py-16"><p className="text-white/50">جاري التحميل...</p></div></AppShell>
  if (isAdmin === false) return <AppShell><div className="p-6 text-center py-16"><p className="text-white/50">ليس لديك صلاحية الوصول</p></div></AppShell>

  const statCards = [
    { label: "المستخدمين", value: totalUsers, icon: Users, color: "from-blue-500 to-blue-600" },
    { label: "الأغاني", value: totalSongs, icon: Music2, color: "from-purple-500 to-purple-600" },
    { label: "المساحة الكلية", value: formatFileSize(totalStorage), icon: HardDrive, color: "from-yellow-500 to-yellow-600" },
    { label: "الألبومات", value: totalAlbums, icon: Disc3, color: "from-green-500 to-green-600" },
  ]

  return (
    <AppShell>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">لوحة الإدارة</h1>
          <p className="text-white/50 mt-1">إدارة المنصة والإحصائيات العامة</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">المستخدمين</h2>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-right p-4 text-xs text-white/40 font-medium">المستخدم</th>
                    <th className="text-right p-4 text-xs text-white/40 font-medium">البريد</th>
                    <th className="text-right p-4 text-xs text-white/40 font-medium">الأغاني</th>
                    <th className="text-right p-4 text-xs text-white/40 font-medium">المساحة</th>
                    <th className="text-right p-4 text-xs text-white/40 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm text-white">{user.username}</td>
                      <td className="p-4 text-sm text-white/50" dir="ltr">{user.email}</td>
                      <td className="p-4 text-sm text-white/70">{user.song_count}</td>
                      <td className="p-4 text-sm text-white/70">{formatFileSize(user.storage_used)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs ${user.is_admin ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-white/50"}`}>
                          {user.is_admin ? "مدير" : "مستخدم"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
