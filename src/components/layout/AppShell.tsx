"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Disc3 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Providers } from "@/providers/Providers"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { MobileNav } from "@/components/layout/MobileNav"
import { Player } from "@/components/music/Player"
import type { User } from "@/lib/types"

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const checkRan = useRef(false)

  useEffect(() => {
    if (checkRan.current) return
    checkRan.current = true

    async function checkAuth() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push("/login")
        return
      }

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle()

      if (data) {
        setUser(data as User)
      } else {
        setUser({
          id: authUser.id,
          email: authUser.email || "",
          username: authUser.user_metadata?.username || authUser.email?.split("@")[0] || "مستخدم",
          created_at: authUser.created_at,
        })
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Disc3 size={32} className="text-white" />
          </div>
          <Loader2 size={24} className="animate-spin text-white/50 mx-auto" />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <Providers>
      <div className="flex h-screen overflow-hidden bg-black">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header user={user} />
          <div className="flex-1 overflow-y-auto pb-32 md:pb-24">
            {children}
          </div>
        </main>
      </div>
      <Player />
      <MobileNav />
    </Providers>
  )
}
