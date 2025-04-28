"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatFileSize } from "@/lib/media-utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { ImageIcon, Video, FileText, HardDrive } from "lucide-react"

interface MediaStatsProps {
  totalItems: number
  totalSize: number
  imageCount: number
  imageSize: number
  videoCount: number
  videoSize: number
  otherCount: number
  otherSize: number
}

export function MediaStats({
  totalItems,
  totalSize,
  imageCount,
  imageSize,
  videoCount,
  videoSize,
  otherCount,
  otherSize,
}: MediaStatsProps) {
  // Data for the pie chart
  const countData = [
    { name: "Images", value: imageCount, color: "#3b82f6" },
    { name: "Videos", value: videoCount, color: "#ef4444" },
    { name: "Other", value: otherCount, color: "#a3a3a3" },
  ].filter((item) => item.value > 0)

  const sizeData = [
    { name: "Images", value: imageSize, color: "#3b82f6" },
    { name: "Videos", value: videoSize, color: "#ef4444" },
    { name: "Other", value: otherSize, color: "#a3a3a3" },
  ].filter((item) => item.value > 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Media Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
              <HardDrive className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-2xl font-bold">{totalItems}</span>
              <span className="text-sm text-gray-500">Total Items</span>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
              <FileText className="h-8 w-8 text-green-500 mb-2" />
              <span className="text-2xl font-bold">{formatFileSize(totalSize)}</span>
              <span className="text-sm text-gray-500">Total Size</span>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
              <ImageIcon className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-2xl font-bold">{imageCount}</span>
              <span className="text-sm text-gray-500">Images</span>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
              <Video className="h-8 w-8 text-red-500 mb-2" />
              <span className="text-2xl font-bold">{videoCount}</span>
              <span className="text-sm text-gray-500">Videos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Storage Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sizeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {sizeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatFileSize(value)}
                  labelFormatter={(index) => sizeData[index].name}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 mt-4">
            {sizeData.map((entry) => (
              <div key={entry.name} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: entry.color }} />
                <span className="text-xs">
                  {entry.name}: {formatFileSize(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
