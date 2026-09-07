import Image from 'next/image';
import Link from 'next/link';
import { SignedIn, UserButton } from '@clerk/nextjs';
import MobileNav from './MobileNav';

const Navbar = () => {
  return (
    <nav className="flex-between fixed z-50 w-full bg-dark-1/80 border-b border-white/10 px-6 py-3.5 backdrop-blur-xl sm:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/icons/logo.svg"
          width={28}
          height={28}
          alt="YOOM logo"
        />
        <p className="text-xl font-extrabold text-white">
          YOOM
        </p>
      </Link>
      <div className="flex items-center gap-4">
        <SignedIn>
          <UserButton afterSignOutUrl="/sign-in" />
        </SignedIn>
        <MobileNav />
      </div>
    </nav>
  );
};

export default Navbar;
