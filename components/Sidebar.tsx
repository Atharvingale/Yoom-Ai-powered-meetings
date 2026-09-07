'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { sidebarLinks } from '@/constants';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <section className="sticky left-0 top-0 flex h-screen w-fit flex-col justify-between bg-dark-1 p-6 pt-28 text-white max-sm:hidden lg:w-[264px]">
      <div className="flex flex-1 flex-col gap-2">
        {sidebarLinks.map((item) => {
          const isActive =
            pathname === item.route || (item.route !== '/' && pathname.startsWith(`${item.route}/`));

          return (
            <Link
              href={item.route}
              key={item.label}
              className={cn(
                'group flex gap-4 items-center p-4 rounded-xl justify-start transition-all duration-300 hover-glow',
                {
                  'bg-dark-3/50 border-l-[3px] border-accent-blue text-white':
                    isActive,
                  'border-l-[3px] border-transparent text-text-secondary hover:bg-dark-3/30 hover:text-white':
                    !isActive,
                },
              )}
            >
              <Image
                src={item.imgURL}
                alt={item.label}
                width={24}
                height={24}
                className={cn('transition-opacity duration-300', {
                  'opacity-100': isActive,
                  'opacity-60 group-hover:opacity-100': !isActive,
                })}
              />
              <p className="text-lg font-semibold max-lg:hidden">
                {item.label}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default Sidebar;
