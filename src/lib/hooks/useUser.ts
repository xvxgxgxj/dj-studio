"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (cancelled) return

      if (authUser) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle()

        if (data) {
          setUser(data as User)
        } else if (!cancelled) {
          setUser({
            id: authUser.id,
            email: authUser.email || "",
            username: authUser.user_metadata?.username || authUser.email?.split("@")[0] || "مستخدم",
            created_at: authUser.created_at,
          })
        }
      }
      if (!cancelled) setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setUser(null)
      } else if (event === "SIGNED_IN") {
        getUser()
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
