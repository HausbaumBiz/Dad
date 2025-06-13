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
      </div>
    </header>
  )
}
