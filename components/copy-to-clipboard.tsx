"use client"

import { useState } from "react"
import { ClipboardCopy, Check } from "lucide-react"

interface CopyToClipboardProps {
  text: string
  className?: string
}

export function CopyToClipboard({ text, className = "" }: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center justify-center ${className}`}
      title="Copy to clipboard"
      type="button"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
    </button>
  )
}
