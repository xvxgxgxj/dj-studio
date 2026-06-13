"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Disc3, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { APP_NAME } from "@/lib/constants"

export default function SignupPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل")
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })

    if (authError) {
      setError(authError.message === "User already registered"
        ? "البريد الإلكتروني مسجل بالفعل"
        : authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      const { error: userInsertError } = await supabase.from("users").insert({
        id: authData.user.id,
        email,
        username,
      })
      if (userInsertError && !userInsertError.message.includes("duplicate")) {
        setError("تم إنشاء الحساب لكن فشل حفظ البيانات: " + userInsertError.message)
        setLoading(false)
        return
      }
    }

    window.location.href = "/login?registered=true"
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-blue-950/20 to-black">
        <Disc3 size={32} className="text-white/50 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-black via-blue-950/20 to-black">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Disc3 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
          <p className="text-white/50 mt-1">إنشاء حساب جديد</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            label="اسم المستخدم"
            type="text"
            placeholder="اسمك"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            label="البريد الإلكتروني"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            required
          />
          <Input
            label="كلمة المرور"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : "إنشاء الحساب"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="text-white hover:text-white/80 transition-colors">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  )
}
