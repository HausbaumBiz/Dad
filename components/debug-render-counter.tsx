"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface DebugRenderCounterProps {
  componentName: string
  logToConsole?: boolean
  showInUI?: boolean
  children?: React.ReactNode
}

export function DebugRenderCounter({
  componentName,
  logToConsole = true,
  showInUI = true,
  children,
}: DebugRenderCounterProps) {
  const renderCount = useRef(0)
  const [, forceUpdate] = useState({})

  useEffect(() => {
    renderCount.current += 1

    if (logToConsole) {
      console.log(`[${componentName}] render count: ${renderCount.current}`)
    }

    // Detect potential infinite loop
    if (renderCount.current > 25) {
      console.error(`⚠️ POTENTIAL INFINITE LOOP DETECTED in [${componentName}] - ${renderCount.current} renders`)

      // Log component props and state if possible
      console.error("Check this component for:")
      console.error("1. State updates during render")
      console.error("2. Missing dependencies in useEffect")
      console.error("3. Props changing on every render")
      console.error("4. Parent-child state update loops")
    }
  })

  return (
    <>
      {showInUI && (
        <div className="fixed bottom-0 right-0 bg-red-500 text-white px-2 py-1 text-xs z-50">
          {componentName}: {renderCount.current} renders
        </div>
      )}
      {children}
    </>
  )
}
