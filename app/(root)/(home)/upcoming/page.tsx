import CallList from '@/components/CallList';
import { Calendar } from 'lucide-react';

const UpcomingPage = () => {
  return (
    <section className="flex size-full flex-col gap-8 text-white">
      <div className="flex flex-col gap-2 border-b border-dark-3/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-md shadow-blue-950/50">
            <Calendar size={20} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Upcoming Meetings
          </h1>
        </div>
        <p className="text-sm font-normal text-sky-200/70 max-w-2xl">
          View and manage your scheduled video conferences. Join when the call starts or copy invite links.
        </p>
      </div>

      <CallList type="upcoming" />
    </section>
  );
};

export default UpcomingPage;
