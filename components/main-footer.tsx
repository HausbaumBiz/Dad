export function MainFooter() {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex space-x-6">
            <a href="/contact-us" className="hover:text-hausbaum transition-colors">
              Contact Us
            </a>
            <a href="/legal-notice" className="hover:text-hausbaum transition-colors">
              Legal Notice
            </a>
            <a href="/privacy-policy" className="hover:text-hausbaum transition-colors">
              Privacy Policy
            </a>
          </div>
          <p>&copy; {new Date().getFullYear()} Hausbaum. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
