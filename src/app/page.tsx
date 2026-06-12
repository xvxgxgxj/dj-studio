"use client"

import { AppShell } from "@/components/layout/AppShell"
import { DashboardContent } from "@/components/dashboard/DashboardContent"

export default function Home() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  )
}
