import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: currentUser } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (!currentUser?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const admin = createAdminClient()

  const [usersRes, songsRes] = await Promise.all([
    admin.from("users").select("*"),
    admin.from("songs").select("*"),
  ])

  const users = usersRes.data || []
  const songs = songsRes.data || []

  const totalStorage = songs.reduce((acc, s) => acc + s.file_size, 0)

  return NextResponse.json({
    totalUsers: users.length,
    totalSongs: songs.length,
    totalStorage,
    users: users.map((u) => ({
      ...u,
      song_count: songs.filter((s) => s.user_id === u.id).length,
      storage_used: songs.filter((s) => s.user_id === u.id).reduce((acc, s) => acc + s.file_size, 0),
    })),
  })
}
