'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { ChevronRight } from 'lucide-react';

import { sidebarLinks } from '@/constants';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useUser();

  const userName = user?.fullName || user?.firstName || user?.username || 'User';

  return (
    <section className="sticky left-0 top-0 flex h-screen w-fit flex-col justify-between bg-dark-1/90 p-5 pt-8 border-r border-white/10 text-white max-sm:hidden lg:w-[264px] backdrop-blur-xl">
      <div className="flex flex-1 flex-col gap-6">
        {/* Top Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-3">
          <Image
            src="/icons/logo.svg"
            width={32}
            height={32}
            alt="YOOM Logo"
          />
          <span className="text-2xl font-extrabold tracking-tight text-white max-lg:hidden">
            YOOM
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex flex-col gap-1.5 pt-2">
          {sidebarLinks.map((item) => {
            const isActive =
              pathname === item.route ||
              (item.route !== '/' && pathname.startsWith(`${item.route}/`));

            return (
              <Link
                href={item.route}
                key={item.label}
                className={cn(
                  'group flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200',
                  {
                    'bg-dark-3/80 text-white font-medium border border-white/10 shadow-sm':
                      isActive,
                    'text-sky-2/70 hover:bg-dark-3/40 hover:text-white':
                      !isActive,
                  },
                )}
              >
                <Image
                  src={item.imgURL}
                  alt={item.label}
                  width={20}
                  height={20}
                  className={cn('transition-opacity duration-200', {
                    'opacity-100': isActive,
                    'opacity-60 group-hover:opacity-100': !isActive,
                  })}
                />
                <p className="text-sm font-medium max-lg:hidden">
                  {item.label}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom User Card */}
      <div className="border-t border-white/10 pt-4 mt-auto">
        <div className="flex items-center justify-between gap-3 px-2 py-2 rounded-xl bg-dark-2/60 border border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <UserButton afterSignOutUrl="/sign-in" />
            <div className="flex flex-col max-lg:hidden overflow-hidden">
              <span className="text-xs font-semibold text-white truncate">
                {userName}
              </span>
              <span className="text-[11px] text-sky-2/50 truncate">
                {user?.primaryEmailAddress?.emailAddress || 'Pro Plan'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-sky-2/40 max-lg:hidden" />
        </div>
      </div>
    </section>
  );
};

export default Sidebar;
