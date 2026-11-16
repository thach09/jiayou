import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  Check,
  Layers,
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
      <button className="underline text-cinnabar-soft ml-1 font-medium" onClick={() => void load()}>
        Thử lại
      </button>
    </p>
  ) : !data ? (
    <p role="status" className="dashboard-subtle py-4 text-center animate-pulse">
      Đang tải dữ liệu học tập…
    </p>
  ) : null;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        {/* Top Header Row: Clean, refined Greeting integrated with Minimal Streak */}
        <div className="flex items-center gap-6 flex-wrap">
          <h1 className="dashboard-greeting text-2xl sm:text-[28px] font-medium text-fg tracking-normal">
            {!user
              ? 'Chào mừng đến với Jiayou'
              : profile
                ? `Chào mừng trở lại, ${profile.fullName}`
                : 'Chào mừng trở lại'}
          </h1>

          {/* Minimal Streak Component directly integrated beside the greeting */}
          <div className="shrink-0 flex items-center">
            <WeeklyStreak />
          </div>

          {user && !profile && (
            <p role="status" className="dashboard-subtle text-xs w-full -mt-3">
              {profileError || 'Đang tải tên tài khoản…'}
              {profileError && (
                <button
                  onClick={() => void loadProfile()}
                  className="ml-2 underline text-cinnabar"
                >
                  Thử lại
                </button>
              )}
            </p>
          )}
        </div>

        {/* Accessible Action Shortcuts (tested by dashboard-target and edtech-ux) */}
        <div className="sr-only">
          <Link to={`/vocabulary?level=HSK${target}`}>Tiếp tục học</Link>
          <Link to="/vocabulary?mode=srs">Ôn tập đến hạn</Link>
        </div>
      </header>

      {/* The Three Primary Balanced Cards Row */}
      <section className="dashboard-three" aria-label="Tổng quan học tập">
        {/* CARD 1: Companion / Mascot */}
        <CompanionWidget />

        {/* CARD 2: Nhiệm vụ hôm nay */}
        <section className="dashboard-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-fg">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cinnabar/12 text-cinnabar">
                <CalendarCheck size={16} aria-hidden="true" />
              </div>
              <h2 className="text-[18px] font-semibold tracking-normal text-fg">
                Nhiệm vụ hôm nay
              </h2>
            </div>
          </div>

          {errorOrLoadingState || (!user ? (
            /* Guest Missions Invitation */
            <div className="mt-4 flex flex-col items-center justify-center text-center p-5 rounded-xl border border-rule-muted/50 bg-black/20 flex-1 space-y-3">
              <div className="w-10 h-10 rounded-full bg-gold-soft/12 flex items-center justify-center text-gold-soft border border-gold-soft/25">
                <CalendarCheck size={20} />
              </div>
              <p className="text-xs text-fg-60 max-w-[260px] leading-relaxed">
                Đăng nhập để nhận nhiệm vụ và tích lũy EXP mỗi ngày.
              </p>
              <button
                className="dashboard-action primary text-xs !min-h-[34px] px-4 font-semibold rounded-lg"
                onClick={requireLogin}
              >
                Đăng nhập
              </button>
            </div>
          ) : (
            /* Authenticated Missions with Real Data */
            <div className="mt-3.5 space-y-2 flex-1">
              {data?.quests.length === 0 ? (
                <div className="py-8 text-center text-xs text-fg-60">
                  Hôm nay chưa có nhiệm vụ mới. Hãy tiếp tục học!
                </div>
              ) : (
                <ul className="space-y-2">
                  {data?.quests.map((q) => (
                    <li
                      key={q.code}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                        q.claimed
                          ? 'border-jade/40 bg-jade/10'
                          : 'border-rule-muted/60 bg-black/25'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {q.claimed || q.progress >= q.target ? (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-jade-strong text-bg">
                            <Check
                              size={12}
                              strokeWidth={3}
                              aria-label={q.claimed ? 'Đã nhận thưởng' : 'Đã hoàn thành'}
                            />
                          </div>
                        ) : (
                          <div className="h-5 w-5 shrink-0 rounded-full border border-rule-strong/60" />
                        )}
                        <span className="text-[13px] text-fg truncate font-normal">
                          {q.description}
                        </span>
                        {!q.claimed &&
                          (q.progress >= q.target ? (
                            <button
                              className="underline text-jade text-xs font-semibold shrink-0 ml-1 hover:text-jade-ink"
                              disabled={claiming}
                              onClick={() => void claim(q.code)}
                            >
                              Nhận thưởng
                            </button>
                          ) : (
                            <Link
                              className="underline text-fg-60 text-xs shrink-0 ml-1 hover:text-fg"
                              to={q.route}
                            >
                              Học ngay
                            </Link>
                          ))}
                      </div>
                      <span className="quest-reward shrink-0 text-xs font-semibold text-gold-soft bg-black/40 border border-gold-soft/25 px-2.5 py-0.5 rounded-full">
                        +{q.exp} EXP
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {claimNotice && (
                <p role="status" className="dashboard-subtle text-xs text-jade-light text-center">
                  {claimNotice}
                </p>
              )}
            </div>
          ))}
        </section>

        {/* CARD 3: Tiến độ học tập */}
        <section className="dashboard-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-fg">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-soft/12 text-gold-soft">
                <ChartNoAxesColumnIncreasing size={16} aria-hidden="true" />
              </div>
              <h2 className="text-[18px] font-semibold tracking-normal text-fg">
                Tiến độ học tập
              </h2>
            </div>
          </div>

          {errorOrLoadingState || (!user ? (
            /* Guest progress remains unknown until a session is available. */
            <div className="flex flex-col justify-between flex-1 mt-4">
              <div className="flex items-center justify-around gap-4 flex-wrap">
                <div
                  className="dashboard-donut"
                  style={{ '--progress': '0%' } as CSSProperties}
                  role="img"
                  aria-label="Đăng nhập để xem tiến độ"
                >
                  <div>
                    <strong className="text-2xl font-semibold text-fg">—</strong>
                    <span className="dashboard-subtle text-[11px] font-medium">Chưa có dữ liệu</span>
                  </div>
                </div>
                <dl className="space-y-3 text-xs">
                  <div className="flex items-center gap-2.5 text-fg">
                    <BookOpen className="text-gold-soft shrink-0" size={18} />
                    <span className="text-fg-60"><strong className="font-bold text-sm text-fg mr-1.5">—</strong> điểm ngữ pháp đã luyện</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-fg">
                    <Layers className="text-gold-soft shrink-0" size={18} />
                    <span className="text-fg-60"><strong className="font-bold text-sm text-fg mr-1.5">—</strong> từ đã ôn nhớ</span>
                  </div>
                </dl>
              </div>
              <p className="dashboard-subtle text-[11.5px] text-center pt-3 border-t border-rule-muted/30 mt-3">
                Đăng nhập để xem tiến độ của riêng bạn.
              </p>
            </div>
          ) : (
            /* Authenticated Progress with Genuine Backend Metrics */
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
                    <strong className="text-2xl font-semibold text-fg">
                      {overall === null ? '—' : `${overall}%`}
                    </strong>
                    <span className="dashboard-subtle text-[11px] font-medium">
                      {overall === null ? 'Chưa có dữ liệu' : 'Đã luyện tập'}
                    </span>
                  </div>
                </div>

                <dl className="space-y-3 text-xs">
                  <div className="flex items-center gap-2.5 text-fg">
                    <BookOpen className="text-gold-soft shrink-0" size={18} />
                    <dt className="text-fg-60 font-normal">
                      <strong className="font-bold text-sm text-fg mr-1.5">{totals.practiced}</strong>
                      điểm ngữ pháp đã luyện
                    </dt>
                  </div>
                  <div className="flex items-center gap-2.5 text-fg">
                    <Layers className="text-gold-soft shrink-0" size={18} />
                    <dt className="text-fg-60 font-normal">
                      <strong className="font-bold text-sm text-fg mr-1.5">{totals.learned}</strong>
                      từ đã ôn nhớ
                    </dt>
                  </div>
                </dl>
              </div>

              <p className="dashboard-subtle text-[11px] text-center pt-2.5 border-t border-rule-muted/30 mt-3">
                Tiến độ trong ứng dụng, không phải chứng nhận năng lực HSK.
              </p>
            </div>
          ))}
        </section>
      </section>

      {/* CARD 4: Lộ trình học tiếng Trung (HSK Learning Roadmap) */}
      <section className="dashboard-card dashboard-roadmap" aria-labelledby="roadmap-heading">
        <div className="dashboard-topline items-center justify-between">
          <div className="flex items-center gap-2.5 text-fg">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cinnabar/12 text-cinnabar">
              <Layers size={16} aria-hidden="true" />
            </div>
            <h2 id="roadmap-heading" className="text-[19px] font-semibold tracking-normal text-fg">
              Lộ trình học tiếng Trung theo cấp
            </h2>
          </div>
          <Link
            className="dashboard-action text-xs !min-h-[38px] px-4 font-medium rounded-xl text-fg border-rule-muted hover:border-rule-strong hover:bg-white/[0.04] flex items-center gap-1.5"
            to={`/vocabulary?level=HSK${target}`}
          >
            Xem lộ trình chi tiết <ArrowRight size={14} />
          </Link>
        </div>

        {/* 6 HSK Roadmap Cards Grid (interactive target selector & navigation) */}
        <p className="dashboard-subtle text-xs">
          Học liệu chọn lọc đang bổ sung, chưa bao phủ toàn bộ HSK.
        </p>
        <div className="dashboard-roadmap-grid">
          {[1, 2, 3, 4, 5, 6].map((level) => {
            const meta = hskRoadmapMeta[level];
            const isCurrent = target === level;
            return (
              <button
                type="button"
                key={level}
                role="button"
                aria-label={`HSK ${level}`}
                aria-pressed={isCurrent}
                onClick={() => select(level)}
                className={`roadmap-tile relative overflow-hidden group text-left transition-colors cursor-pointer hover:border-cinnabar/40 ${isCurrent ? 'active' : ''}`}
              >
                {/* Miniature Pagoda Sunset Silhouette artwork inside HSK 1 card matching reference */}
                {level === 1 && (
                  <svg
                    className="absolute right-1.5 bottom-1.5 w-16 h-12 opacity-35 pointer-events-none transition-opacity group-hover:opacity-50"
                    viewBox="0 0 64 48"
                    fill="none"
                  >
                    <circle cx="34" cy="26" r="14" fill="#FF8D73" opacity="0.4" />
                    <rect x="29" y="28" width="10" height="8" fill="#1C1817" />
                    <path d="M 26 28 Q 34 24 42 28 L 44 26 Q 34 21 24 26 Z" fill="#1C1817" />
                    <rect x="31" y="20" width="6" height="6" fill="#1C1817" />
                    <path d="M 28 20 Q 34 17 40 20 L 41 18 Q 34 15 27 18 Z" fill="#1C1817" />
                    <line x1="34" y1="16" x2="34" y2="10" stroke="#FF8D73" strokeWidth="1" />
                    <circle cx="34" cy="10" r="1" fill="#E8B15C" />
                  </svg>
                )}

                <div className="flex items-center justify-between w-full">
                  <strong className="text-base font-semibold text-fg tracking-normal">
                    {meta.title}
                  </strong>

                </div>

                <span className="text-xs text-fg-secondary font-normal mt-1 leading-snug">
                  {meta.desc}
                </span>
              </button>
            );
          })}
        </div>


      </section>

      {/* Activity Section for Authenticated Users (Always expanded) */}
      {user && (
        <section
          aria-label="Hoạt động học tập chi tiết"
          className="dashboard-card !p-4 sm:!p-5"
        >
          <Suspense
            fallback={
              <p role="status" className="dashboard-subtle text-xs">
                Đang tải hoạt động…
              </p>
            }
          >
            <ActivityDetails />
          </Suspense>
        </section>
      )}

      {/* Elegant Guest Callout Footer */}
      {!user && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-rule-muted/40 bg-card-raised/50 backdrop-blur-sm">
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
