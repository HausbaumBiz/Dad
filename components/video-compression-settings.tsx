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

interface VideoCompressionSettings {
  enabled: boolean
  quality: number
  resolution: string
  bitrate: number
  autoOptimize: boolean
}

const defaultVideoSettings: VideoCompressionSettings = {
  enabled: true,
  quality: 80,
  resolution: "720p",
  bitrate: 2500,
  autoOptimize: true,
}

interface VideoCompressionSettingsProps {
  settings: VideoCompressionSettings
  onChange: (settings: VideoCompressionSettings) => void
}

export function VideoCompressionSettingsDialog({
  settings = defaultVideoSettings,
  onChange,
}: VideoCompressionSettingsProps) {
  const [localSettings, setLocalSettings] = useState<VideoCompressionSettings>(settings)

  const handleSave = () => {
    onChange(localSettings)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings size={16} />
          <span>Video Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Video Compression Settings</DialogTitle>
          <DialogDescription>Configure how your videos are compressed to improve loading times.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="video-compression-enabled" className="flex flex-col gap-1">
              <span>Enable Compression</span>
              <span className="font-normal text-xs text-muted-foreground">
                Reduces file size while maintaining quality
              </span>
            </Label>
            <Switch
              id="video-compression-enabled"
              checked={localSettings.enabled}
              onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, enabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="video-auto-optimize" className="flex flex-col gap-1">
              <span>Auto-Optimize</span>
              <span className="font-normal text-xs text-muted-foreground">Automatically choose the best settings</span>
            </Label>
            <Switch
              id="video-auto-optimize"
              checked={localSettings.autoOptimize}
              onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, autoOptimize: checked }))}
              disabled={!localSettings.enabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-quality-slider">Quality ({localSettings.quality}%)</Label>
            <Slider
              id="video-quality-slider"
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
            <Label htmlFor="video-resolution-select">Resolution</Label>
            <Select
              value={localSettings.resolution}
              onValueChange={(value) => setLocalSettings((prev) => ({ ...prev, resolution: value }))}
              disabled={!localSettings.enabled || localSettings.autoOptimize}
            >
              <SelectTrigger id="video-resolution-select">
                <SelectValue placeholder="Select resolution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="480p">480p (SD)</SelectItem>
                <SelectItem value="720p">720p (HD)</SelectItem>
                <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                <SelectItem value="1440p">1440p (2K)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">720p offers a good balance of quality and size</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-bitrate-slider">Bitrate ({localSettings.bitrate} kbps)</Label>
            <Slider
              id="video-bitrate-slider"
              min={500}
              max={8000}
              step={500}
              value={[localSettings.bitrate]}
              onValueChange={(value) => setLocalSettings((prev) => ({ ...prev, bitrate: value[0] }))}
              disabled={!localSettings.enabled || localSettings.autoOptimize}
            />
            <p className="text-xs text-muted-foreground">Higher bitrate means better quality but larger file size</p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
