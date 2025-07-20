"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, LogOut, Heart } from "lucide-react"
import { logoutUser } from "@/app/actions/user-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

interface UserMenuProps {
  userName?: string | null
}

export function UserMenu({ userName }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const result = await logoutUser()

      if (result.success) {
        toast.success("Logged out successfully")
        router.push("/")
        router.refresh()
      } else {
        toast.error("Failed to logout")
      }
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to logout")
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!userName) {
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

  const initials = userName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
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
            <p className="font-medium">{userName}</p>
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
  )
}
