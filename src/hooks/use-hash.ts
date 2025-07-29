'use client';

import { useEffect, useState } from 'react';

export function useHash(): [string, (hash: string) => void] {
  const [hash, setHashState] = useState('');

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      setHashState(window.location.hash.slice(1)); // Remove the # symbol
    }
  }, []);

  const setHash = (newHash: string) => {
    if (typeof window !== 'undefined') {
      window.location.hash = newHash;
      setHashState(newHash);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashChange = () => {
      setHashState(window.location.hash.slice(1));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return [hash, setHash];
}
