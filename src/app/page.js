'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Default admin landing — Search QA */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/search-governance');
  }, [router]);

  return null;
}
