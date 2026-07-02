import Image from "next/image";
import Link from "next/link";

export default function NavBar({ businessName }: { businessName: string }) {
  return (
    <header className="bg-blush">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-4 md:py-6">
        <Link href="/" className="flex items-center justify-center">
          <Image
            src="/images/logo.png"
            alt={`${businessName} logo`}
            width={480}
            height={480}
            className="h-56 w-56 sm:h-72 sm:w-72 md:h-96 md:w-96"
            priority
          />
        </Link>
      </div>
    </header>
  );
}
