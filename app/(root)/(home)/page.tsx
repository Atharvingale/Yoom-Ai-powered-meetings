'use client';

import { useEffect, useState } from 'react';
import MeetingTypeList from '@/components/MeetingTypeList';
import { useGetCalls } from '@/hooks/useGetCalls';
import { Clock, Calendar as CalendarIcon, Sparkles } from 'lucide-react';

const getGreeting = (hour: number) => {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const Home = () => {
  const [now, setNow] = useState<Date | null>(null);
  const { upcomingCalls } = useGetCalls();

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentDate = now || new Date();
  const hour = currentDate.getHours();

  const time = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(
    currentDate,
  );

  const nextCall = upcomingCalls && upcomingCalls.length > 0 ? upcomingCalls[0] : null;
  const nextCallTime = nextCall?.state?.startsAt
    ? new Date(nextCall.state.startsAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <section className="flex size-full flex-col gap-8 text-white">
      {/* Hero Banner with Dynamic Gradient and Clock */}
      <div className="relative h-[290px] w-full overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/80 via-purple-900/60 to-dark-1 border border-dark-3/60 p-8 shadow-2xl lg:p-10 flex flex-col justify-between">
        {/* Decorative Grid Mesh & Glow */}
        <div className="absolute -right-20 -top-20 size-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 size-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-dark-1/80 px-4 py-1.5 text-xs font-semibold text-sky-200 border border-dark-3/60 backdrop-blur-md">
            <Sparkles size={14} className="text-purple-400 animate-pulse" />
            <span>
              {nextCallTime
                ? `Upcoming Meeting at: ${nextCallTime}`
                : 'No Upcoming Meetings'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-sky-200/70 bg-dark-1/60 px-3.5 py-1.5 rounded-xl border border-dark-3/40">
            <Clock size={14} className="text-blue-400" />
            <span>Live Workspace Clock</span>
          </div>
        </div>

        <div className="relative flex flex-col gap-1 pt-4">
          <p className="text-base font-semibold text-blue-400 tracking-wide">
            {getGreeting(hour)} 👋
          </p>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            {time}
          </h1>
          <div className="flex items-center gap-2 text-sm font-medium text-sky-200/80 pt-1">
            <CalendarIcon size={16} className="text-purple-400" />
            <span>{date}</span>
          </div>
        </div>
      </div>

      {/* Main Action Grid */}
      <MeetingTypeList />
    </section>
  );
};

export default Home;
