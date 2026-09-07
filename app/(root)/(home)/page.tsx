'use client';

import { useEffect, useState } from 'react';
import MeetingTypeList from '@/components/MeetingTypeList';
import { useGetCalls } from '@/hooks/useGetCalls';

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
    <section className="flex size-full flex-col gap-6 text-white">
      <div className="h-[303px] w-full rounded-3xl bg-hero bg-cover shadow-card overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-dark-1/60 to-transparent pointer-events-none" />
        <div className="relative flex h-full flex-col justify-between max-md:px-5 max-md:py-8 lg:p-11">
          <h2 className="glassmorphism-v2 max-w-[283px] rounded-xl px-4 py-2 text-center text-sm font-medium animate-fade-in">
            {nextCallTime
              ? `Upcoming Meeting at: ${nextCallTime}`
              : 'No Upcoming Meetings'}
          </h2>
          <div className="flex flex-col gap-2 animate-slide-up">
            <p className="text-lg font-medium text-sky-1 lg:text-xl animate-fade-in">
              {getGreeting(hour)}
            </p>
            <h1 className="text-4xl font-extrabold lg:text-7xl">{time}</h1>
            <p className="text-lg font-medium text-sky-1 lg:text-2xl">{date}</p>
          </div>
        </div>
      </div>

      <MeetingTypeList />
    </section>
  );
};

export default Home;
