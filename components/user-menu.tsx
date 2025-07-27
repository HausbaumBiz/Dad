"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, LogOut, Heart } from "lucide-react"
import { logoutUser } from "@/app/actions/user-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

interface UserMenuProps {
  userName?: string | null
  onUserChange?: (userName: string | null) => void
}

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
}

export function UserMenu({ userName, onUserChange }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [currentUserName, setCurrentUserName] = useState<string | null>(userName || null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        console.log("[UserMenu] Fetching user session...")
        const response = await fetch("/api/user/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        })

        console.log("[UserMenu] Session response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("[UserMenu] Session data:", data)

          if (data.success && data.user && data.user.firstName && data.user.lastName) {
            const fullName = `${data.user.firstName} ${data.user.lastName}`
            console.log("[UserMenu] Setting user name:", fullName)
            setCurrentUserName(fullName)
            onUserChange?.(fullName)
          } else {
            console.log("[UserMenu] No valid user data found")
            setCurrentUserName(null)
            onUserChange?.(null)
          }
        } else {
          console.log("[UserMenu] Session request failed")
          setCurrentUserName(null)
          onUserChange?.(null)
        }
      } catch (error) {
        console.error("[UserMenu] Error fetching user session:", error)
        setCurrentUserName(null)
        onUserChange?.(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserSession()
  }, [onUserChange])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      console.log("[UserMenu] Logging out...")

      const result = await logoutUser()

      if (result.success) {
        console.log("[UserMenu] Logout successful")
        setCurrentUserName(null)
        onUserChange?.(null)
        toast.success("Logged out successfully")
        // Use window.location.href to ensure full page refresh
        window.location.href = "/"
      } else {
        console.log("[UserMenu] Logout failed:", result.message)
        toast.error("Failed to logout")
      }
    } catch (error) {
      console.error("[UserMenu] Logout error:", error)
      toast.error("Failed to logout")
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
      </div>
    )
  }

  if (!currentUserName) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/user-login">
          <Button variant="outline" size="sm">
            Login
          </Button>
        </Link>
        <Link href="/user-register">
          <Button size="sm">Register</Button>
        </Link>
      </div>
    )
  }

  const initials = currentUserName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-center gap-3">
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
        <User className="w-3 h-3 mr-1" />
        {currentUserName}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">{currentUserName}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/user-profile" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/favorites" className="flex items-center">
              <Heart className="mr-2 h-4 w-4" />
              Favorites
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onSelect={handleLogout} disabled={isLoggingOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
