'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';

import { tokenProvider } from '@/actions/stream.actions';
import Loader from '@/components/Loader';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (!user) return;

    if (!API_KEY) {
      setError('Stream API key is missing. Please configure NEXT_PUBLIC_STREAM_API_KEY in your environment variables.');
      return;
    }

    try {
      const client = new StreamVideoClient({
        apiKey: API_KEY,
        user: {
          id: user.id,
          name: user.username || user.fullName || user.firstName || user.id,
          image: user.imageUrl,
        },
        tokenProvider,
      });

      setVideoClient(client);
    } catch (err) {
      console.error('Failed to initialize StreamVideoClient:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize video client');
    }
  }, [user, isLoaded, isSignedIn, router]);

  if (!videoClient) {
    if (error) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
          <p>{error}</p>
        </div>
      );
    }
    return <Loader />;
  }

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
