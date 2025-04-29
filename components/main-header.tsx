import Link from "next/link"
export function MainHeader() {
  return (
    <header className="bg-white border-b border-gray-200 py-4 md:py-6">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link href="/" className="flex items-center">
          <div className="relative w-[280px] sm:w-[350px] md:w-[500px] h-[100px] md:h-[150px]">
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
          className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 whitespace-nowrap"
        >
          Back to Workbench
        </Link>
      </div>
    </header>
  )
}
