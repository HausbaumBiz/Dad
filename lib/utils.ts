import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add a browser-compatible unique ID generator
export function generateId(): string {
  // Use browser's built-in crypto if available
  if (typeof window !== "undefined" && window.crypto) {
    // Modern browsers have this API
    if (window.crypto.randomUUID) {
      return window.crypto.randomUUID()
    }

    // Fallback for older browsers
    const array = new Uint32Array(4)
    window.crypto.getRandomValues(array)
    return Array.from(array, (dec) => dec.toString(16).padStart(8, "0")).join("")
  }

  // Server-side fallback (Node.js environment)
  if (typeof process !== "undefined" && process.env) {
    try {
      // Use Node.js crypto in server components only
      // This code will be eliminated during client-side bundling
      const { randomUUID } = require("crypto")
      return randomUUID()
    } catch (e) {
      // Fallback if crypto module is not available
      console.warn("Node.js crypto module not available, using fallback ID generator")
    }
  }

  // Ultimate fallback using Math.random
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}
