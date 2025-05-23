"use client"

import { useState, useEffect } from "react"

/**
 * Custom hook to detect if the current device is a mobile device
 * @param breakpoint The breakpoint to consider as mobile (default: 768px)
 * @returns A boolean indicating if the current device is a mobile device
 */
export function useMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    // Function to check if the window width is less than the breakpoint
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Initial check
    checkMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile)

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [breakpoint])

  return isMobile
}

export default useMobile
