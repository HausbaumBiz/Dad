import Link from "next/link"
import Image from "next/image"

export function MainHeader() {
  return (
    <header className="bg-white border-b border-gray-200 py-6">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="relative w-[500px] h-[150px]">
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
          className="px-4 py-2 rounded-md bg-hausbaum hover:bg-hausbaum-dark transition-colors text-white font-medium"
        >
          Back to Workbench
        </Link>
      </div>
    </header>
  )
}
