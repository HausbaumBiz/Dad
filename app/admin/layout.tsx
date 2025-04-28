import type { ReactNode } from "react"
import Link from "next/link"
import { Users, Building, Home, MapPin, ImageIcon } from "lucide-react"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navItems = [
    { href: "/admin", label: "Dashboard", icon: <Home className="h-4 w-4 mr-2" /> },
    { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4 mr-2" /> },
    { href: "/admin/businesses", label: "Businesses", icon: <Building className="h-4 w-4 mr-2" /> },
    { href: "/admin/zip-codes", label: "ZIP Codes", icon: <MapPin className="h-4 w-4 mr-2" /> },
    { href: "/admin/media", label: "Media", icon: <ImageIcon className="h-4 w-4 mr-2" /> },
  ]

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-100 border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex items-center p-2 rounded-md hover:bg-gray-200 transition-colors">
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
