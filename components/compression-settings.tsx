"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings } from "lucide-react"
import type { CompressionSettings } from "@/hooks/use-media-upload"

interface CompressionSettingsProps {
  settings: CompressionSettings
  onChange: (settings: CompressionSettings) => void
}

export function CompressionSettingsDialog({ settings, onChange }: CompressionSettingsProps) {
  const [localSettings, setLocalSettings] = useState<CompressionSettings>(settings)

  const handleSave = () => {
    onChange(localSettings)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings size={16} />
          <span>Compression Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Media Compression Settings</DialogTitle>
          <DialogDescription>
            Configure how your images and videos are compressed to improve loading times.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="compression-enabled" className="flex flex-col gap-1">
              <span>Enable Compression</span>
              <span className="font-normal text-xs text-muted-foreground">
                Reduces file size while maintaining quality
              </span>
            </Label>
            <Switch
              id="compression-enabled"
              checked={localSettings.enabled}
              onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, enabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-optimize" className="flex flex-col gap-1">
              <span>Auto-Optimize</span>
              <span className="font-normal text-xs text-muted-foreground">Automatically choose the best settings</span>
            </Label>
            <Switch
              id="auto-optimize"
              checked={localSettings.autoOptimize}
              onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, autoOptimize: checked }))}
              disabled={!localSettings.enabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality-slider">Quality ({localSettings.quality}%)</Label>
            <Slider
              id="quality-slider"
              min={40}
              max={100}
              step={5}
              value={[localSettings.quality]}
              onValueChange={(value) => setLocalSettings((prev) => ({ ...prev, quality: value[0] }))}
              disabled={!localSettings.enabled || localSettings.autoOptimize}
            />
            <p className="text-xs text-muted-foreground">Higher quality means larger file size</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format-select">Image Format</Label>
            <Select
              value={localSettings.format}
              onValueChange={(value: "jpeg" | "png" | "webp" | "avif") =>
                setLocalSettings((prev) => ({ ...prev, format: value }))
              }
              disabled={!localSettings.enabled || localSettings.autoOptimize}
            >
              <SelectTrigger id="format-select">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webp">WebP (Best compression)</SelectItem>
                <SelectItem value="jpeg">JPEG (Good compatibility)</SelectItem>
                <SelectItem value="png">PNG (Lossless)</SelectItem>
                <SelectItem value="avif">AVIF (Newest format)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">WebP offers the best balance of quality and size</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-dimension">Maximum Dimension ({localSettings.maxDimension}px)</Label>
            <Select
              value={localSettings.maxDimension.toString()}
              onValueChange={(value) => setLocalSettings((prev) => ({ ...prev, maxDimension: Number.parseInt(value) }))}
              disabled={!localSettings.enabled || localSettings.autoOptimize}
            >
              <SelectTrigger id="max-dimension">
                <SelectValue placeholder="Select max dimension" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="800">800px (Small)</SelectItem>
                <SelectItem value="1280">1280px (Medium)</SelectItem>
                <SelectItem value="1920">1920px (Large - HD)</SelectItem>
                <SelectItem value="2560">2560px (Extra Large - 2K)</SelectItem>
                <SelectItem value="3840">3840px (Ultra HD - 4K)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Larger dimensions preserve more detail but increase file size
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
