import Link from "next/link"
import Image from "next/image"

export function MainHeader() {
  return (
    <header className="bg-white border-b border-gray-200 py-4 md:py-6">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="relative w-[200px] h-[60px] sm:w-[300px] sm:h-[90px] md:w-[400px] md:h-[120px] lg:w-[500px] lg:h-[150px]">
            <Image
              src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/hausbaumbiz03-JJedtHiDvlWtJs7irPdMNCF6JoRQfS.png"
              alt="Hausbaum Logo"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </Link>
        <Link
          href="/workbench"
          className="px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded-md bg-hausbaum hover:bg-hausbaum-dark transition-colors text-white font-medium text-xs sm:text-sm md:text-base whitespace-nowrap ml-2"
        >
          <span className="hidden sm:inline">Back to Workbench</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>
    </header>
  )
}
