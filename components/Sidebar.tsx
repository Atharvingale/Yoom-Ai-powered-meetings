'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import {
  Home,
  Calendar,
  History,
  Video,
  Sparkles,
  User,
  ChevronRight,
} from 'lucide-react';

import { sidebarLinks } from '@/constants';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home size={20} />,
  Schedule: <Calendar size={20} />,
  Previous: <History size={20} />,
  Recordings: <Video size={20} />,
  Summaries: <Sparkles size={20} />,
  'Personal Room': <User size={20} />,
};

const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useUser();

  const userName = user?.fullName || user?.firstName || user?.username || 'User';

  return (
    <section className="sticky left-0 top-0 flex h-screen w-fit flex-col justify-between bg-dark-1/90 p-5 pt-8 border-r border-dark-3/60 text-white max-sm:hidden lg:w-[264px] backdrop-blur-xl">
      <div className="flex flex-1 flex-col gap-8">
        {/* Top Logo Header */}
        <Link href="/" className="flex items-center gap-3 px-2 group">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-md shadow-purple-950/40 transition-transform group-hover:scale-105">
            <Image
              src="/icons/logo.svg"
              width={24}
              height={24}
              alt="YOOM Logo"
              className="brightness-200"
            />
          </div>
          <div className="flex flex-col max-lg:hidden">
            <span className="text-xl font-extrabold tracking-tight text-white leading-none">
              YOOM
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sky-200/60 pt-0.5">
              AI Workspace
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex flex-col gap-1.5 pt-1">
          {sidebarLinks.map((item) => {
            const isActive =
              pathname === item.route ||
              (item.route !== '/' && pathname.startsWith(`${item.route}/`));
            const IconComponent = iconMap[item.label] || (
              <Image
                src={item.imgURL}
                alt={item.label}
                width={20}
                height={20}
              />
            );

            return (
              <Link
                href={item.route}
                key={item.label}
                className={cn(
                  'group relative flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200',
                  {
                    'bg-gradient-to-r from-blue-600/90 to-blue-700/80 text-white font-semibold shadow-lg shadow-blue-900/30':
                      isActive,
                    'text-sky-200/70 hover:bg-dark-3/60 hover:text-white':
                      !isActive,
                  },
                )}
              >
                <div
                  className={cn('transition-transform duration-200', {
                    'scale-110 text-white': isActive,
                    'text-sky-200/70 group-hover:text-white': !isActive,
                  })}
                >
                  {IconComponent}
                </div>
                <p className="text-sm font-medium max-lg:hidden">
                  {item.label}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom User Profile Card */}
      <div className="border-t border-dark-3/60 pt-4 mt-auto">
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-dark-2/80 border border-dark-3/50 hover:border-dark-3 transition-colors">
          <div className="flex items-center gap-3 overflow-hidden">
            <UserButton afterSignOutUrl="/sign-in" />
            <div className="flex flex-col max-lg:hidden overflow-hidden">
              <span className="text-xs font-semibold text-white truncate">
                {userName}
              </span>
              <span className="text-[10px] text-sky-200/50 truncate">
                {user?.primaryEmailAddress?.emailAddress || 'Free Tier'}
              </span>
            </div>
          </div>
          <ChevronRight size={14} className="text-sky-200/40 max-lg:hidden" />
        </div>
      </div>
    </section>
  );
};

export default Sidebar;
