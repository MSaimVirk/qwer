'use client'

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <Button
      onClick={handleLogout}
      variant="ghost"
      className="text-white hover:bg-gray-800"
    >
      Logout
    </Button>
  )
}
