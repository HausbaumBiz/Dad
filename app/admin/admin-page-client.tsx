"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlaceholderBusinessManager } from "./placeholder-business-manager"
import { Upload, Users, Building, MapPin, ImageIcon, Database, Settings, BarChart3, Search, Wrench } from "lucide-react"

const adminSections = [
  {
    title: "Users",
    description: "Manage user accounts and permissions.",
    href: "/admin/users",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "Businesses",
    description: "Manage business listings and information.",
    href: "/admin/businesses",
    icon: Building,
    color: "text-green-600",
  },
  {
    title: "ZIP Codes",
    description: "Manage ZIP code data and service areas.",
    href: "/admin/zip-codes",
    icon: MapPin,
    color: "text-purple-600",
  },
  {
    title: "Media",
    description: "Manage uploaded images, videos, and other media.",
    href: "/admin/media",
    icon: ImageIcon,
    color: "text-orange-600",
  },
  {
    title: "Category Mappings",
    description: "View and manage mappings between business categories and frontend pages.",
    href: "/admin/category-mappings",
    icon: Settings,
    color: "text-indigo-600",
  },
  {
    title: "Redis Structure",
    description: "Monitor and manage Redis data structure and cache.",
    href: "/admin/redis-structure",
    icon: Database,
    color: "text-red-600",
  },
  {
    title: "Inspect Categories",
    description: "Inspect how categories are stored in Redis and debug category issues.",
    href: "/admin/inspect-categories",
    icon: Search,
    color: "text-teal-600",
  },
  {
    title: "System Analytics",
    description: "View system performance and usage analytics.",
    href: "/admin/analytics",
    icon: BarChart3,
    color: "text-pink-600",
  },
  {
    title: "Debug Tools",
    description: "Access various debugging and maintenance tools.",
    href: "/admin/debug-tools",
    icon: Wrench,
    color: "text-yellow-600",
  },
]

export default function AdminPageClient() {
  return (
    <main className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage data and tools for the site.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/admin/businesses">
              <Users className="h-4 w-4 mr-2" />
              Manage Businesses
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Create Placeholder Businesses from CSV
          </CardTitle>
          <CardDescription>
            Upload a CSV and place all entries on a selected category page. Each placeholder shows business name, phone,
            and zip, and will NOT display a photo album.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlaceholderBusinessManager />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => {
          const IconComponent = section.icon
          return (
            <Link key={section.href} href={section.href} className="group">
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-gray-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-gray-100 ${section.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                      {section.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">{section.description}</CardDescription>
                  <div className="mt-4 flex items-center text-sm text-blue-600 font-medium group-hover:text-blue-800 transition-colors">
                    Access {section.title.toLowerCase()}
                    <svg
                      className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="mt-12 bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">--</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">--</div>
            <div className="text-sm text-gray-600">Active Businesses</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">--</div>
            <div className="text-sm text-gray-600">ZIP Codes</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">--</div>
            <div className="text-sm text-gray-600">Media Files</div>
          </div>
        </div>
      </div>
    </main>
  )
}
