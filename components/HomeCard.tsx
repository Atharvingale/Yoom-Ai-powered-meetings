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
        'bg-orange-1 px-4 py-6 flex flex-col justify-between w-full xl:max-w-[270px] min-h-[260px] rounded-3xl cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-card hover:shadow-card-hover hover-glow',
        className,
      )}
      onClick={handleClick}
    >
      <div className="flex-center glassmorphism size-12 rounded-2xl transition-shadow duration-300 hover:shadow-glow-blue">
        <Image src={img} alt="meeting" width={27} height={27} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold leading-tight">{title}</h1>
        <p className="text-lg font-normal text-sky-1/90">{description}</p>
      </div>
    </section>
  );
};

export default HomeCard;
