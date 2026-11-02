import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ChevronsRight, Leaf, RefreshCw, Sprout } from 'lucide-react';
import { useCompanion } from './useCompanionStore';
import { useAuth } from '../../app/useAuth';
import { Modal } from '../../components/Modal';
import type { PetId } from './types';
export { FoodIcon, CompanionSkeletonFallback } from './CompanionVisuals';

const Canvas = lazy(() =>
  import('./three/Companion3DCanvas').then((m) => ({
    default: m.Companion3DCanvas,
  })),
);

const pets: Record<PetId, string> = {
  panda: 'Gấu trúc',
  red_panda: 'Cáo',
  golden_monkey: 'Khỉ vàng',
  imperial_cat: 'Mèo',
};

export function CompanionWidget() {
  const { user, requireLogin } = useAuth();
  const {
    selectedPetId,
    bambooCount,
    affectionExp,
    growthStage,
    mood,
    selectPet,
    feedBamboo,
    triggerReaction,
    walletReady,
    walletError,
    refreshWallet,
  } = useCompanion();
  const [choose, setChoose] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(''),
    [evolving, setEvolving] = useState(false);
  const previous = useRef(growthStage);

  useEffect(() => {
    if (previous.current === growthStage) return;
    previous.current = growthStage;
    setEvolving(true);
    const timer = setTimeout(() => setEvolving(false), 1200);
    return () => clearTimeout(timer);
  }, [growthStage]);

  const adult = growthStage === 'adult';
  const cheer = useCallback(() => triggerReaction('cheer'), [triggerReaction]);

  const feed = async () => {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try {
      setNotice(
        (await feedBamboo())
          ? 'Linh vật đã nhận thức ăn.'
          : 'Chưa cho ăn được. Vui lòng kiểm tra kết nối rồi thử lại.',
      );
    } finally {
      setBusy(false);
    }
  };

  const expTarget = 900;
  const currentExp = Math.min(affectionExp, expTarget);
  const expPercent = Math.min(100, Math.round((currentExp / expTarget) * 100));

  return (
    <section
      className={`dashboard-card dashboard-companion ${evolving ? 'evolving' : ''}`}
      aria-label="Linh vật đồng hành"
    >
      {/* Visual Mascot Presentation with Glowing Ground Ring */}
      <div className="pet-visual">
        <Suspense
          fallback={
            <div
              className="flex h-[180px] w-[160px] items-center justify-center text-6xl animate-pulse"
              role="status"
              aria-label="Đang tải linh vật"
            >
              🐼
            </div>
          }
        >
          <Canvas
            petId={selectedPetId}
            stage={growthStage}
            mood={mood}
            size={180}
            showSpeechBubble={false}
            onPetClick={cheer}
          />
        </Suspense>

        {/* Ambient Warm Sparks & Halo */}
        <div className="companion-ground-halo" aria-hidden="true" />
      </div>

      {/* Information & Evolution Progress */}
      <div className="min-w-0 flex flex-col justify-between py-1 space-y-3.5">
        <div>
          <p className="text-[13px] text-[#B9B0AA] font-normal tracking-wide">
            Đồng hành cùng bạn
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <h2 className="pet-stage">
              <Sprout size={18} className="text-[#91E4C0]" aria-hidden="true" />
              <span>{adult ? 'Đại Hiệp' : 'Ấu Thú'}</span>
            </h2>
          </div>
        </div>

        {!user ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#F5F0E9] font-medium">EXP: 0 / 100</span>
            </div>
            <div
              className="dashboard-track h-2 bg-[#2E2C28] rounded-full overflow-hidden"
              role="progressbar"
              aria-label="Tiến độ tiến hóa"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={0}
            >
              <span
                style={{ width: '0%', background: 'var(--paper-jade)' }}
                className="h-full rounded-full transition-all duration-300"
              />
            </div>
            <p className="pet-next text-xs flex items-center gap-1 text-[#E9BC78]">
              <ChevronsRight size={14} className="text-[#E9BC78] shrink-0" aria-hidden="true" />
              <span>Tiến hóa tiếp theo: <strong className="text-[#F5F0E9]">Đại Hiệp</strong></span>
            </p>
          </div>
        ) : !walletReady ? (
          <p role="status" className="dashboard-subtle text-xs">
            {walletError || 'Đang tải tiến độ linh vật…'}
            {walletError && (
              <button
                className="ml-2 underline text-[#FF8C74]"
                onClick={() => void refreshWallet()}
              >
                Thử lại
              </button>
            )}
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#F5F0E9] font-medium">
                EXP: <strong className="font-semibold">{currentExp}</strong> / {expTarget}
              </span>
            </div>
            <div
              className="dashboard-track h-2 bg-[#2E2C28] rounded-full overflow-hidden"
              role="progressbar"
              aria-label="Tiến độ tiến hóa"
              aria-valuemin={0}
              aria-valuemax={expTarget}
              aria-valuenow={currentExp}
            >
              <span
                style={{
                  width: `${expPercent}%`,
                  background: 'linear-gradient(90deg, #7DDAB0, #91E4C0)',
                }}
                className="h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(125,218,176,0.4)]"
              />
            </div>
            <p className="pet-next text-xs flex items-center gap-1 text-[#E9BC78]">
              <ChevronsRight size={14} className="text-[#E9BC78] shrink-0" aria-hidden="true" />
              <span>
                {adult ? (
                  'Đã hoàn tất tiến hóa'
                ) : (
                  <>Tiến hóa tiếp theo: <strong className="text-[#F5F0E9]">Đại Hiệp</strong></>
                )}
              </span>
            </p>
          </div>
        )}

        {/* Small Meaningful Actions */}
        <div className="flex items-center gap-2 pt-1">
          {user ? (
            <button
              id="btn-feed-companion"
              className="dashboard-action primary text-xs !min-h-[38px] !py-1.5 !px-3 font-semibold rounded-lg flex items-center gap-1.5"
              disabled={busy || !walletReady || bambooCount < 1}
              onClick={() => void feed()}
            >
              <Leaf size={14} aria-hidden="true" />
              {busy
                ? 'Đang cho ăn…'
                : `Cho ăn (${walletReady ? bambooCount : '—'})`}
            </button>
          ) : (
            <button
              className="dashboard-action primary text-xs !min-h-[38px] !py-1.5 !px-3.5 font-semibold rounded-lg"
              onClick={requireLogin}
            >
              Bắt đầu đồng hành
            </button>
          )}
          <button
            className="dashboard-action !p-2 !min-h-[38px] rounded-lg text-[#B9B0AA] hover:text-[#F5F0E9]"
            aria-label="Đổi linh vật"
            title="Đổi linh vật"
            onClick={() => setChoose(true)}
          >
            <RefreshCw size={14} aria-hidden="true" />
          </button>
        </div>

        {notice && (
          <p role="status" className="dashboard-subtle text-xs text-[#91E4C0]">
            {notice}
          </p>
        )}
      </div>

      {choose && (
        <Modal title="Chọn linh vật" onClose={() => setChoose(false)}>
          <h2 className="text-xl font-semibold text-[#F5F0E9]">Chọn linh vật</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {(Object.keys(pets) as PetId[]).map((id) => (
              <button
                key={id}
                className="dashboard-action text-sm font-medium"
                aria-pressed={selectedPetId === id}
                onClick={() => {
                  selectPet(id);
                  setChoose(false);
                }}
              >
                {pets[id]}
                {selectedPetId === id ? ' ✓' : ''}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </section>
  );
}
