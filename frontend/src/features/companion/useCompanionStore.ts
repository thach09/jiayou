import { useState, useEffect, useCallback, useRef } from 'react';
import type { PetId, PetMood, GrowthStage } from './types';
import { getGrowthStage } from './petData';
import { useAuth } from '../../app/useAuth';
import { apiRequest } from '../../lib/api/client';
import { useRequestScope } from '../../lib/hooks/useRequestScope';
const STORAGE_PET_KEY = 'heyganba_companion_pet_id';
const VALID_PETS: PetId[] = [
  'panda',
  'red_panda',
  'golden_monkey',
  'imperial_cat',
];
export function useCompanion() {
  const { user } = useAuth();
  const owner = user?.userId;
  const { run } = useRequestScope(owner);
  const [selectedPetId, setSelectedPetId] = useState<PetId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PET_KEY);
      return saved && VALID_PETS.includes(saved as PetId)
        ? (saved as PetId)
        : 'panda';
    } catch {
      return 'panda';
    }
  });
  const [wallet, setWallet] = useState<{
    owner: number | null;
    bamboo: number;
    affectionExp: number;
  }>({ owner: null, bamboo: 0, affectionExp: 0 });
  const [walletError, setWalletError] = useState(''),
    [mood, setMood] = useState<PetMood>('idle');
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>()),
    feedBusy = useRef(false);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    },
    [],
  );
  const react = useCallback((next: PetMood, duration = 2200) => {
    setMood(next);
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setMood('idle');
    }, duration);
    timers.current.add(timer);
  }, []);
  const walletReady = owner !== undefined && wallet.owner === owner;
  const bambooCount = walletReady ? wallet.bamboo : 0,
    affectionExp = walletReady ? wallet.affectionExp : 0;
  const refreshWallet = useCallback(async () => {
    if (owner === undefined) return;
    const res = await run('companion-wallet', (signal) =>
      apiRequest<{ bamboo: number; affectionExp: number }>(
        '/progress/companion/wallet',
        { signal },
      ),
    );
    if (!res) return;
    if (res.success && res.data) {
      setWallet({ owner, ...res.data });
      setWalletError('');
    } else setWalletError('Chưa tải được tiến độ linh vật.');
  }, [owner, run]);
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- synchronize the server-owned wallet, not derived local state.
    void refreshWallet();
    const change = () => void refreshWallet();
    window.addEventListener('companion-wallet-changed', change);
    return () => window.removeEventListener('companion-wallet-changed', change);
  }, [refreshWallet]);
  const affectionLevel = Math.floor(affectionExp / 100) + 1,
    currentLevelProgress = affectionExp % 100;
  const growthStage: GrowthStage = getGrowthStage(affectionLevel);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PET_KEY, selectedPetId);
    } catch {
      /* Optional cosmetic choice. */
    }
  }, [selectedPetId]);
  const selectPet = useCallback(
    (id: PetId) => {
      if (!VALID_PETS.includes(id)) return;
      setSelectedPetId(id);
      react('happy');
    },
    [react],
  );
  const feedBamboo = useCallback(async () => {
    if (owner === undefined || bambooCount < 1 || feedBusy.current)
      return false;
    feedBusy.current = true;
    try {
      const res = await run('companion-feed', (signal) =>
        apiRequest<{ bamboo: number; affectionExp: number }>(
          '/progress/companion/feed',
          { method: 'POST', signal },
        ),
      );
      if (!res?.success || !res.data) return false;
      setWallet({ owner, ...res.data });
      window.dispatchEvent(new Event('companion-wallet-changed'));
      react('eating', 2400);
      return true;
    } finally {
      feedBusy.current = false;
    }
  }, [owner, bambooCount, run, react]);
  const rewardBamboo = useCallback(
    (_amount = 2) => {
      void refreshWallet();
      react('happy');
    },
    [refreshWallet, react],
  );
  const triggerReaction = useCallback(
    (type: 'correct' | 'mistake' | 'practicing' | 'cheer' | 'happy') =>
      react(
        type === 'mistake'
          ? 'sad'
          : type === 'practicing'
            ? 'studying'
            : 'happy',
      ),
    [react],
  );
  return {
    selectedPetId,
    bambooCount,
    affectionExp,
    affectionLevel,
    growthStage,
    currentLevelProgress,
    mood,
    setMood,
    selectPet,
    feedBamboo,
    rewardBamboo,
    rewardFood: rewardBamboo,
    triggerReaction,
    walletReady,
    walletError,
    refreshWallet,
  };
}
