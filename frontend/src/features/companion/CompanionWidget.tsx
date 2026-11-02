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
  red_panda: 'Gấu trúc đỏ',
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
  return (
    <section
      className={`dashboard-card dashboard-companion ${evolving ? 'evolving' : ''}`}
      aria-label="Linh vật đồng hành"
    >
      <div className="pet-visual">
        <Suspense
          fallback={
            <div
              className="flex h-[170px] w-[150px] items-center justify-center text-5xl"
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
            size={170}
            showSpeechBubble={false}
            onPetClick={cheer}
          />
        </Suspense>
      </div>
      <div className="min-w-0 space-y-4">
        <p className="dashboard-subtle">Đồng hành cùng bạn</p>
        <h2 className="pet-stage">
          <Sprout size={22} aria-hidden="true" />
          {adult ? 'Đại Hiệp' : 'Ấu Thú'}
        </h2>
        {!user ? (
          <p className="dashboard-subtle">
            Đăng nhập để lưu quá trình trưởng thành.
          </p>
        ) : !walletReady ? (
          <p role="status" className="dashboard-subtle">
            {walletError || 'Đang tải tiến độ linh vật…'}
            {walletError && (
              <button
                className="ml-2 underline"
                onClick={() => void refreshWallet()}
              >
                Thử lại
              </button>
            )}
          </p>
        ) : (
          <>
            <div>
              <p className="mb-2 text-[13px]">
                EXP thân thiết: <strong>{affectionExp}</strong>
              </p>
              <div
                className="dashboard-track"
                role="progressbar"
                aria-label="Tiến độ tiến hóa"
                aria-valuemin={0}
                aria-valuemax={900}
                aria-valuenow={Math.min(affectionExp, 900)}
              >
                <span
                  style={{
                    width: Math.min(100, (affectionExp / 900) * 100) + '%',
                    background: 'var(--paper-jade)',
                  }}
                />
              </div>
            </div>
            <p className="pet-next">
              <ChevronsRight size={16} aria-hidden="true" />
              {adult
                ? 'Đã hoàn tất tiến hóa'
                : `Tiến hóa cuối: Đại Hiệp · ${Math.min(affectionExp, 900)}/900 EXP`}
            </p>
          </>
        )}
        <div className="flex flex-wrap gap-2">
          {user ? (
            <button
              id="btn-feed-companion"
              className="dashboard-action text-xs"
              disabled={busy || !walletReady || bambooCount < 1}
              onClick={() => void feed()}
            >
              <Leaf size={15} aria-hidden="true" />
              {busy
                ? 'Đang cho ăn…'
                : `Cho ăn (${walletReady ? bambooCount : '—'})`}
            </button>
          ) : (
            <button className="dashboard-action text-xs" onClick={requireLogin}>
              Bắt đầu đồng hành
            </button>
          )}
          <button
            className="dashboard-action p-2"
            aria-label="Đổi linh vật"
            title="Đổi linh vật"
            onClick={() => setChoose(true)}
          >
            <RefreshCw size={15} aria-hidden="true" />
          </button>
        </div>
        {notice && (
          <p role="status" className="dashboard-subtle">
            {notice}
          </p>
        )}
      </div>
      {choose && (
        <Modal title="Chọn linh vật" onClose={() => setChoose(false)}>
          <h2 className="text-xl font-semibold">Chọn linh vật</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {(Object.keys(pets) as PetId[]).map((id) => (
              <button
                key={id}
                className="dashboard-action"
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
