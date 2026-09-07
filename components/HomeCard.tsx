'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface HomeCardProps {
  className?: string;
  img: string;
  title: string;
  description: string;
  handleClick?: () => void;
}

const HomeCard = ({
  className,
  img,
  title,
  description,
  handleClick,
}: HomeCardProps) => {
  return (
    <section
      className={cn(
        'group relative flex min-h-[240px] w-full flex-col justify-between overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-lg hover:shadow-2xl',
        'bg-gradient-to-br from-orange-500/90 to-amber-600/90 text-white border border-amber-400/20',
        className,
      )}
      onClick={handleClick}
    >
      {/* Background Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />

      <div className="flex items-center justify-center size-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 shadow-md transition-transform duration-300 group-hover:scale-110">
        <Image src={img} alt="meeting" width={26} height={26} className="brightness-200" />
      </div>

      <div className="flex flex-col gap-1.5 pt-4">
        <h1 className="text-2xl font-bold tracking-tight text-white group-hover:translate-x-0.5 transition-transform">{title}</h1>
        <p className="text-sm font-medium text-white/80 leading-snug">{description}</p>
      </div>
    </section>
  );
};

export default HomeCard;
