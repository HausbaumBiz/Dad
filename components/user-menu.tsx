"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, Users } from "lucide-react"
import { useUser } from "@/contexts/user-context"

export function UserMenu() {
  const { user, isLoading, logout } = useUser()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient || isLoading) {
    return <div className="h-9 w-24 bg-gray-200 animate-pulse rounded-md"></div>
  }

  // If no user is logged in, show login/register buttons
  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/user-login">Login</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/user-register">Register</Link>
        </Button>
      </div>
    )
  }

  const userName = `${user.firstName} ${user.lastName}`

  // If user is logged in, show user menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>{userName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/user-profile" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            <span>Admin Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onSelect={async (e) => {
            e.preventDefault()
            await logout()
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
