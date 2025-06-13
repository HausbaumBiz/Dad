export function MainFooter() {
  return (
    <footer className="bg-gray-800 text-white py-6 relative overflow-hidden">
      {/* Texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-60 mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 2px, transparent 0)",
          backgroundSize: "10px 10px",
        }}
      />

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex space-x-6">
            <a href="/contact-us" className="hover:text-hausbaum transition-colors drop-shadow-sm">
              Contact Us
            </a>
            <a href="/legal-notice" className="hover:text-hausbaum transition-colors drop-shadow-sm">
              Legal Notice
            </a>
            <a href="/privacy-policy" className="hover:text-hausbaum transition-colors drop-shadow-sm">
              Privacy Policy
            </a>
          </div>
          <p className="drop-shadow-sm">&copy; {new Date().getFullYear()} Hausbaum. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
