import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  BarChart3,
  Users,
  MapPin,
  Eye,
  TrendingUp,
  Calendar,
  Star,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Clock,
} from "lucide-react"

// Mock data - replace with actual data fetching
const mockStats = {
  totalViews: 1247,
  monthlyViews: 89,
  weeklyViews: 23,
  totalReviews: 12,
  averageRating: 4.6,
  totalInquiries: 34,
  responseRate: 92,
  zipCodes: [
    { zip: "12345", city: "Springfield", state: "IL" },
    { zip: "12346", city: "Shelbyville", state: "IL" },
    { zip: "12347", city: "Capital City", state: "IL" },
    { zip: "12348", city: "Ogdenville", state: "IL" },
    { zip: "12349", city: "North Haverbrook", state: "IL" },
    { zip: "12350", city: "Brockway", state: "IL" },
  ],
  recentActivity: [
    { type: "view", description: "Profile viewed from Springfield, IL", time: "2 hours ago" },
    { type: "inquiry", description: "New inquiry received", time: "5 hours ago" },
    { type: "review", description: "New 5-star review received", time: "1 day ago" },
    { type: "view", description: "Profile viewed from Shelbyville, IL", time: "2 days ago" },
  ],
  businessInfo: {
    name: "ABC Home Services",
    category: "Home Improvement",
    phone: "(555) 123-4567",
    email: "info@abchomeservices.com",
    website: "www.abchomeservices.com",
    joinDate: "January 2024",
    status: "Active",
  },
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string
  value: string | number
  icon: any
  trend?: "up" | "down"
  trendValue?: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && trendValue && (
              <div className={`flex items-center mt-1 text-sm ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
                <TrendingUp className={`h-4 w-4 mr-1 ${trend === "down" ? "rotate-180" : ""}`} />
                {trendValue}
              </div>
            )}
          </div>
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  )
}

function BusinessInfoCard() {
  const { businessInfo } = mockStats

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Business Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Business Name</p>
            <p className="font-semibold">{businessInfo.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Category</p>
            <Badge variant="secondary">{businessInfo.category}</Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Phone</p>
            <p className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {businessInfo.phone}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Email</p>
            <p className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {businessInfo.email}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Website</p>
            <p className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              {businessInfo.website}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Member Since</p>
            <p className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {businessInfo.joinDate}
            </p>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Status</p>
            <Badge variant="default" className="bg-green-100 text-green-800">
              {businessInfo.status}
            </Badge>
          </div>
          <Button variant="outline" size="sm">
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ServiceAreaCard() {
  const { zipCodes } = mockStats

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Your Service Area
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {zipCodes.map((zipCode, index) => (
            <div key={index} className="flex flex-col p-2 bg-gray-50 rounded text-sm">
              <span className="font-mono font-medium">{zipCode.zip}</span>
              {zipCode.city && zipCode.state && (
                <span className="text-xs text-gray-500">
                  {zipCode.city}, {zipCode.state}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full bg-transparent">
            Manage Service Area
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentActivityCard() {
  const { recentActivity } = mockStats

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "view":
        return <Eye className="h-4 w-4 text-blue-500" />
      case "inquiry":
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case "review":
        return <Star className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              {getActivityIcon(activity.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full bg-transparent">
            View All Activity
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function StatisticsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Statistics</h1>
          <p className="text-gray-600 mt-1">Track your business performance and engagement</p>
        </div>
        <Button>Download Report</Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Profile Views"
          value={mockStats.totalViews.toLocaleString()}
          icon={Eye}
          trend="up"
          trendValue="+12% this month"
        />
        <StatCard
          title="Monthly Views"
          value={mockStats.monthlyViews}
          icon={TrendingUp}
          trend="up"
          trendValue="+5% vs last month"
        />
        <StatCard
          title="Customer Reviews"
          value={mockStats.totalReviews}
          icon={Star}
          trend="up"
          trendValue={`${mockStats.averageRating} avg rating`}
        />
        <StatCard
          title="Total Inquiries"
          value={mockStats.totalInquiries}
          icon={MessageSquare}
          trend="up"
          trendValue={`${mockStats.responseRate}% response rate`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <BusinessInfoCard />
          <ServiceAreaCard />
        </div>
        <div className="space-y-6">
          <RecentActivityCard />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
                <Users className="h-6 w-6" />
                <span className="text-sm">Update Profile</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
                <MapPin className="h-6 w-6" />
                <span className="text-sm">Service Areas</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
                <Star className="h-6 w-6" />
                <span className="text-sm">Manage Reviews</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">View Analytics</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
