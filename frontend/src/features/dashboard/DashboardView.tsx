import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  Check,
  CheckCheck,
  ChevronRight,
  Circle,
  Layers,
  Target,
  CalendarCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/useAuth';
import { useRequestScope } from '../../lib/hooks/useRequestScope';
import { apiRequest } from '../../lib/api/client';
import { getMyProfile } from '../account/api';
import type { UserProfileResponse } from '../../lib/api/types';
import { CompanionWidget } from '../companion/CompanionWidget';
import { WeeklyStreak } from './WeeklyStreak';
const ActivityDetails = lazy(() =>
  import('./LearningActivityDetails').then((m) => ({
    default: m.LearningActivityDetails,
  })),
);

interface Level {
  level: number;
  learnedWords: number;
  totalWords: number;
  practicedGrammar: number;
  totalGrammar: number;
}
interface Quest {
  code: string;
  title: string;
  description: string;
  route: string;
  progress: number;
  target: number;
  exp: number;
  bamboo: number;
  claimed: boolean;
}
interface Insights {
  levels: Level[];
  quests: Quest[];
  wallet: { bamboo: number; affectionExp: number };
}
const percent = (done: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((done / total) * 100)) : null;
const isInsights = (data: Insights | null | undefined): data is Insights =>
  Boolean(data && Array.isArray(data.levels) && Array.isArray(data.quests));
const total = (levels: Level[]) =>
  levels.reduce(
    (a, l) => ({
      learned: a.learned + l.learnedWords,
      words: a.words + l.totalWords,
      practiced: a.practiced + l.practicedGrammar,
      grammar: a.grammar + l.totalGrammar,
    }),
    { learned: 0, words: 0, practiced: 0, grammar: 0 },
  );

export function DashboardView() {
  const { user } = useAuth();
  return <DashboardSession key={user?.userId ?? 'guest'} />;
}
function DashboardSession() {
  const [activityOpen, setActivityOpen] = useState(false);
  const { user, requireLogin } = useAuth();
  const owner = user?.userId;
  const { run, isActive } = useRequestScope(owner);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null),
    [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState(''),
    [profileError, setProfileError] = useState(''),
    [claiming, setClaiming] = useState(false),
    [claimNotice, setClaimNotice] = useState('');
  const [target, setTarget] = useState(() => {
    try {
      const n = Number(localStorage.getItem('heyganba_target_hsk'));
      return n >= 1 && n <= 6 && Number.isInteger(n) ? n : 1;
    } catch {
      return 1;
    }
  });
  const load = useCallback(async () => {
    if (owner === undefined) return;
    const result = await run('dashboard-insights', (signal) =>
      apiRequest<Insights>('/progress/insights', { signal }),
    );
    if (!result) return;
    if (result.success && isInsights(result.data)) {
      setData(result.data);
      setError('');
    } else setError(result.message || 'Chưa tải được tiến độ.');
  }, [owner, run]);
  const loadProfile = useCallback(async () => {
    if (owner === undefined) return;
    const result = await run('dashboard-profile', (signal) =>
      getMyProfile(signal),
    );
    if (!result) return;
    if (
      result.success &&
      result.data?.id === owner &&
      typeof result.data.fullName === 'string'
    ) {
      setProfile(result.data);
      setProfileError('');
    } else {
      setProfile(null);
      setProfileError('Chưa tải được tên tài khoản.');
    }
  }, [owner, run]);
  useEffect(() => {
    if (owner === undefined) return;
    // oxlint-disable-next-line react/set-state-in-effect -- fetch authenticated server metrics/profile on mount.
    void load();
    void loadProfile();
  }, [owner, load, loadProfile]);
  const select = (level: number) => {
    setTarget(level);
    try {
      localStorage.setItem('heyganba_target_hsk', String(level));
    } catch {
      /* Cosmetic target preference only. */
    }
  };
  const claim = async (code: string) => {
    if (claiming) return;
    setClaiming(true);
    setClaimNotice('');
    try {
      const result = await run('dashboard-claim', (signal) =>
        apiRequest<Insights>(
          `/progress/quests/${encodeURIComponent(code)}/claim`,
          { method: 'POST', signal },
        ),
      );
      if (!result || !isActive()) return;
      if (result.success && isInsights(result.data)) {
        setData(result.data);
        setClaimNotice('Đã nhận thưởng.');
        window.dispatchEvent(new Event('companion-wallet-changed'));
      } else
        setClaimNotice(
          result.message || 'Chưa nhận được thưởng. Vui lòng thử lại.',
        );
    } finally {
      if (isActive()) setClaiming(false);
    }
  };
  const levels = data?.levels ?? [],
    selected = levels.find((l) => l.level === target);
  const selectedPercent = selected
    ? percent(
        selected.learnedWords + selected.practicedGrammar,
        selected.totalWords + selected.totalGrammar,
      )
    : null;
  const totals = total(levels),
    overall = percent(
      totals.learned + totals.practiced,
      totals.words + totals.grammar,
    );
  const state = !user ? (
    <p className="dashboard-subtle mt-5">
      Đăng nhập để xem tiến độ của riêng bạn.
    </p>
  ) : error ? (
    <p role="status" className="dashboard-subtle mt-5">
      {error}{' '}
      <button className="underline" onClick={() => void load()}>
        Thử lại
      </button>
    </p>
  ) : !data ? (
    <p role="status" className="dashboard-subtle mt-5">
      Đang tải dữ liệu học tập…
    </p>
  ) : null;
  const tabs = (
    <div
      className="dashboard-hsk-tabs"
      role="group"
      aria-label="Chọn mục tiêu HSK"
    >
      {[1, 2, 3, 4, 5, 6].map((level) => (
        <button
          type="button"
          key={level}
          aria-pressed={target === level}
          onClick={() => select(level)}
        >
          HSK {level}
        </button>
      ))}
    </div>
  );
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-topline">
          <div className="min-w-[min(100%,300px)] flex-1">
            <h1 className="dashboard-greeting">
              {!user
                ? 'Chào mừng bạn đến với Jiayou!'
                : profile
                  ? `Chào mừng trở lại, ${profile.fullName}! 👋`
                  : 'Chào mừng trở lại! 👋'}
            </h1>
            {user && !profile && (
              <p role="status" className="dashboard-subtle">
                {profileError || 'Đang tải tên tài khoản…'}
                {profileError && (
                  <button
                    onClick={() => void loadProfile()}
                    className="ml-2 underline"
                  >
                    Thử lại
                  </button>
                )}
              </p>
            )}
          </div>
          {tabs}
        </div>
        <WeeklyStreak />
        <div className="dashboard-topline">
          <div className="dashboard-focus">
            <Target className="text-cinnabar-ink" aria-hidden="true" />
            <span>
              Đang khám phá:{' '}
              <strong className="text-cinnabar-ink">HSK {target}</strong>
            </span>
            {user && selectedPercent !== null && (
              <>
                <div
                  className="dashboard-track w-36"
                  role="progressbar"
                  aria-label={`Tiến độ nhóm chọn lọc ${target}`}
                  aria-valuenow={selectedPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: selectedPercent + '%' }} />
                </div>
                <span className="dashboard-subtle">
                  {selectedPercent}% học liệu hiện có
                </span>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="dashboard-action primary"
              to={`/vocabulary?level=HSK${target}`}
            >
              Tiếp tục học <ArrowRight size={16} />
            </Link>
            <Link className="dashboard-action" to="/vocabulary?mode=srs">
              Ôn tập đến hạn
            </Link>
          </div>
        </div>
      </header>
      <section className="dashboard-three" aria-label="Tổng quan học tập">
        <CompanionWidget />
        <section className="dashboard-card">
          <h2>
            <CalendarCheck aria-hidden="true" />
            Nhiệm vụ hôm nay
          </h2>
          <p className="dashboard-subtle mt-2">
            Từng bước nhỏ, tiến bộ mỗi ngày.
          </p>
          {state || (
            <ul className="mt-5 space-y-2">
              {data?.quests.map((q) => (
                <li
                  key={q.code}
                  className={`dashboard-quest ${q.claimed ? 'done' : ''}`}
                >
                  <span className={q.claimed ? 'text-jade-ink' : 'text-fg-60'}>
                    {q.claimed ? (
                      <CheckCheck size={20} aria-label="Đã nhận thưởng" />
                    ) : q.progress >= q.target ? (
                      <Check size={20} aria-label="Đã hoàn thành" />
                    ) : (
                      <Circle size={20} aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] leading-relaxed">
                      {q.description}
                    </p>
                    <div className="dashboard-subtle text-xs">
                      {q.progress}/{q.target}
                      {!q.claimed &&
                        (q.progress >= q.target ? (
                          <button
                            className="ml-2 underline text-jade-ink"
                            disabled={claiming}
                            onClick={() => void claim(q.code)}
                          >
                            Nhận thưởng
                          </button>
                        ) : (
                          <Link className="ml-2 underline" to={q.route}>
                            Học ngay
                          </Link>
                        ))}
                    </div>
                  </div>
                  <span className="quest-reward">+{q.exp} EXP</span>
                </li>
              ))}
            </ul>
          )}
          {claimNotice && (
            <p role="status" className="dashboard-subtle mt-3">
              {claimNotice}
            </p>
          )}
        </section>
        <section className="dashboard-card">
          <h2>
            <ChartNoAxesColumnIncreasing aria-hidden="true" />
            Tiến độ học tập
          </h2>
          {state || (
            <>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-5">
                <div
                  className="dashboard-donut"
                  style={{ '--progress': `${overall ?? 0}%` } as CSSProperties}
                  role="img"
                  aria-label={
                    overall === null
                      ? 'Chưa có học liệu đã phát hành'
                      : `${overall}% tiến độ học liệu hiện có`
                  }
                >
                  <div>
                    <strong>{overall === null ? '—' : overall + '%'}</strong>
                    <span className="dashboard-subtle">
                      {overall === null ? 'Chưa có dữ liệu' : 'Đã luyện tập'}
                    </span>
                  </div>
                </div>
                <dl className="min-w-0 space-y-4 text-[12.5px]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="text-gold-ink" size={19} />
                    <dt>Từ đã ôn nhớ</dt>
                    <dd className="ml-auto font-semibold">{totals.learned}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="text-gold-ink" size={19} />
                    <dt>Điểm ngữ pháp</dt>
                    <dd className="ml-auto font-semibold">
                      {totals.practiced}
                    </dd>
                  </div>
                </dl>
              </div>
              <p className="dashboard-subtle mt-5">
                {overall === null
                  ? 'Học liệu đang được chuẩn bị và duyệt trước khi phát hành.'
                  : 'Tiến độ trong ứng dụng, không phải chứng nhận năng lực HSK.'}
              </p>
            </>
          )}
        </section>
      </section>
      <section className="dashboard-card dashboard-roadmap">
        <div className="dashboard-topline">
          <div>
            <h2>
              <Layers aria-hidden="true" />
              Lộ trình học tiếng Trung theo cấp
            </h2>
            <p className="dashboard-subtle mt-2">
              Học liệu chọn lọc đang bổ sung, chưa bao phủ toàn bộ HSK.
            </p>
          </div>
          <Link
            className="dashboard-action"
            to={`/vocabulary?level=HSK${target}`}
          >
            Xem học liệu <ArrowRight size={17} />
          </Link>
        </div>
        <div className="dashboard-roadmap-grid">
          {[1, 2, 3, 4, 5, 6].map((level) => {
            const l = levels.find((x) => x.level === level);
            return (
              <Link
                key={level}
                to={`/vocabulary?level=HSK${level}`}
                aria-current={target === level ? 'true' : undefined}
              >
                <strong className="text-lg">HSK {level}</strong>
                <span className="dashboard-subtle">
                  {user && l
                    ? l.totalWords + l.totalGrammar > 0
                      ? `${l.totalWords} từ · ${l.totalGrammar} điểm ngữ pháp`
                      : 'Đang chuẩn bị'
                    : 'Khám phá học liệu'}{' '}
                  <ChevronRight size={13} className="inline" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      {user && (
        <details
          className="dashboard-card"
          onToggle={(e) => setActivityOpen(e.currentTarget.open)}
        >
          <summary className="cursor-pointer text-sm font-semibold">
            Xem hoạt động học chi tiết
          </summary>
          {activityOpen && (
            <Suspense
              fallback={
                <p role="status" className="dashboard-subtle mt-4">
                  Đang tải hoạt động…
                </p>
              }
            >
              <ActivityDetails />
            </Suspense>
          )}
        </details>
      )}
      {!user && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="dashboard-subtle">
            Khám phá nội dung công khai. Đăng nhập khi muốn lưu hành trình của
            bạn.
          </p>
          <button className="dashboard-action primary" onClick={requireLogin}>
            Bắt đầu với Jiayou
          </button>
        </div>
      )}
    </div>
  );
}
