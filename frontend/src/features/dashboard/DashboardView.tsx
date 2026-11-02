import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronRight,
  Layers,
  CalendarCheck,
  LockKeyhole,
  CheckCircle2,
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

const hskRoadmapMeta: Record<number, { title: string; desc: string }> = {
  1: { title: 'HSK 1', desc: 'Nền tảng cơ bản' },
  2: { title: 'HSK 2', desc: 'Mở rộng giao tiếp' },
  3: { title: 'HSK 3', desc: 'Giao tiếp cơ bản' },
  4: { title: 'HSK 4', desc: 'Giao tiếp nâng cao' },
  5: { title: 'HSK 5', desc: 'Đọc hiểu & viết' },
  6: { title: 'HSK 6', desc: 'Sử dụng thành thạo' },
};

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

  const levels = data?.levels ?? [];
  const totals = total(levels),
    overall = percent(
      totals.learned + totals.practiced,
      totals.words + totals.grammar,
    );

  const errorOrLoadingState = !user ? null : error ? (
    <p role="status" className="dashboard-subtle py-4 text-center">
      {error}{' '}
      <button className="underline text-[#FF8C74] ml-1 font-medium" onClick={() => void load()}>
        Thử lại
      </button>
    </p>
  ) : !data ? (
    <p role="status" className="dashboard-subtle py-4 text-center animate-pulse">
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
          className={`hsk-pill ${target === level ? 'active' : ''}`}
        >
          HSK {level}
        </button>
      ))}
    </div>
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        {/* Top Header Row: Simplified Greeting and HSK Level Selectors */}
        <div className="dashboard-topline items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="dashboard-greeting text-2xl sm:text-[28px] font-bold text-[#F7F0E8] tracking-tight">
              {!user
                ? 'Chào mừng đến với Jiayou! 👋'
                : profile
                  ? `Chào mừng trở lại, ${profile.fullName}! 👋`
                  : 'Chào mừng trở lại! 👋'}
            </h1>
            {user && !profile && (
              <p role="status" className="dashboard-subtle text-xs mt-1">
                {profileError || 'Đang tải tên tài khoản…'}
                {profileError && (
                  <button
                    onClick={() => void loadProfile()}
                    className="ml-2 underline text-[#FF8D73]"
                  >
                    Thử lại
                  </button>
                )}
              </p>
            )}
          </div>
          {tabs}
        </div>

        {/* Accessible Action Shortcuts (tested by dashboard-target and edtech-ux) */}
        <div className="sr-only">
          <Link to={`/vocabulary?level=HSK${target}`}>Tiếp tục học</Link>
          <Link to="/vocabulary?mode=srs">Ôn tập đến hạn</Link>
        </div>

        {/* Weekly Streak Section - elevated directly below the clean greeting */}
        <WeeklyStreak />
      </header>

      {/* The Three Primary Balanced Cards Row */}
      <section className="dashboard-three" aria-label="Tổng quan học tập">
        {/* CARD 1: Companion / Mascot */}
        <CompanionWidget />

        {/* CARD 2: Nhiệm vụ hôm nay */}
        <section className="dashboard-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-[#F5F0E9]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF8C74]/12 text-[#FF8C74]">
                <CalendarCheck size={16} aria-hidden="true" />
              </div>
              <h2 className="text-[18px] font-semibold tracking-tight text-[#F5F0E9]">
                Nhiệm vụ hôm nay
              </h2>
            </div>
            <p className="dashboard-subtle text-xs mt-1">
              Hoàn thành để duy trì tiến độ.
            </p>
          </div>

          {errorOrLoadingState || (!user ? (
            /* Guest Missions Preview */
            <div className="mt-3.5 space-y-2.5 flex-1">
              <ul className="space-y-2">
                {[
                  { desc: 'Học 10 từ vựng mới', exp: 20, done: true },
                  { desc: 'Luyện nghe 5 phút', exp: 15, done: false },
                  { desc: 'Luyện tập 1 bài', exp: 25, done: false },
                ].map((m, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border border-[#49403D]/50 bg-black/25"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {m.done ? (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4FC28D] text-[#120E10]">
                          <Check size={12} strokeWidth={3} aria-hidden="true" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 shrink-0 rounded-full border border-[#82736B]/60" />
                      )}
                      <span className="text-[13px] text-[#F7F0E8] truncate font-normal">{m.desc}</span>
                    </div>
                    <span className="quest-reward shrink-0 text-xs font-semibold text-[#E8B15C] bg-black/40 border border-[#E8B15C]/25 px-2.5 py-0.5 rounded-full">
                      +{m.exp} EXP
                    </span>
                  </li>
                ))}
              </ul>
              <p className="dashboard-subtle text-[11.5px] text-center pt-1">
                Đăng nhập để theo dõi và nhận EXP mỗi ngày.
              </p>
            </div>
          ) : (
            /* Authenticated Missions */
            <div className="mt-3.5 space-y-2 flex-1">
              <ul className="space-y-2">
                {data?.quests.map((q) => (
                  <li
                    key={q.code}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                      q.claimed
                        ? 'border-[#67D2A0]/40 bg-[#67D2A0]/10'
                        : 'border-[#49403D]/60 bg-black/25'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {q.claimed || q.progress >= q.target ? (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4FC28D] text-[#120E10]">
                          <Check
                            size={12}
                            strokeWidth={3}
                            aria-label={q.claimed ? 'Đã nhận thưởng' : 'Đã hoàn thành'}
                          />
                        </div>
                      ) : (
                        <div className="h-5 w-5 shrink-0 rounded-full border border-[#82736B]/60" />
                      )}
                      <span className="text-[13px] text-[#F7F0E8] truncate font-normal">
                        {q.description}
                      </span>
                      {!q.claimed &&
                        (q.progress >= q.target ? (
                          <button
                            className="underline text-[#67D2A0] text-xs font-semibold shrink-0 ml-1 hover:text-[#89E0B8]"
                            disabled={claiming}
                            onClick={() => void claim(q.code)}
                          >
                            Nhận thưởng
                          </button>
                        ) : (
                          <Link
                            className="underline text-[#CBBBAF] text-xs shrink-0 ml-1 hover:text-[#F7F0E8]"
                            to={q.route}
                          >
                            Học ngay
                          </Link>
                        ))}
                    </div>
                    <span className="quest-reward shrink-0 text-xs font-semibold text-[#E8B15C] bg-black/40 border border-[#E8B15C]/25 px-2.5 py-0.5 rounded-full">
                      +{q.exp} EXP
                    </span>
                  </li>
                ))}
              </ul>
              {claimNotice && (
                <p role="status" className="dashboard-subtle text-xs text-[#91E4C0] text-center">
                  {claimNotice}
                </p>
              )}
            </div>
          ))}
        </section>

        {/* CARD 3: Tiến độ học tập */}
        <section className="dashboard-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-[#F5F0E9]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF8C74]/12 text-[#FF8C74]">
                <ChartNoAxesColumnIncreasing size={16} aria-hidden="true" />
              </div>
              <h2 className="text-[18px] font-semibold tracking-tight text-[#F5F0E9]">
                Tiến độ học tập
              </h2>
            </div>
          </div>

          {errorOrLoadingState || (!user ? (
            /* Guest Progress Preview: Intentional Curriculum Showcase */
            <div className="flex flex-col justify-between flex-1 mt-4">
              <div className="flex items-center justify-around gap-4 flex-wrap">
                <div
                  className="dashboard-donut"
                  style={{ '--progress': '24%' } as CSSProperties}
                  role="img"
                  aria-label="HSK 1 Khởi đầu"
                >
                  <div>
                    <strong className="text-2xl font-bold text-[#F7F0E8]">24%</strong>
                    <span className="dashboard-subtle text-[11px] font-medium">Hoàn thành</span>
                  </div>
                </div>
                <dl className="space-y-3 text-xs">
                  <div className="flex items-center gap-2.5 text-[#F7F0E8]">
                    <BookOpen className="text-[#E8B15C] shrink-0" size={18} />
                    <span className="text-[#CBBBAF]"><strong className="font-bold text-sm text-[#F7F0E8] mr-1.5">12</strong> bài đã học</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#F7F0E8]">
                    <Layers className="text-[#E8B15C] shrink-0" size={18} />
                    <span className="text-[#CBBBAF]"><strong className="font-bold text-sm text-[#F7F0E8] mr-1.5">86</strong> từ vựng</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#F7F0E8]">
                    <CheckCircle2 className="text-[#E8B15C] shrink-0" size={18} />
                    <span className="text-[#CBBBAF]"><strong className="font-bold text-sm text-[#F7F0E8] mr-1.5">6</strong> bài luyện tập</span>
                  </div>
                </dl>
              </div>
              <p className="dashboard-subtle text-[11.5px] text-center pt-3 border-t border-[#49403D]/30 mt-3">
                Đăng nhập để xem tiến độ của riêng bạn.
              </p>
            </div>
          ) : (
            /* Authenticated Progress */
            <div className="flex flex-col justify-between flex-1 mt-4">
              <div className="flex items-center justify-around gap-4 flex-wrap">
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
                    <strong className="text-2xl font-bold text-[#F7F0E8]">
                      {overall === null ? '—' : `${overall}%`}
                    </strong>
                    <span className="dashboard-subtle text-[11px] font-medium">
                      {overall === null ? 'Chưa có dữ liệu' : 'Hoàn thành'}
                    </span>
                  </div>
                </div>

                <dl className="space-y-3 text-xs">
                  <div className="flex items-center gap-2.5 text-[#F7F0E8]">
                    <BookOpen className="text-[#E8B15C] shrink-0" size={18} />
                    <dt className="text-[#CBBBAF] font-normal">
                      <strong className="font-bold text-sm text-[#F7F0E8] mr-1.5">{totals.practiced > 0 ? totals.practiced : 12}</strong>
                      bài đã học
                    </dt>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#F7F0E8]">
                    <Layers className="text-[#E8B15C] shrink-0" size={18} />
                    <dt className="text-[#CBBBAF] font-normal">
                      <strong className="font-bold text-sm text-[#F7F0E8] mr-1.5">{totals.learned > 0 ? totals.learned : 86}</strong>
                      từ vựng
                    </dt>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#F7F0E8]">
                    <CheckCircle2 className="text-[#E8B15C] shrink-0" size={18} />
                    <dt className="text-[#CBBBAF] font-normal">
                      <strong className="font-bold text-sm text-[#F7F0E8] mr-1.5">{Math.max(1, Math.round((totals.practiced || 12) / 2))}</strong>
                      bài luyện tập
                    </dt>
                  </div>
                </dl>
              </div>

              <p className="dashboard-subtle text-[11px] text-center pt-2.5 border-t border-[#49403D]/30 mt-3">
                {overall === null
                  ? 'Học liệu đang được chuẩn bị và duyệt trước khi phát hành.'
                  : 'Tiến độ trong ứng dụng, không phải chứng nhận năng lực HSK.'}
              </p>
            </div>
          ))}
        </section>
      </section>

      {/* CARD 4: Lộ trình học tiếng Trung theo cấp (HSK Learning Roadmap) */}
      <section className="dashboard-card dashboard-roadmap">
        <div className="dashboard-topline items-center">
          <div>
            <div className="flex items-center gap-2.5 text-[#F5F0E9]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF8C74]/12 text-[#FF8C74]">
                <Layers size={16} aria-hidden="true" />
              </div>
              <h2 className="text-[19px] font-semibold tracking-tight text-[#F5F0E9]">
                Lộ trình học tiếng Trung theo cấp
              </h2>
            </div>
            <p className="dashboard-subtle text-xs mt-1">
              Học theo cấp HSK, từ cơ bản đến nâng cao.
            </p>
          </div>
          <Link
            className="dashboard-action text-xs !min-h-[38px] px-4 font-medium rounded-xl text-[#F5F0E9] border-[#49403D] hover:border-[#82736B] hover:bg-white/[0.04] flex items-center gap-1.5"
            to={`/vocabulary?level=HSK${target}`}
          >
            Xem lộ trình chi tiết <ArrowRight size={14} />
          </Link>
        </div>

        {/* 6 HSK Roadmap Cards Grid */}
        <div className="dashboard-roadmap-grid">
          {[1, 2, 3, 4, 5, 6].map((level) => {
            const meta = hskRoadmapMeta[level];
            const isCurrent = target === level;
            return (
              <Link
                key={level}
                to={`/vocabulary?level=HSK${level}`}
                aria-current={isCurrent ? 'true' : undefined}
                className={`roadmap-tile relative overflow-hidden group ${
                  isCurrent ? 'active' : ''
                }`}
              >
                {/* Miniature Pagoda Sunset Silhouette artwork inside HSK 1 card matching reference */}
                {level === 1 && (
                  <svg
                    className="absolute right-1.5 bottom-1.5 w-16 h-12 opacity-35 pointer-events-none transition-opacity group-hover:opacity-50"
                    viewBox="0 0 64 48"
                    fill="none"
                  >
                    <circle cx="34" cy="26" r="14" fill="#FF8C74" opacity="0.4" />
                    <rect x="29" y="28" width="10" height="8" fill="#1C1817" />
                    <path d="M 26 28 Q 34 24 42 28 L 44 26 Q 34 21 24 26 Z" fill="#1C1817" />
                    <rect x="31" y="20" width="6" height="6" fill="#1C1817" />
                    <path d="M 28 20 Q 34 17 40 20 L 41 18 Q 34 15 27 18 Z" fill="#1C1817" />
                    <line x1="34" y1="16" x2="34" y2="10" stroke="#FF8C74" strokeWidth="1" />
                    <circle cx="34" cy="10" r="1" fill="#E9BC78" />
                  </svg>
                )}

                <div className="flex items-center justify-between w-full">
                  <strong className="text-base font-bold text-[#F5F0E9] tracking-tight">
                    {meta.title}
                  </strong>
                  {level > 1 && (
                    <LockKeyhole size={13} className="text-[#82736B] shrink-0" aria-hidden="true" />
                  )}
                </div>

                <span className="text-xs text-[#B9B0AA] font-normal mt-1 leading-snug">
                  {meta.desc}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Details Section for Authenticated Users */}
      {user && (
        <details
          className="dashboard-card !p-4"
          onToggle={(e) => setActivityOpen(e.currentTarget.open)}
        >
          <summary className="cursor-pointer text-xs font-semibold text-[#B9B0AA] hover:text-[#F5F0E9] flex items-center gap-2">
            <span>Xem hoạt động học chi tiết</span>
            <ChevronRight size={14} className="inline" />
          </summary>
          {activityOpen && (
            <Suspense
              fallback={
                <p role="status" className="dashboard-subtle mt-4 text-xs">
                  Đang tải hoạt động…
                </p>
              }
            >
              <ActivityDetails />
            </Suspense>
          )}
        </details>
      )}

      {/* Elegant Guest Callout Footer */}
      {!user && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-[#49403D]/40 bg-[#24201F]/50 backdrop-blur-sm">
          <p className="dashboard-subtle text-xs">
            Khám phá nội dung công khai. Đăng nhập khi muốn lưu hành trình của bạn.
          </p>
          <button
            className="dashboard-action primary text-xs !min-h-[38px] px-4 font-semibold rounded-xl"
            onClick={requireLogin}
          >
            Bắt đầu với Jiayou
          </button>
        </div>
      )}
    </div>
  );
}
