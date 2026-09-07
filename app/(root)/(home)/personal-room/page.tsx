'use client';

import { useUser } from '@clerk/nextjs';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useRouter } from 'next/navigation';

import { useGetCallById } from '@/hooks/useGetCallById';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ensureMeetingRecord } from '@/actions/meetings.actions';
import { User, Copy, Play, Link as LinkIcon, Hash, Tag } from 'lucide-react';
import { useState } from 'react';

const Table = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-dark-2/60 border border-dark-3/50 transition-colors hover:border-dark-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-dark-3/60 text-blue-400">
          {icon}
        </div>
        <span className="text-sm font-semibold text-sky-200/80">{title}</span>
      </div>
      <span className="font-mono text-sm font-bold text-white truncate max-w-md">
        {description}
      </span>
    </div>
  );
};

const PersonalRoom = () => {
  const router = useRouter();
  const { user } = useUser();
  const client = useStreamVideoClient();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const meetingId = user?.id;
  const { call } = useGetCallById(meetingId!);

  const startRoom = async () => {
    if (!client || !user) return;

    const newCall = client.call('default', meetingId!);
    const startsAt = new Date().toISOString();
    if (!call) {
      await newCall.getOrCreate({
        data: {
          starts_at: startsAt,
        },
      });
    }

    await ensureMeetingRecord({
      streamCallId: newCall.id,
      title: `${user.username || user.firstName || 'Personal'}'s Meeting Room`,
      startsAt,
    });
    router.push(`/meeting/${meetingId}?personal=true`);
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL || '');
  const meetingLink = `${baseUrl}/meeting/${meetingId}?personal=true`;
  const userName = user?.username || user?.firstName || (user?.emailAddresses?.[0]?.emailAddress ? user.emailAddresses[0].emailAddress.split('@')[0] : 'Personal');

  const handleCopy = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    toast({
      title: 'Invitation link copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="flex size-full flex-col gap-8 text-white">
      <div className="flex flex-col gap-2 border-b border-dark-3/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-950/50">
            <User size={20} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Personal Meeting Room
          </h1>
        </div>
        <p className="text-sm font-normal text-sky-200/70 max-w-2xl">
          Your fixed instant meeting space. Share your personal room link to let participants connect anytime.
        </p>
      </div>

      <div className="flex w-full flex-col gap-4 max-w-3xl rounded-2xl bg-dark-1/80 border border-dark-3/60 p-6 shadow-xl">
        <Table
          title="Meeting Topic"
          description={`${userName}'s Personal Room`}
          icon={<Tag size={16} />}
        />
        <Table
          title="Meeting ID"
          description={meetingId || 'Loading...'}
          icon={<Hash size={16} />}
        />
        <Table
          title="Invite Link"
          description={meetingLink}
          icon={<LinkIcon size={16} />}
        />

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-dark-3/40">
          <Button
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-blue-1 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-600 active:scale-95 transition-all"
            onClick={startRoom}
          >
            <Play size={16} className="fill-white" />
            <span>Start Meeting Now</span>
          </Button>

          <Button
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-dark-3/80 px-6 py-3 font-medium text-sky-200 hover:bg-dark-3 hover:text-white border border-dark-3/60 active:scale-95 transition-all"
            onClick={handleCopy}
          >
            <Copy size={16} />
            <span>{copied ? 'Link Copied!' : 'Copy Invitation Link'}</span>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PersonalRoom;
