/**
 * Generates a data URL for a simple SVG placeholder
 *
 * @param width Width of the placeholder
 * @param height Height of the placeholder
 * @param text Optional text to display in the placeholder
 * @param bgColor Background color of the placeholder
 * @param textColor Text color
 * @returns Data URL for the SVG placeholder
 */
export function generatePlaceholder(
  width = 400,
  height = 300,
  text = "",
  bgColor = "#f3f4f6",
  textColor = "#9ca3af",
): string {
  // Create SVG element with the specified dimensions and background
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      ${
        text
          ? `
        <text 
          x="50%" 
          y="50%" 
          font-family="system-ui, sans-serif" 
          font-size="${Math.min(width, height) * 0.1}px" 
          fill="${textColor}" 
          text-anchor="middle" 
          dominant-baseline="middle"
        >
          ${text}
        </text>
      `
          : ""
      }
    </svg>
  `.trim()

  // Convert SVG to data URL
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * Creates a shimmer effect placeholder
 *
 * @param width Width of the placeholder
 * @param height Height of the placeholder
 * @returns Data URL for the shimmer effect SVG
 */
export function generateShimmer(width = 400, height = 300): string {
  const shimmer = `
    <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f3f4f6" offset="20%" />
          <stop stop-color="#eaecef" offset="50%" />
          <stop stop-color="#f3f4f6" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="#f3f4f6" />
      <rect id="r" width="${width}" height="${height}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${width}" to="${width}" dur="1s" repeatCount="indefinite"  />
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(shimmer)}`
}
