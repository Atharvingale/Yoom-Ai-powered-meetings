import CallList from '@/components/CallList';
import { History } from 'lucide-react';

const PreviousPage = () => {
  return (
    <section className="flex size-full flex-col gap-8 text-white">
      <div className="flex flex-col gap-2 border-b border-dark-3/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-md shadow-purple-950/50">
            <History size={20} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Previous Meetings
          </h1>
        </div>
        <p className="text-sm font-normal text-sky-200/70 max-w-2xl">
          Review your past meeting history, view generated summaries, and track completed discussions.
        </p>
      </div>

      <CallList type="ended" />
    </section>
  );
};

export default PreviousPage;
