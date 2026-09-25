import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Bold,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Eye,
  EyeOff,
  FileEdit,
  FileText,
  FilePlus2,
  Heart,
  Home,
  Key,
  LayoutDashboard,
  LogIn,
  LogOut,
  Library,
  Menu,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Type,
  Trash2,
  Upload,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import {
  Link,
  Route,
  Switch,
  Router as WouterRouter,
  useLocation,
  useParams,
} from 'wouter';

type Theme = 'light' | 'dark';
type Genre = 'Fantasy' | 'Literary' | 'Romance' | 'Mystery' | 'Science fiction' | 'Action' | 'Horror' | 'Drama' | 'Comedy' | 'Adventure';
type AccountRole = 'reader' | 'publisher';
type ReadingMode = 'Vertical Scroll' | 'Continuous Reading' | 'Swipe/Page Mode' | 'Tap Navigation';
type FontSize = 'Small' | 'Medium' | 'Large' | 'Extra large';
type FontFamily = 'Fraunces' | 'DM Sans' | 'Georgia' | 'System';
type LineSpacing = 'Compact' | 'Comfortable' | 'Spacious';
type TextWidth = 'Narrow' | 'Comfortable' | 'Wide';
type ParagraphSpacing = 'Tight' | 'Comfortable' | 'Generous';
type AccentColor = 'Babel Blue' | 'Babel Orange' | 'Lavender' | 'Sage' | 'Rose';
type AchievementGroup = 'Reading' | 'Streaks' | 'Completion' | 'Time' | 'Exploration' | 'Library' | 'Special';

type Novel = {
  id: string;
  title: string;
  author: string;
  description: string;
  genres: Genre[];
  tags: string[];
  language?: string;
  status?: 'Ongoing' | 'Completed';
  chapters: { id: number; title: string; minutes: number; published: boolean; text?: string; headerImage?: string }[];
};

type ServerBadgeEntitlements = {
  creator?: boolean;
  foundingReaderNumber?: number;
};

type Account = {
  name: string;
  email: string;
  role: AccountRole;
  createdAt: string;
  emailVerified?: boolean;
  // Badge entitlements are intended to become backend-authoritative.
  // In this frontend-only prototype they are stored locally and are not globally authoritative.
  serverBadgeEntitlements?: ServerBadgeEntitlements;
};

type ReadingRecord = {
  novelId: string;
  novelTitle: string;
  author: string;
  chapterId: number;
  chapterTitle: string;
  progress: number;
  lastOpened: string;
  bookmarked: boolean;
};

type ReadingPreferences = {
  mode: ReadingMode;
  fontSize: FontSize;
  fontFamily: FontFamily;
  lineSpacing: LineSpacing;
  textWidth: TextWidth;
  paragraphSpacing: ParagraphSpacing;
  accentColor: AccentColor;
};

type ReadingActivity = {
  id: string;
  novelId: string;
  chapterId: number;
  startedAt: string;
  durationSeconds: number;
  completedChapter: boolean;
  completedNovel: boolean;
};

type ProfileSettings = {
  avatar: string | null;
  featuredBadge: string | null;
  profileTitle: string;
  specialBadgeTitle: string;
  specialBadgeFont: 'Fraunces' | 'DM Sans' | 'DM Mono' | 'Georgia';
  specialBadgeAccent: AccentColor;
  profilePublic: boolean;
  statsPublic: boolean;
  achievementsPublic: boolean;
};

type AchievementDefinition = {
  id: string;
  name: string;
  description: string;
  group: AchievementGroup;
  target: number;
  metric: 'chaptersOpened' | 'chaptersCompleted' | 'novelsCompleted' | 'streak' | 'readingSeconds' | 'genres' | 'tags' | 'bookmarks' | 'favorites' | 'special';
};

type BabelContextValue = {
  account: Account | null;
  setAccount: (account: Account | null) => void;
  history: ReadingRecord[];
  favorites: string[];
  bookmarks: string[];
  preferences: ReadingPreferences;
  setPreferences: (preferences: ReadingPreferences) => void;
  activity: ReadingActivity[];
  recordReadingSession: (session: Omit<ReadingActivity, 'id'>) => void;
  profile: ProfileSettings;
  setProfile: (profile: ProfileSettings) => void;
  updateHistory: (record: ReadingRecord) => void;
  removeHistory: (novelId: string) => void;
  clearHistory: () => void;
  toggleFavorite: (novelId: string) => void;
  toggleBookmark: (novelId: string) => void;
};

const defaultPreferences: ReadingPreferences = {
  mode: 'Vertical Scroll',
  fontSize: 'Medium',
  fontFamily: 'Fraunces',
  lineSpacing: 'Comfortable',
  textWidth: 'Comfortable',
  paragraphSpacing: 'Comfortable',
  accentColor: 'Babel Orange',
};

const defaultProfile: ProfileSettings = {
  avatar: null,
  featuredBadge: null,
  profileTitle: 'Reader',
  specialBadgeTitle: '',
  specialBadgeFont: 'Fraunces',
  specialBadgeAccent: 'Babel Orange',
  profilePublic: false,
  statsPublic: false,
  achievementsPublic: false,
};

const achievementDefinitions: AchievementDefinition[] = [
  { id: 'first-page', name: 'First Page', description: 'Open your first chapter.', group: 'Reading', target: 1, metric: 'chaptersOpened' },
  { id: 'bookworm', name: 'Bookworm', description: 'Open 10 chapters.', group: 'Reading', target: 10, metric: 'chaptersOpened' },
  { id: 'avid-reader', name: 'Avid Reader', description: 'Complete 50 chapters.', group: 'Reading', target: 50, metric: 'chaptersCompleted' },
  { id: 'dedicated-reader', name: 'Dedicated Reader', description: 'Complete 100 chapters.', group: 'Reading', target: 100, metric: 'chaptersCompleted' },
  { id: 'library-regular', name: 'Library Regular', description: 'Complete 250 chapters.', group: 'Reading', target: 250, metric: 'chaptersCompleted' },
  { id: 'master-reader', name: 'Master Reader', description: 'Complete 500 chapters.', group: 'Reading', target: 500, metric: 'chaptersCompleted' },
  { id: 'archivist', name: 'Archivist', description: 'Complete 1,000 chapters.', group: 'Reading', target: 1000, metric: 'chaptersCompleted' },
  { id: 'legend-of-the-library', name: 'Legend of the Library', description: 'Complete 5,000 chapters.', group: 'Reading', target: 5000, metric: 'chaptersCompleted' },
  { id: 'first-finish', name: 'First Finish', description: 'Complete one novel.', group: 'Completion', target: 1, metric: 'novelsCompleted' },
  { id: 'series-finisher', name: 'Series Finisher', description: 'Complete 5 novels.', group: 'Completion', target: 5, metric: 'novelsCompleted' },
  { id: 'book-collector', name: 'Book Collector', description: 'Complete 10 novels.', group: 'Completion', target: 10, metric: 'novelsCompleted' },
  { id: 'library-builder', name: 'Library Builder', description: 'Complete 25 novels.', group: 'Completion', target: 25, metric: 'novelsCompleted' },
  { id: 'master-of-stories', name: 'Master of Stories', description: 'Complete 50 novels.', group: 'Completion', target: 50, metric: 'novelsCompleted' },
  { id: 'legendary-reader', name: 'Legendary Reader', description: 'Complete 100 novels.', group: 'Completion', target: 100, metric: 'novelsCompleted' },
  { id: 'spark', name: 'Spark', description: 'Read on 3 days.', group: 'Streaks', target: 3, metric: 'streak' },
  { id: 'steady-flame', name: 'Steady Flame', description: 'Read on 7 consecutive days.', group: 'Streaks', target: 7, metric: 'streak' },
  { id: 'burning-page', name: 'Burning Page', description: 'Read on 14 consecutive days.', group: 'Streaks', target: 14, metric: 'streak' },
  { id: 'unstoppable', name: 'Unstoppable', description: 'Read on 30 consecutive days.', group: 'Streaks', target: 30, metric: 'streak' },
  { id: 'eternal-flame', name: 'Eternal Flame', description: 'Read on 60 consecutive days.', group: 'Streaks', target: 60, metric: 'streak' },
  { id: 'century-reader', name: 'Century Reader', description: 'Read on 100 consecutive days.', group: 'Streaks', target: 100, metric: 'streak' },
  { id: 'library-legend', name: 'Library Legend', description: 'Read on 365 consecutive days.', group: 'Streaks', target: 365, metric: 'streak' },
  { id: 'first-hour', name: 'First Hour', description: 'Read for one hour.', group: 'Time', target: 3600, metric: 'readingSeconds' },
  { id: 'night-at-the-library', name: 'Night at the Library', description: 'Read for five hours.', group: 'Time', target: 18000, metric: 'readingSeconds' },
  { id: 'dedicated-scholar', name: 'Dedicated Scholar', description: 'Read for ten hours.', group: 'Time', target: 36000, metric: 'readingSeconds' },
  { id: 'deep-reader', name: 'Deep Reader', description: 'Read for twenty-five hours.', group: 'Time', target: 90000, metric: 'readingSeconds' },
  { id: 'master-of-pages', name: 'Master of Pages', description: 'Read for fifty hours.', group: 'Time', target: 180000, metric: 'readingSeconds' },
  { id: 'library-guardian', name: 'Library Guardian', description: 'Read for one hundred hours.', group: 'Time', target: 360000, metric: 'readingSeconds' },
  { id: 'wide-reader', name: 'Wide Reader', description: 'Read across 3 genres.', group: 'Exploration', target: 3, metric: 'genres' },
  { id: 'world-explorer', name: 'World Explorer', description: 'Read across 5 genres.', group: 'Exploration', target: 5, metric: 'genres' },
  { id: 'genre-hunter', name: 'Genre Hunter', description: 'Read across 10 genres.', group: 'Exploration', target: 10, metric: 'genres' },
  { id: 'story-explorer', name: 'Story Explorer', description: 'Collect 25 story tags.', group: 'Exploration', target: 25, metric: 'tags' },
  { id: 'first-mark', name: 'First Mark', description: 'Save one bookmark.', group: 'Library', target: 1, metric: 'bookmarks' },
  { id: 'page-keeper', name: 'Page Keeper', description: 'Save 10 bookmarks.', group: 'Library', target: 10, metric: 'bookmarks' },
  { id: 'archivists-notes', name: "Archivist's Notes", description: 'Save 50 bookmarks.', group: 'Library', target: 50, metric: 'bookmarks' },
  { id: 'library-archivist', name: 'Library Archivist', description: 'Save 100 bookmarks.', group: 'Library', target: 100, metric: 'bookmarks' },
  { id: 'first-favorite', name: 'First Favorite', description: 'Save one favorite.', group: 'Library', target: 1, metric: 'favorites' },
  { id: 'growing-library', name: 'Growing Library', description: 'Save 10 favorites.', group: 'Library', target: 10, metric: 'favorites' },
  { id: 'personal-library', name: 'Personal Library', description: 'Save 25 favorites.', group: 'Library', target: 25, metric: 'favorites' },
  { id: 'full-shelves', name: 'Full Shelves', description: 'Save 50 favorites.', group: 'Library', target: 50, metric: 'favorites' },
  { id: 'the-first-book', name: 'The First Book', description: 'Open a story in Babel.', group: 'Special', target: 1, metric: 'special' },
  { id: 'creator', name: 'The First Tower', description: 'Official Babel creator badge.', group: 'Special', target: 1, metric: 'special' },
  { id: 'founding-reader', name: 'Founding Reader', description: 'Awarded to the first 10 registered Babel readers.', group: 'Special', target: 1, metric: 'special' },
];

const SERVER_BADGE_IDS = {
  creator: 'creator',
  foundingReader: 'founding-reader',
} as const;

function getServerBadgeStatus(account: Account | null) {
  const entitlements = account?.serverBadgeEntitlements;
  const foundingNumber = entitlements?.foundingReaderNumber;
  return {
    creator: entitlements?.creator === true,
    foundingReader: typeof foundingNumber === 'number' && foundingNumber >= 1 && foundingNumber <= 10,
    foundingReaderNumber: foundingNumber,
  };
}

type ReadingStats = {
  chaptersOpened: number;
  chaptersCompleted: number;
  novelsCompleted: number;
  readingSeconds: number;
  sessions: number;
  averageSessionSeconds: number;
  readingDays: number;
  currentStreak: number;
  longestStreak: number;
  genres: number;
  tags: number;
  bookmarks: number;
  favorites: number;
};

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getReadingStats(activity: ReadingActivity[], favorites: string[], bookmarks: string[], novels: Novel[]): ReadingStats {
  const readingDays = [...new Set(activity.filter((item) => item.durationSeconds >= 300 || item.completedChapter).map((item) => dayKey(new Date(item.startedAt))))].sort();
  let longestStreak = 0;
  let currentRun = 0;
  readingDays.forEach((day, index) => {
    const previous = index > 0 ? new Date(`${readingDays[index - 1]}T00:00:00`) : null;
    const current = new Date(`${day}T00:00:00`);
    if (previous && (current.getTime() - previous.getTime()) / 86400000 === 1) currentRun += 1;
    else currentRun = 1;
    longestStreak = Math.max(longestStreak, currentRun);
  });
  const today = new Date();
  let currentStreak = 0;
  for (let offset = 0; offset < 366; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    if (readingDays.includes(dayKey(date))) currentStreak += 1;
    else if (offset > 0) break;
  }
  const novelMap = new Map(novels.map((novel) => [novel.id, novel]));
  const readNovels = activity.map((item) => novelMap.get(item.novelId)).filter(Boolean) as Novel[];
  const genresRead = new Set(readNovels.flatMap((novel) => novel.genres));
  const tagsRead = new Set(readNovels.flatMap((novel) => novel.tags));
  const now = Date.now();
  const durationInRange = (days: number) => activity.filter((item) => now - new Date(item.startedAt).getTime() <= days * 86400000).reduce((total, item) => total + item.durationSeconds, 0);
  return {
    chaptersOpened: new Set(activity.map((item) => `${item.novelId}:${item.chapterId}:${item.startedAt}`)).size,
    chaptersCompleted: new Set(activity.filter((item) => item.completedChapter).map((item) => `${item.novelId}:${item.chapterId}`)).size,
    novelsCompleted: new Set(activity.filter((item) => item.completedNovel).map((item) => item.novelId)).size,
    readingSeconds: activity.reduce((total, item) => total + item.durationSeconds, 0),
    sessions: activity.length,
    averageSessionSeconds: activity.length ? Math.round(activity.reduce((total, item) => total + item.durationSeconds, 0) / activity.length) : 0,
    readingDays: readingDays.length,
    currentStreak,
    longestStreak,
    genres: genresRead.size,
    tags: tagsRead.size,
    bookmarks: bookmarks.length,
    favorites: favorites.length,
  };
}

function achievementProgress(definition: AchievementDefinition, stats: ReadingStats) {
  if (definition.metric === 'special') return stats.chaptersOpened;
  if (definition.metric === 'streak') return stats.currentStreak;
  return stats[definition.metric];
}

const BabelContext = createContext<BabelContextValue | null>(null);

function useBabel() {
  const context = useContext(BabelContext);
  if (!context) throw new Error('Babel context is unavailable.');
  return context;
}

function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, value: T) {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value));
}

const AUTH_TOKEN_KEY = 'babel-auth-token';
const ACCOUNT_STORAGE_BASE_KEYS = [
  'babel-history',
  'babel-favorites',
  'babel-bookmarks',
  'babel-reading-preferences',
  'babel-reading-activity',
  'babel-profile',
  'babel-earned-achievements',
  'babel-accent-customized',
] as const;

function accountStorageKey(base: string, email: string) {
  return `${base}:${email.trim().toLowerCase()}`;
}

function loadAccountStored<T>(base: string, email: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const scopedKey = accountStorageKey(base, email);
  const scopedRaw = localStorage.getItem(scopedKey);
  if (scopedRaw !== null) {
    try { return JSON.parse(scopedRaw) as T; } catch { return fallback; }
  }
  const legacyRaw = localStorage.getItem(base);
  if (legacyRaw !== null) {
    try {
      const legacy = JSON.parse(legacyRaw) as T;
      localStorage.setItem(scopedKey, JSON.stringify(legacy));
      return legacy;
    } catch { return fallback; }
  }
  return fallback;
}

async function authRequest(path: string, init: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`/api/auth${path}`, { ...init, headers });
}

const featuredNovel: Novel = {
  id: 'atlas-of-small-hours',
  title: 'The Atlas of Small Hours',
  author: 'Mira Voss',
  description:
    'In a city that only appears between midnight and morning, a cartographer maps the places people forget when the sun comes up.',
  genres: ['Literary', 'Fantasy'],
  tags: ['city fantasy', 'found family', 'slow burn'],
  language: 'English',
  status: 'Ongoing',
  chapters: [
    { id: 1, title: 'The Hour Between', minutes: 12, published: true, text: 'At 12:07 every night, the city forgot one small thing.\n\nNot always the same thing. A doorstep. The name of a street. The exact sound of a person’s laugh.' },
    { id: 2, title: 'A Map for Leaving', minutes: 16, published: true, text: 'Mara kept a pencil for these omissions.\n\nShe drew them in the margins of the atlas, where the dark was wide enough to hold a secret.' },
    { id: 3, title: 'The Lantern District', minutes: 14, published: true, text: 'Tonight, the missing thing was the blue door at the end of Calder Street.\n\nMara knew because she had walked past it every night for seven years.' },
  ],
};

const genres: (Genre | 'All')[] = ['All', 'Fantasy', 'Literary', 'Romance', 'Mystery', 'Science fiction', 'Action', 'Horror', 'Drama', 'Comedy', 'Adventure'];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" data-testid="link-logo">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-foreground shadow-sm">B</span>
      {!compact && <span className="font-display text-xl tracking-[.18em] text-sidebar-foreground">BABEL</span>}
    </Link>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
        active
          ? 'bg-sidebar-accent text-sidebar-foreground'
          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
      }`}
      data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
    >
      <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
      <span>{label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
    </Link>
  );
}

function Shell({
  children,
  theme,
}: {
  children: ReactNode;
  theme: Theme;
}) {
  const { account } = useBabel();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const touchGesture = useRef<{ x: number; y: number; blocked: boolean } | null>(null);
  const isActive = (href: string) => href === '/' ? location === '/' : location.startsWith(href);
  const mainSections = ['/', '/discover', '/library', '/profile'];
  const currentMainSection = mainSections.indexOf(location === '/' ? '/' : mainSections.find((section) => section !== '/' && location.startsWith(section)) ?? '');
  const handleGlobalTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const blocked = Boolean(target.closest('input, textarea, select, button, a, [role="button"], [contenteditable="true"], [data-reader-surface]'));
    touchGesture.current = { x: event.touches[0].clientX, y: event.touches[0].clientY, blocked };
  };
  const handleGlobalTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const gesture = touchGesture.current;
    touchGesture.current = null;
    if (!gesture || gesture.blocked || currentMainSection < 0 || window.getSelection()?.toString()) return;
    const deltaX = event.changedTouches[0].clientX - gesture.x;
    const deltaY = event.changedTouches[0].clientY - gesture.y;
    if (Math.abs(deltaX) < 64 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.4) return;
    const nextIndex = currentMainSection + (deltaX < 0 ? 1 : -1);
    if (nextIndex >= 0 && nextIndex < mainSections.length) setLocation(mainSections[nextIndex]);
  };
  const navigation = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/discover', label: 'Discover', icon: Search },
    { href: '/library', label: 'My library', icon: Library },
  ];

  return (
    <div className="noise min-h-[100dvh] bg-background text-foreground selection:bg-accent/20" onTouchStart={handleGlobalTouchStart} onTouchEnd={handleGlobalTouchEnd}>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col border-r border-sidebar-border bg-sidebar/95 px-4 py-6 shadow-[18px_0_50px_rgba(20,23,40,.08)] backdrop-blur lg:flex">
        <Logo />
        <div className="mt-10 rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/20 p-2">
          <p className="mb-3 px-3 font-mono-ui text-[10px] uppercase tracking-[.19em] text-sidebar-foreground/35">Read</p>
          <nav className="space-y-1">
            {navigation.map((item) => <NavItem key={item.href} {...item} active={isActive(item.href)} />)}
          </nav>
        </div>
        <div className="mt-10">
          <p className="mb-3 px-3 font-mono-ui text-[10px] uppercase tracking-[.19em] text-sidebar-foreground/35">Make</p>
          <NavItem href="/publisher" label="Publisher desk" icon={LayoutDashboard} active={isActive('/publisher')} />
        </div>
        <div className="mt-auto space-y-1">
          <NavItem href="/settings" label="Settings" icon={Settings} active={isActive('/settings')} />
          <Link href={account ? '/profile' : '/auth'} className="mt-5 flex items-center gap-3 border-t border-sidebar-border px-3 pt-5 hover:opacity-80" data-testid="link-account-profile">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent font-mono-ui text-[11px] text-sidebar-foreground/80">{account?.name ? account.name.slice(0, 2).toUpperCase() : 'B'}</div>
            <div className="min-w-0">
              <p className="truncate text-xs text-sidebar-foreground/80">{account?.name || 'Guest reader'}</p>
              <p className="font-mono-ui text-[10px] text-sidebar-foreground/35">{account ? (account.role === 'publisher' ? 'publisher account' : 'reader account') : 'sign in to save'}</p>
            </div>
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 shadow-[0_8px_30px_rgba(20,23,40,.05)] backdrop-blur lg:hidden">
        <Logo compact />
        <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-mobile-menu" aria-label="Open navigation">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {mobileOpen && (
        <div className="fixed inset-0 top-[68px] z-20 bg-sidebar px-5 py-7 lg:hidden">
          <Logo />
          <nav className="mt-10 space-y-1">
            {navigation.map((item) => <NavItem key={item.href} {...item} active={isActive(item.href)} onClick={() => setMobileOpen(false)} />)}
            <div className="my-6 border-t border-sidebar-border" />
            <NavItem href="/publisher" label="Publisher desk" icon={LayoutDashboard} active={isActive('/publisher')} onClick={() => setMobileOpen(false)} />
            <NavItem href="/settings" label="Settings" icon={Settings} active={isActive('/settings')} onClick={() => setMobileOpen(false)} />
            <NavItem href={account ? '/profile' : '/auth'} label={account ? 'Profile' : 'Sign in'} icon={account ? User : LogIn} active={isActive(account ? '/profile' : '/auth')} onClick={() => setMobileOpen(false)} />
          </nav>
        </div>
      )}
      <main className="shell-main min-h-[100dvh] lg:pl-[252px]">{children}</main>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        {eyebrow && <p className="mb-3 font-mono-ui text-[10px] uppercase tracking-[.2em] text-accent">{eyebrow}</p>}
        <h1 className="font-display text-4xl leading-[1.05] tracking-[-.035em] text-foreground md:text-5xl" data-testid={`heading-${title.toLowerCase().replaceAll(' ', '-')}`}>{title}</h1>
        {description && <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground" data-testid="text-page-description">{description}</p>}
      </div>
      {action}
    </header>
  );
}

function Cover({ novel, size = 'md' }: { novel: Novel; size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = size === 'lg' ? 'h-[330px] w-[230px] md:h-[390px] md:w-[270px]' : size === 'sm' ? 'h-[112px] w-[78px]' : 'h-[226px] w-[158px]';
  return (
    <div className={`cover-art relative shrink-0 rounded-[10px] shadow-[0_16px_30px_rgba(37,42,65,.18)] ${dimensions}`} data-testid={`cover-${novel.id}`}>
      <div className="absolute inset-0 flex flex-col justify-between p-4 text-[#fbf6ea]">
        <span className="font-mono-ui text-[9px] uppercase tracking-[.18em] opacity-70">Babel / {novel.genres[0]}</span>
        <div>
          <p className="max-w-[170px] font-display text-2xl leading-[.96] tracking-[-.035em] md:text-3xl">{novel.title}</p>
          <p className="mt-3 font-mono-ui text-[9px] uppercase tracking-[.12em] opacity-80">{novel.author}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, copy, action }: { icon: typeof Bookmark; title: string; copy: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/45 px-6 py-12 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-accent"><Icon size={20} strokeWidth={1.7} /></div>
      <h3 className="font-display text-xl" data-testid={`empty-title-${title.toLowerCase().replaceAll(' ', '-')}`}>{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{copy}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function HomePage() {
  const { history, favorites, activity } = useBabel();
  const stats = getReadingStats(activity, favorites, [], [featuredNovel]);
  const continueRecord = history.find((record) => record.progress > 0 && record.progress < 100);
  return (
    <div className="page-enter mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-14">
      <div className="mb-12 flex items-start justify-between rounded-[1.75rem] border border-border/70 bg-card/70 p-6 shadow-[var(--shadow-card)] backdrop-blur md:p-9">
        <div>
          <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-accent">Tuesday, 14 May</p>
          <h1 className="mt-4 max-w-2xl font-display text-5xl leading-[.98] tracking-[-.045em] text-foreground md:text-7xl" data-testid="heading-home">A quiet place<br /><em className="text-accent">for stories.</em></h1>
          <p className="mt-6 max-w-md text-sm leading-6 text-muted-foreground">Read slowly. Find something that stays with you.</p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground md:flex"><span className="h-2 w-2 rounded-full bg-accent" /> Library in its early days</div>
      </div>

      <section className="grid gap-10 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">One to begin with</p><h2 className="mt-2 font-display text-2xl">Featured reading</h2></div>
            <Link href="/discover" className="text-xs font-medium text-accent hover:underline" data-testid="link-see-all">Browse all <ArrowRight className="ml-1 inline" size={14} /></Link>
          </div>
          <div className="group relative overflow-hidden rounded-[1.6rem] border border-sidebar-foreground/10 bg-sidebar p-6 text-sidebar-foreground shadow-[0_28px_70px_rgba(20,23,40,.18)] md:p-9">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-sidebar-foreground/10" />
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-sidebar-foreground/10" />
            <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end">
              <Cover novel={featuredNovel} size="md" />
              <div className="flex-1 pb-1">
                <div className="mb-5 flex flex-wrap gap-2">{featuredNovel.genres.map((genre) => <span key={genre} className="rounded-full border border-sidebar-foreground/15 px-2.5 py-1 font-mono-ui text-[9px] uppercase tracking-[.08em] text-sidebar-foreground/60">{genre}</span>)}</div>
                <h3 className="max-w-md font-display text-3xl leading-[1.03] tracking-[-.025em]" data-testid="text-featured-title">{featuredNovel.title}</h3>
                <p className="mt-2 text-sm text-sidebar-foreground/55">by {featuredNovel.author}</p>
                <p className="mt-5 max-w-md text-sm leading-6 text-sidebar-foreground/70">{featuredNovel.description}</p>
                <Link href={`/novel/${featuredNovel.id}`} className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5" data-testid="link-start-featured">Open the story <ArrowRight size={14} /></Link>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="mb-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">Your reading room</p><h2 className="mt-2 font-display text-2xl">Pick up where you left off</h2></div>
          {continueRecord ? <div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3"><Cover novel={featuredNovel} size="sm" /><div className="min-w-0 flex-1"><p className="font-display text-xl">{continueRecord.novelTitle}</p><p className="mt-1 text-xs text-muted-foreground">Chapter {continueRecord.chapterId}: {continueRecord.chapterTitle}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${continueRecord.progress}%` }} /></div></div></div><Link href={`/novel/${continueRecord.novelId}`} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sidebar px-4 py-2.5 text-xs font-semibold text-sidebar-foreground" data-testid="link-resume-home">Resume reading <ArrowRight size={14} /></Link></div> : <EmptyState icon={Clock3} title="Nothing open yet" copy="When a story catches your attention, it will wait here for your return." action={<Link href="/discover" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:bg-muted" data-testid="link-find-story">Find a story <ArrowRight size={14} /></Link>} />}
        </div>
      </section>

      <section className="mt-20 border-t border-border/80 pt-7">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">A small beginning</p><h2 className="mt-2 font-display text-3xl tracking-[-.025em]">Leave room for the next chapter.</h2></div>
          <div className="grid grid-cols-3 gap-10 md:pt-2"><div><p className="font-display text-3xl">{String(history.length).padStart(2, '0')}</p><p className="mt-1 text-xs text-muted-foreground">reading places kept</p></div><div><p className="font-display text-3xl">{String(favorites.length).padStart(2, '0')}</p><p className="mt-1 text-xs text-muted-foreground">saved for later</p></div><div><p className="font-display text-3xl">{Math.round(stats.readingSeconds / 60)}</p><p className="mt-1 text-xs text-muted-foreground">active minutes</p></div></div>
        </div>
      </section>
    </div>
  );
}

function NovelCard({ novel }: { novel: Novel }) {
  return (
    <article className="group rounded-[1.15rem] border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_18px_42px_rgba(20,23,40,.12)]" data-testid={`card-novel-${novel.id}`}>
      <div className="flex gap-4">
        <Link href={`/novel/${novel.id}`} data-testid={`link-cover-${novel.id}`}><Cover novel={novel} size="sm" /></Link>
        <div className="min-w-0 flex-1 py-1">
          <div className="mb-3 flex gap-1.5">{novel.genres.map((genre) => <span key={genre} className="font-mono-ui text-[9px] uppercase tracking-[.08em] text-accent">{genre}</span>)}</div>
          <Link href={`/novel/${novel.id}`} className="block font-display text-xl leading-tight hover:text-accent" data-testid={`link-title-${novel.id}`}>{novel.title}</Link>
          <p className="mt-1 text-xs text-muted-foreground">{novel.author}</p>
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{novel.description}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
        <span className="font-mono-ui text-[10px] text-muted-foreground">{novel.chapters.filter((chapter) => chapter.published).length} chapters</span>
        <Link href={`/novel/${novel.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent" data-testid={`link-read-${novel.id}`}>Read now <ArrowRight size={13} /></Link>
      </div>
    </article>
  );
}

function DiscoverPage() {
  const { activity } = useBabel();
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState<(typeof genres)[number]>('All');
  const results = useMemo(() => {
    const normalized = search.toLowerCase();
    return [featuredNovel].filter((novel) => {
      const matchesSearch = !normalized || `${novel.title} ${novel.author} ${novel.description} ${novel.genres.join(' ')} ${novel.tags.join(' ')}`.toLowerCase().includes(normalized);
      const matchesGenre = genre === 'All' || novel.genres.includes(genre);
      return matchesSearch && matchesGenre;
    });
  }, [genre, search]);

  return (
    <div className="page-enter mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-14">
      <PageHeader eyebrow="The catalogue" title="Discover your next world." description="A considered shelf of fiction, growing one good story at a time." />
      <div className="mb-10 flex flex-col gap-4 md:flex-row">
        <label className="relative block flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search titles, authors, or themes" className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-accent" data-testid="input-search-novels" /></label>
        <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-border bg-card px-2 py-2"><SlidersHorizontal className="ml-2 shrink-0 text-muted-foreground" size={16} />{genres.map((item) => <button key={item} onClick={() => setGenre(item)} className={`shrink-0 rounded-lg px-3 py-2 text-xs transition-colors ${genre === item ? 'bg-sidebar text-sidebar-foreground' : 'text-muted-foreground hover:bg-muted'}`} data-testid={`button-filter-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}</button>)}</div>
      </div>
      <div className="mb-5 flex items-center justify-between"><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">{results.length} {results.length === 1 ? 'story' : 'stories'} on the shelf</p><span className="text-xs text-muted-foreground">{search ? `For “${search}”` : 'Curated selection'}</span></div>
      {results.length ? <div className="grid max-w-3xl gap-4 md:grid-cols-2">{results.map((novel) => <NovelCard key={novel.id} novel={novel} />)}</div> : <EmptyState icon={Search} title="No stories found" copy="Try a different title or clear the genre filter. The catalogue is still taking shape." action={<button onClick={() => { setSearch(''); setGenre('All'); }} className="rounded-lg bg-sidebar px-4 py-2.5 text-xs font-semibold text-sidebar-foreground" data-testid="button-clear-search">Clear search</button>} />}
       <div className="mt-16 grid max-w-3xl gap-5 md:grid-cols-3"><section className="rounded-2xl border border-border bg-card p-5 md:col-span-1"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-accent">Recommended for you</p><h2 className="mt-2 font-display text-2xl">{activity.length ? 'A familiar shape.' : 'Begin anywhere.'}</h2><p className="mt-3 text-xs leading-5 text-muted-foreground">{activity.length ? 'Based on the genres and tags in your reading activity.' : 'New readers see general discovery until Babel has enough reading history to personalize the shelf.'}</p><Link href={`/novel/${featuredNovel.id}`} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-accent">Open a recommendation <ArrowRight size={13} /></Link></section><section className="rounded-2xl border border-border bg-card p-5 md:col-span-2"><div className="flex items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-accent">Popular this week</p><h2 className="mt-2 font-display text-2xl">Measured by reading.</h2></div><Sparkles size={18} className="text-accent" /></div>{activity.length ? <div className="mt-5 flex items-center justify-between rounded-xl bg-muted p-4"><div><p className="font-display text-lg">{featuredNovel.title}</p><p className="mt-1 text-xs text-muted-foreground">{activity.filter((item) => Date.now() - new Date(item.startedAt).getTime() <= 7 * 86400000 && item.novelId === featuredNovel.id).length} reading sessions this week</p></div><Link href={`/novel/${featuredNovel.id}`} className="rounded-lg border border-border px-3 py-2 text-xs hover:bg-card">Read <ArrowRight className="ml-1 inline" size={13} /></Link></div> : <p className="mt-5 rounded-xl bg-muted p-4 text-xs leading-5 text-muted-foreground">No ranking yet. Popularity appears after real reading sessions are recorded.</p>}</section><section className="rounded-2xl border border-border bg-card p-5 md:col-span-3"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-accent">Popular all time</p><h2 className="mt-2 font-display text-2xl">The shelf remembers.</h2><p className="mt-3 text-xs leading-5 text-muted-foreground">{activity.length ? `${activity.length} stored reading sessions currently contribute to lifetime activity.` : 'Lifetime popularity stays empty until readers create real activity. Refreshing a chapter does not create a new session by itself.'}</p></section></div>
      <div className="mt-20 flex max-w-3xl items-center gap-4 border-t border-border pt-5 text-xs text-muted-foreground"><Sparkles size={16} className="text-accent" /><p>New shelves are added by hand. No noise, no endless scroll — just stories with somewhere to land.</p></div>
    </div>
  );
}

function LibraryPage() {
  const { history, favorites, bookmarks, removeHistory, clearHistory, toggleFavorite, toggleBookmark } = useBabel();
  const [active, setActive] = useState('Continue reading');
  const tabs = [
    { label: 'Continue reading', icon: Clock3 },
    { label: 'Favorites', icon: Heart },
    { label: 'Bookmarks', icon: Bookmark },
    { label: 'History', icon: Archive },
  ];
  const visibleHistory = active === 'History' ? history : history.filter((record) => record.progress > 0 && record.progress < 100);
  const hasShelfNovel = active === 'Favorites' ? favorites.includes(featuredNovel.id) : active === 'Bookmarks' ? bookmarks.includes(featuredNovel.id) : false;
  const shelfCount = active === 'Continue reading' || active === 'History' ? visibleHistory.length : hasShelfNovel ? 1 : 0;
  const relativeDate = (value: string) => {
    const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
    return days === 0 ? 'Opened today' : `${days} day${days === 1 ? '' : 's'} ago`;
  };
  return (
    <div className="page-enter mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-14">
      <PageHeader eyebrow="Your shelves" title="My library." description="Stories you have chosen to keep close, arranged for the way you read." />
      <div className="mb-10 flex gap-1 overflow-x-auto border-b border-border">{tabs.map(({ label, icon: Icon }) => { const count = label === 'Favorites' ? favorites.length : label === 'Bookmarks' ? bookmarks.length : label === 'History' ? history.length : history.filter((record) => record.progress > 0 && record.progress < 100).length; return <button key={label} onClick={() => setActive(label)} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 text-xs font-medium transition-colors ${active === label ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`} data-testid={`button-library-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={15} />{label}<span className="font-mono-ui text-[10px] opacity-45">{count}</span></button>; })}</div>
      {shelfCount === 0 ? <EmptyState icon={tabs.find((tab) => tab.label === active)?.icon ?? Library} title={`No ${active.toLowerCase()} yet`} copy={active === 'Continue reading' ? 'Start a story and your place will be kept here, ready whenever you return.' : 'When you find something worth keeping, it will appear on this shelf.'} action={<Link href="/discover" className="inline-flex items-center gap-2 rounded-lg bg-sidebar px-4 py-2.5 text-xs font-semibold text-sidebar-foreground" data-testid="link-library-discover">Explore the catalogue <ArrowRight size={14} /></Link>} /> : <div className="space-y-4">
        {(active === 'Favorites' || active === 'Bookmarks') && hasShelfNovel && <div className="rounded-2xl border border-border bg-card p-4 md:p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center"><NovelCard novel={featuredNovel} /><div className="flex shrink-0 gap-2 md:flex-col"><button onClick={() => toggleFavorite(featuredNovel.id)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted" data-testid="button-library-toggle-favorite"><Heart size={14} fill={favorites.includes(featuredNovel.id) ? 'currentColor' : 'none'} />{favorites.includes(featuredNovel.id) ? 'Unfavorite' : 'Favorite'}</button><button onClick={() => toggleBookmark(featuredNovel.id)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted" data-testid="button-library-toggle-bookmark"><Bookmark size={14} fill={bookmarks.includes(featuredNovel.id) ? 'currentColor' : 'none'} />{bookmarks.includes(featuredNovel.id) ? 'Unbookmark' : 'Bookmark'}</button></div></div></div>}
        {(active === 'Continue reading' || active === 'History') && visibleHistory.map((record) => <div key={record.novelId} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center md:p-5"><Cover novel={featuredNovel} size="sm" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-accent/10 px-2 py-1 font-mono-ui text-[9px] uppercase tracking-[.1em] text-accent">{Math.round(record.progress)}% read</span><span className="text-[11px] text-muted-foreground">{relativeDate(record.lastOpened)}</span></div><p className="mt-3 font-display text-xl">{record.novelTitle}</p><p className="mt-1 text-xs text-muted-foreground">Chapter {record.chapterId}: {record.chapterTitle}</p><div className="mt-3 h-1.5 max-w-sm overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${record.progress}%` }} /></div></div><div className="flex shrink-0 gap-2"><Link href={`/novel/${record.novelId}`} className="inline-flex items-center gap-2 rounded-lg bg-sidebar px-3 py-2 text-xs font-semibold text-sidebar-foreground" data-testid="button-resume-reading">Resume <ArrowRight size={14} /></Link><button onClick={() => removeHistory(record.novelId)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-destructive" data-testid="button-remove-history" aria-label="Remove from history"><Trash2 size={14} /></button></div></div>)}
        {active === 'History' && history.length > 0 && <button onClick={clearHistory} className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive" data-testid="button-clear-history"><Trash2 size={14} /> Clear history</button>}
      </div>}
      <div className="mt-12 grid gap-5 md:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Saved stories</p><p className="mt-4 font-display text-3xl">{String(favorites.length + bookmarks.length).padStart(2, '0')}</p><p className="mt-1 text-xs text-muted-foreground">Favorites and bookmarks</p></div><div className="rounded-2xl border border-border bg-card p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Reading history</p><p className="mt-4 font-display text-3xl">{String(history.length).padStart(2, '0')}</p><p className="mt-1 text-xs text-muted-foreground">Places kept for you</p></div><div className="rounded-2xl border border-border bg-accent p-5 text-accent-foreground"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] opacity-65">Shelf note</p><p className="mt-4 font-display text-xl leading-tight">“Read what asks for your attention.”</p><p className="mt-3 text-xs opacity-65">— BABEL</p></div></div>
    </div>
  );
}

function NovelPage() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const { history, favorites, bookmarks, preferences, setPreferences, updateHistory, toggleFavorite, toggleBookmark, recordReadingSession } = useBabel();
  const existingRecord = history.find((record) => record.novelId === featuredNovel.id);
  const [reading, setReading] = useState(false);
  const [chapterId, setChapterId] = useState(existingRecord?.chapterId ?? 1);
  const [progress, setProgress] = useState(existingRecord?.progress ?? 0);
  const [bookmarkedPosition, setBookmarkedPosition] = useState(existingRecord?.bookmarked ?? false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [page, setPage] = useState(0);
  const touchStart = useRef<number | null>(null);
  const sessionStartedAt = useRef<number | null>(null);
  if (params.id !== featuredNovel.id) return <NotFound />;
  const currentChapter = featuredNovel.chapters.find((chapter) => chapter.id === chapterId) ?? featuredNovel.chapters[0];
  const publishedChapters = featuredNovel.chapters.filter((chapter) => chapter.published);
  const currentIndex = publishedChapters.findIndex((chapter) => chapter.id === currentChapter.id);
  const chapterPages: Record<number, string[][]> = {
    1: [['At 12:07 every night, the city forgot one small thing.', 'Not always the same thing. A doorstep. The name of a street. The exact sound of a person’s laugh.']],
    2: [['Mara kept a pencil for these omissions.', 'She drew them in the margins of the atlas, where the dark was wide enough to hold a secret.']],
    3: [['Tonight, the missing thing was the blue door at the end of Calder Street.', 'Mara knew because she had walked past it every night for seven years.']],
  };
  const pages = chapterPages[currentChapter.id] ?? [['The chapter is waiting to be written.']];
  const continuousChapters = publishedChapters.map((chapter) => ({ chapter, pages: chapterPages[chapter.id] ?? [[chapter.text || 'The chapter is waiting to be written.']] }));
  const saveReadingPosition = (nextProgress = progress, nextChapter = currentChapter, nextBookmark = bookmarkedPosition) => {
    updateHistory({
      novelId: featuredNovel.id,
      novelTitle: featuredNovel.title,
      author: featuredNovel.author,
      chapterId: nextChapter.id,
      chapterTitle: nextChapter.title,
      progress: Math.min(100, Math.max(0, nextProgress)),
      lastOpened: new Date().toISOString(),
      bookmarked: nextBookmark,
    });
  };
  const finishReadingSession = (completedChapter = progress >= 100, completedNovel = completedChapter && currentIndex === publishedChapters.length - 1) => {
    if (sessionStartedAt.current === null) return;
    recordReadingSession({
      novelId: featuredNovel.id,
      chapterId: currentChapter.id,
      startedAt: new Date(sessionStartedAt.current).toISOString(),
      durationSeconds: Math.max(0, Math.round((Date.now() - sessionStartedAt.current) / 1000)),
      completedChapter,
      completedNovel,
    });
    sessionStartedAt.current = null;
  };
  const openReader = (nextChapterId = existingRecord?.chapterId ?? 1) => {
    const nextChapter = publishedChapters.find((chapter) => chapter.id === nextChapterId) ?? publishedChapters[0];
    const saved = history.find((record) => record.novelId === featuredNovel.id);
    setChapterId(nextChapter.id);
    setProgress(saved?.chapterId === nextChapter.id ? saved.progress : 0);
    setBookmarkedPosition(saved?.chapterId === nextChapter.id ? saved.bookmarked : false);
    setPage(0);
    setReading(true);
    setControlsVisible(true);
    sessionStartedAt.current = Date.now();
    saveReadingPosition(saved?.chapterId === nextChapter.id ? saved.progress : 0, nextChapter, saved?.chapterId === nextChapter.id ? saved.bookmarked : false);
  };
  const changeChapter = (direction: -1 | 1) => {
    const next = publishedChapters[currentIndex + direction];
    finishReadingSession(direction > 0, direction > 0 && !next);
    if (!next) {
      setProgress(direction > 0 ? 100 : 0);
      saveReadingPosition(direction > 0 ? 100 : 0, currentChapter, bookmarkedPosition);
      return;
    }
    setChapterId(next.id);
    setProgress(0);
    setPage(0);
    setBookmarkedPosition(false);
    saveReadingPosition(0, next, false);
    if (preferences.mode === 'Continuous Reading') {
      window.setTimeout(() => {
        document.querySelector<HTMLElement>(`[data-continuous-chapter][data-chapter-id="${next.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const updatePreference = <K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) => setPreferences({ ...preferences, [key]: value });
  const readerTextStyle = {
    fontSize: preferences.fontSize === 'Small' ? '1.05rem' : preferences.fontSize === 'Large' ? '1.45rem' : preferences.fontSize === 'Extra large' ? '1.7rem' : '1.25rem',
    fontFamily: preferences.fontFamily === 'DM Sans' ? 'var(--app-font-sans)' : preferences.fontFamily === 'Georgia' ? 'Georgia, serif' : preferences.fontFamily === 'System' ? 'system-ui, sans-serif' : 'var(--app-font-serif)',
    lineHeight: preferences.lineSpacing === 'Compact' ? 1.48 : preferences.lineSpacing === 'Spacious' ? 2.08 : 1.8,
    maxWidth: preferences.textWidth === 'Narrow' ? '620px' : preferences.textWidth === 'Wide' ? '880px' : '760px',
  };
  const movePage = (direction: -1 | 1) => {
    const nextPage = page + direction;
    if (nextPage >= 0 && nextPage < pages.length) {
      setPage(nextPage);
      setProgress(Math.min(100, Math.max(0, Math.round(((nextPage + (direction > 0 ? 1 : 0)) / pages.length) * 100))));
      return;
    }
    changeChapter(direction);
  };
  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStart.current === null || preferences.mode !== 'Swipe/Page Mode') return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(distance) > 55) movePage(distance < 0 ? 1 : -1);
    touchStart.current = null;
  };
  const handleReaderClick = (event: React.MouseEvent<HTMLElement>) => {
    if (preferences.mode === 'Tap Navigation' && !controlsVisible) {
      const rect = event.currentTarget.getBoundingClientRect();
      movePage(event.clientX - rect.left > rect.width / 2 ? 1 : -1);
      return;
    }
    setControlsVisible((visible) => !visible);
  };
  useEffect(() => {
    if (!reading) return;
    const timer = window.setTimeout(() => saveReadingPosition(progress, currentChapter, bookmarkedPosition), 250);
    return () => window.clearTimeout(timer);
  }, [reading, progress, chapterId, bookmarkedPosition]);
  useEffect(() => {
    if (!reading || preferences.mode === 'Swipe/Page Mode' || preferences.mode === 'Tap Navigation') return;
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        if (preferences.mode === 'Continuous Reading') {
          const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-continuous-chapter]'));
          const activationLine = window.innerHeight * 0.35;
          let activeIndex = 0;
          sections.forEach((section, index) => {
            if (section.getBoundingClientRect().top <= activationLine) activeIndex = index;
          });
          const activeChapter = publishedChapters[activeIndex];
          if (activeChapter && activeChapter.id !== chapterId) {
            finishReadingSession(true, false);
            sessionStartedAt.current = Date.now();
            setChapterId(activeChapter.id);
            setPage(0);
            setBookmarkedPosition(false);
            saveReadingPosition(0, activeChapter, false);
          }
        }
        const nextProgress = Math.min(100, Math.round((window.scrollY / maxScroll) * 100));
        setProgress(nextProgress);
        if (nextProgress >= 100) finishReadingSession(true, preferences.mode === 'Continuous Reading');
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [reading, preferences.mode, chapterId, publishedChapters]);if (reading) {
    return (
      <div className="page-enter min-h-[100dvh] px-5 py-6 md:px-10 md:py-10">
        <div className={`mx-auto transition-all ${controlsVisible ? 'max-w-[1080px]' : 'max-w-[860px]'}`}>
          <div className={`mb-8 flex items-center justify-between gap-3 ${controlsVisible ? '' : 'opacity-70'}`}><button onClick={() => { finishReadingSession(); setReading(false); }} className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground" data-testid="button-close-reader"><ArrowLeft size={15} /> Back to details</button><div className="flex items-center gap-2"><span className="hidden font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground sm:inline">{Math.round(progress)}% complete</span><button onClick={() => setControlsVisible((visible) => !visible)} className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-muted" data-testid="button-toggle-reader-controls" aria-label="Show or hide reader controls">{controlsVisible ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></div>
          {controlsVisible && <div className="mb-10 rounded-2xl border border-border bg-card p-4 md:p-5"><div className="flex items-center justify-between gap-3"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-accent">Reading room</p><p className="mt-2 font-display text-xl">{currentChapter.title}</p></div><details className="relative"><summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-semibold hover:bg-muted" data-testid="button-reader-options"><SlidersHorizontal size={14} /> Options</summary><div className="absolute right-0 z-20 mt-2 w-[min(92vw,340px)] rounded-xl border border-border bg-card p-4 shadow-xl"><div className="space-y-4"><div><p className="mb-2 text-[11px] font-semibold">Reading mode</p><div className="grid grid-cols-2 gap-2">{(['Vertical Scroll', 'Continuous Reading', 'Swipe/Page Mode', 'Tap Navigation'] as ReadingMode[]).map((mode) => <button key={mode} onClick={() => updatePreference('mode', mode)} className={`rounded-lg border px-2 py-2 text-[11px] ${preferences.mode === mode ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:bg-muted'}`}>{mode}</button>)}</div></div><div><p className="mb-2 text-[11px] font-semibold">Font size</p><div className="flex flex-wrap gap-2">{(['Small', 'Medium', 'Large', 'Extra large'] as FontSize[]).map((size) => <button key={size} onClick={() => updatePreference('fontSize', size)} className={`rounded-lg border px-2.5 py-1.5 text-[11px] ${preferences.fontSize === size ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:bg-muted'}`}>{size}</button>)}</div></div><div><p className="mb-2 text-[11px] font-semibold">Font</p><div className="flex flex-wrap gap-2">{(['Fraunces', 'DM Sans', 'Georgia', 'System'] as FontFamily[]).map((font) => <button key={font} onClick={() => updatePreference('fontFamily', font)} className={`rounded-lg border px-2.5 py-1.5 text-[11px] ${preferences.fontFamily === font ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:bg-muted'}`}>{font}</button>)}</div></div><button onClick={() => { const next = !bookmarkedPosition; setBookmarkedPosition(next); toggleBookmark(featuredNovel.id); saveReadingPosition(progress, currentChapter, next); }} className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs ${bookmarkedPosition ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:bg-muted'}`} data-testid="button-reader-bookmark"><Bookmark size={14} fill={bookmarkedPosition ? 'currentColor' : 'none'} />{bookmarkedPosition ? 'Position saved' : 'Bookmark position'}</button></div></div></details></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} /></div></div>}
          <div className="mb-12 border-b border-border pb-8"><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-accent">{preferences.mode === 'Continuous Reading' ? `${continuousChapters.length} chapters · continuous` : `Chapter ${currentChapter.id} · ${currentChapter.minutes} min`}</p><h1 className="mt-4 font-display text-5xl leading-none tracking-[-.04em] md:text-6xl" data-testid="heading-reading-chapter">{preferences.mode === 'Continuous Reading' ? featuredNovel.title : currentChapter.title}</h1><p className="mt-4 text-sm text-muted-foreground">{featuredNovel.title} · {featuredNovel.author}</p></div>
          <article onClick={handleReaderClick} onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={handleTouchEnd} className="reader-surface mx-auto cursor-text select-none rounded-2xl px-2 py-4 transition-colors hover:bg-card/40 md:px-8 md:py-8" data-reader-surface data-testid="reader-surface">
            <div className="reading-rule text-foreground/90" style={readerTextStyle}>{(preferences.mode === 'Swipe/Page Mode' || preferences.mode === 'Tap Navigation' ? pages[page].map((paragraph, index) => <p key={`${currentChapter.id}-${page}-${index}`} style={{ marginTop: index === 0 ? 0 : preferences.paragraphSpacing === 'Tight' ? '1rem' : preferences.paragraphSpacing === 'Generous' ? '3rem' : '2rem' }}>{paragraph}</p>) : preferences.mode === 'Continuous Reading' ? continuousChapters.map(({ chapter, pages: chapterContent }) => <section key={chapter.id} data-continuous-chapter data-chapter-id={chapter.id} className="mb-16 min-h-[55vh]">{chapter.headerImage && <img src={chapter.headerImage} alt={`Chapter ${chapter.id}: ${chapter.title}`} className="mb-8 max-h-[520px] w-full rounded-2xl object-cover" />}<p className="mb-6 font-mono-ui text-[10px] uppercase tracking-[.18em] text-accent">Chapter {chapter.id} · {chapter.title}</p>{chapterContent.flat().map((paragraph, index) => <p key={`${chapter.id}-${index}`} style={{ marginTop: index === 0 ? 0 : preferences.paragraphSpacing === 'Tight' ? '1rem' : preferences.paragraphSpacing === 'Generous' ? '3rem' : '2rem' }}>{paragraph}</p>)}</section>) : pages.map((pageContent, pageIndex) => <section key={pageIndex}>{pageIndex === 0 && currentChapter.headerImage && <img src={currentChapter.headerImage} alt={`Chapter ${currentChapter.id}: ${currentChapter.title}`} className="mb-8 max-h-[520px] w-full rounded-2xl object-cover" />}<p className="mb-6 font-mono-ui text-[10px] uppercase tracking-[.18em] text-accent">Chapter {currentChapter.id} · {currentChapter.title}</p>{pageContent.map((paragraph, index) => <p key={`${currentChapter.id}-${pageIndex}-${index}`} style={{ marginTop: index === 0 ? 0 : preferences.paragraphSpacing === 'Tight' ? '1rem' : preferences.paragraphSpacing === 'Generous' ? '3rem' : '2rem' }}>{paragraph}</p>)}</section>))}</div>
            {(preferences.mode === 'Swipe/Page Mode' || preferences.mode === 'Tap Navigation') && <div className="mt-12 flex items-center justify-between border-t border-border pt-5"><button onClick={(event) => { event.stopPropagation(); movePage(-1); }} disabled={page === 0 && currentIndex <= 0} className="inline-flex items-center gap-2 text-xs text-muted-foreground disabled:opacity-30" data-testid="button-reader-previous-page"><ArrowLeft size={14} /> Previous page</button><span className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Page {page + 1} of {pages.length}</span><button onClick={(event) => { event.stopPropagation(); movePage(1); }} disabled={page === pages.length - 1 && currentIndex >= publishedChapters.length - 1} className="inline-flex items-center gap-2 text-xs text-muted-foreground disabled:opacity-30" data-testid="button-reader-next-page">Next page <ArrowRight size={14} /></button></div>}
          </article>
          <div className="mt-14 rounded-[1.4rem] border border-border/80 bg-card/80 p-3 shadow-[var(--shadow-card)] backdrop-blur sm:p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-2"><button onClick={() => changeChapter(-1)} disabled={currentIndex <= 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-35" data-testid="button-previous-chapter"><ArrowLeft size={14} /> Previous</button><label className="relative min-w-0 flex-1 sm:max-w-[420px]"><span className="sr-only">Select chapter</span><select value={currentChapter.id} onChange={(event) => { event.stopPropagation(); const selectedId = Number(event.currentTarget.value); if (publishedChapters.some((chapter) => chapter.id === selectedId)) openReader(selectedId); }} onClick={(event) => event.stopPropagation()} className="h-11 w-full appearance-none rounded-xl border border-border bg-background px-4 pr-10 text-xs font-semibold text-foreground outline-none transition-all hover:border-accent/50 focus:border-accent focus:ring-2 focus:ring-accent/15" data-testid="select-chapter" aria-label="Select chapter">{publishedChapters.map((chapter) => <option key={chapter.id} value={chapter.id}>Chapter {chapter.id} · {chapter.title}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} /></label><button onClick={() => changeChapter(1)} disabled={currentIndex >= publishedChapters.length - 1} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sidebar px-4 py-2.5 text-xs font-semibold text-sidebar-foreground transition-all hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-35" data-testid="button-next-chapter">Next <ArrowRight size={14} /></button></div><div className="flex items-center justify-between gap-3 px-1 pt-1"><span className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Chapter {currentChapter.id} of {publishedChapters.length}</span><span className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">{preferences.mode === 'Continuous Reading' ? 'Continuous shelf' : preferences.mode === 'Vertical Scroll' ? 'Scroll chapter' : `Tap to ${controlsVisible ? 'hide' : 'show'} controls`}</span></div></div>
      </div>
    );
  }
  return (
    <div className="page-enter mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-14">
      <button onClick={() => setLocation('/discover')} className="mb-12 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground" data-testid="button-back-discover"><ArrowLeft size={15} /> Back to discover</button>
      <div className="grid gap-10 md:grid-cols-[270px_1fr] md:gap-16">
        <Cover novel={featuredNovel} size="lg" />
        <div className="max-w-2xl pt-1"><div className="flex flex-wrap gap-2">{featuredNovel.genres.map((genre) => <span key={genre} className="rounded-full bg-muted px-3 py-1 font-mono-ui text-[10px] uppercase tracking-[.1em] text-muted-foreground">{genre}</span>)}</div><h1 className="mt-5 font-display text-5xl leading-[.96] tracking-[-.045em] md:text-7xl" data-testid="heading-novel-title">{featuredNovel.title}</h1><p className="mt-4 text-sm text-muted-foreground">by <span className="text-foreground">{featuredNovel.author}</span></p><p className="mt-8 max-w-xl text-base leading-7 text-muted-foreground">{featuredNovel.description}</p><div className="mt-9 flex flex-wrap gap-3"><button onClick={() => openReader()} className="inline-flex items-center gap-2 rounded-lg bg-sidebar px-5 py-3 text-xs font-semibold text-sidebar-foreground hover:opacity-90" data-testid="button-start-reading">Start reading <ArrowRight size={15} /></button><button onClick={() => toggleFavorite(featuredNovel.id)} className={`inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-xs font-semibold hover:bg-muted ${favorites.includes(featuredNovel.id) ? 'text-accent' : ''}`} data-testid="button-favorite-novel"><Heart size={15} fill={favorites.includes(featuredNovel.id) ? 'currentColor' : 'none'} />{favorites.includes(featuredNovel.id) ? 'Favorited' : 'Favorite'}</button><button onClick={() => toggleBookmark(featuredNovel.id)} className={`inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-xs font-semibold hover:bg-muted ${bookmarks.includes(featuredNovel.id) ? 'text-accent' : ''}`} data-testid="button-bookmark-novel"><Bookmark size={15} fill={bookmarks.includes(featuredNovel.id) ? 'currentColor' : 'none'} />{bookmarks.includes(featuredNovel.id) ? 'Saved' : 'Bookmark'}</button></div><p className="mt-8 font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">{publishedChapters.length} published {publishedChapters.length === 1 ? 'chapter' : 'chapters'} · {publishedChapters.reduce((total, chapter) => total + chapter.minutes, 0)} min total</p></div>
      </div>
      <section className="mt-20 max-w-3xl border-t border-border pt-8"><div className="mb-5 flex items-center justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">Inside the book</p><h2 className="mt-2 font-display text-3xl">Chapters</h2><p className="mt-2 text-xs text-muted-foreground">Clear chapter numbers and titles make it easy to know exactly where you are.</p></div><span className="font-mono-ui text-[10px] text-muted-foreground">{featuredNovel.chapters.length} listed</span></div><div className="space-y-3">{featuredNovel.chapters.map((chapter, index) => <div key={chapter.id} className={`group grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all ${chapter.published ? 'hover:border-accent/40 hover:bg-muted/30' : 'opacity-45'}`} data-testid={`row-chapter-${chapter.id}`}><div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-sidebar text-sidebar-foreground"><span className="font-mono-ui text-[8px] uppercase tracking-[.14em] opacity-55">Chapter</span><span className="mt-1 font-display text-xl leading-none">{String(index + 1).padStart(2, '0')}</span></div><div className="min-w-0"><p className="font-display text-lg leading-tight">{chapter.title}</p><p className="mt-1 font-mono-ui text-[10px] text-muted-foreground">{chapter.published ? `${chapter.minutes} min read · Ready to read` : 'Coming soon'}</p></div>{chapter.published && <button onClick={() => openReader(chapter.id)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors group-hover:border-accent/30 group-hover:text-accent" data-testid={`button-open-chapter-${chapter.id}`} aria-label={`Read chapter ${chapter.id}: ${chapter.title}`}><ArrowRight size={16} /></button>}</div>)}</div></section>
    </div>
  );
}

type DraftChapter = { id: number; number: number; title: string; text: string; headerImage: string | null; status: 'Draft' | 'Published'; };

function PublisherPage() {
  const [view, setView] = useState<'overview' | 'new'>('overview');
  const [sortNewest, setSortNewest] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('English');
  const [seriesStatus, setSeriesStatus] = useState<'Ongoing' | 'Completed'>('Ongoing');
  const [pdfImported, setPdfImported] = useState(false);
  const [importedFileName, setImportedFileName] = useState('');
  const [manuscript, setManuscript] = useState('');
  const [manuscriptPreview, setManuscriptPreview] = useState(false);
  const [coverAdded, setCoverAdded] = useState(false);
  const [chapters, setChapters] = useState<DraftChapter[]>([{ id: 1, number: 1, title: 'First light', text: '', headerImage: null, status: 'Draft' }]);
  const [newChapter, setNewChapter] = useState('');
  const [newChapterNumber, setNewChapterNumber] = useState('2');
  const [newChapterText, setNewChapterText] = useState('');
  const [newChapterHeaderImage, setNewChapterHeaderImage] = useState<string | null>(null);
  const [chapterPreview, setChapterPreview] = useState<number | null>(null);
  const [publisherNotice, setPublisherNotice] = useState('');
  const [novelPublished, setNovelPublished] = useState(true);
  const [coverChanged, setCoverChanged] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const toggleGenre = (genre: Genre) => setSelectedGenres((current) => current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre]);
  const addChapter = () => { if (!newChapter.trim()) return; setChapters((current) => [...current, { id: Date.now(), number: Number(newChapterNumber) || current.length + 1, title: newChapter.trim(), text: newChapterText, headerImage: newChapterHeaderImage, status: 'Draft' }]); setNewChapter(''); setNewChapterNumber(String(chapters.length + 2)); setNewChapterText(''); setNewChapterHeaderImage(null); };
  const selectChapterHeaderImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setPublisherNotice('Choose a JPG, PNG, or WebP chapter image under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setNewChapterHeaderImage(String(reader.result));
    reader.readAsDataURL(file);
  };
  const deleteChapter = (id: number) => setChapters((current) => current.filter((chapter) => chapter.id !== id));
  const saveNovel = () => { setPublisherNotice('Draft saved on this device.'); setView('overview'); };
  const importManuscript = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportedFileName(file.name);
    setPdfImported(true);
    if (file.name.toLowerCase().endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = () => setManuscript(String(reader.result ?? ''));
      reader.readAsText(file);
    }
  };
  const insertFormat = (token: string) => setManuscript((current) => `${current}${current ? '\n\n' : ''}${token}`);

  if (view === 'new') {
    return (
      <div className="page-enter mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-14">
        <button onClick={() => setView('overview')} className="mb-10 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground" data-testid="button-back-publisher"><ArrowLeft size={15} /> Publisher desk</button>
        <PageHeader eyebrow="New manuscript" title="Make room for a story." description="A quiet workspace for the details that help a reader choose what to open next." action={<button onClick={saveNovel} className="rounded-lg bg-sidebar px-4 py-2.5 text-xs font-semibold text-sidebar-foreground" data-testid="button-save-novel">Save as draft</button>} />
        {publisherNotice && <p className="mb-8 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-xs text-muted-foreground" role="status">{publisherNotice}</p>}
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="mb-7 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-mono-ui text-xs">01</span><div><h2 className="font-display text-xl">The essentials</h2><p className="text-xs text-muted-foreground">Give the story a name and a way in.</p></div></div><div className="space-y-5"><label className="block"><span className="mb-2 block text-xs font-semibold">Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="The name readers will remember" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="input-novel-title" /></label><label className="block"><span className="mb-2 block text-xs font-semibold">Author / pen name</span><input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Your name or pen name" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="input-novel-author" /></label><label className="block"><span className="mb-2 block text-xs font-semibold">Description <span className="font-normal text-muted-foreground">(optional)</span></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A short invitation to the world inside..." rows={4} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-accent" data-testid="textarea-novel-description" /></label><label className="block"><span className="mb-2 block text-xs font-semibold">Tags</span><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="slow burn, found family, city fantasy" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="input-novel-tags" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-xs font-semibold">Language</span><select value={language} onChange={(event) => setLanguage(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="select-novel-language"><option>English</option><option>Filipino</option><option>Japanese</option><option>Other</option></select></label><div><span className="mb-2 block text-xs font-semibold">Status</span><div className="flex gap-2"><button onClick={() => setSeriesStatus('Ongoing')} className={`rounded-lg border px-3 py-2.5 text-xs ${seriesStatus === 'Ongoing' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground'}`} data-testid="button-status-ongoing">Ongoing</button><button onClick={() => setSeriesStatus('Completed')} className={`rounded-lg border px-3 py-2.5 text-xs ${seriesStatus === 'Completed' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground'}`} data-testid="button-status-completed">Completed</button></div></div></div></div></section>
            <section className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="mb-6 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-mono-ui text-xs">02</span><div><h2 className="font-display text-xl">A little context</h2><p className="text-xs text-muted-foreground">Help the right readers find it.</p></div></div><div className="flex flex-wrap gap-2">{genres.filter((item): item is Genre => item !== 'All').map((genre) => <button key={genre} onClick={() => toggleGenre(genre)} className={`rounded-full border px-3 py-2 text-xs transition-colors ${selectedGenres.includes(genre) ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-muted'}`} data-testid={`button-genre-${genre.toLowerCase().replaceAll(' ', '-')}`}>{selectedGenres.includes(genre) && <Check className="mr-1 inline" size={13} />}{genre}</button>)}</div></section>
            <section className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-mono-ui text-xs">03</span><div><h2 className="font-display text-xl">Chapters</h2><p className="text-xs text-muted-foreground">Add, edit, preview, and publish each chapter.</p></div></div><span className="font-mono-ui text-[10px] text-muted-foreground">{chapters.length} total</span></div><div className="divide-y divide-border">{chapters.map((chapter, index) => <div className="py-3" key={chapter.id} data-testid={`row-draft-chapter-${chapter.id}`}><div className="flex items-center gap-3"><span className="font-mono-ui text-[10px] text-muted-foreground">{String(chapter.number).padStart(2, '0')}</span>{editingId === chapter.id ? <input autoFocus defaultValue={chapter.title} onBlur={(event) => { setChapters((current) => current.map((item) => item.id === chapter.id ? { ...item, title: event.target.value || item.title } : item)); setEditingId(null); }} className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none focus:border-accent" data-testid={`input-edit-chapter-${chapter.id}`} /> : <span className="flex-1 text-sm">{chapter.title}</span>}<span className="rounded-full bg-muted px-2 py-1 font-mono-ui text-[9px] text-muted-foreground">{chapter.status}</span><button onClick={() => setChapterPreview(chapterPreview === chapter.id ? null : chapter.id)} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid={`button-preview-chapter-${chapter.id}`} aria-label="Preview chapter"><Eye size={14} /></button><button onClick={() => setChapters((current) => current.map((item) => item.id === chapter.id ? { ...item, status: item.status === 'Published' ? 'Draft' : 'Published' } : item))} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid={`button-publish-chapter-${chapter.id}`} aria-label="Publish or unpublish chapter"><Check size={14} /></button><button onClick={() => setEditingId(chapter.id)} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid={`button-edit-chapter-${chapter.id}`} aria-label="Edit chapter"><Pencil size={14} /></button><button onClick={() => deleteChapter(chapter.id)} className="rounded-md p-2 text-muted-foreground hover:bg-red-50 hover:text-destructive dark:hover:bg-red-950/30" data-testid={`button-delete-chapter-${chapter.id}`} aria-label="Delete chapter"><Trash2 size={14} /></button></div>{chapterPreview === chapter.id && <div className="mt-3 overflow-hidden rounded-xl bg-muted/60">{chapter.headerImage && <img src={chapter.headerImage} alt={`Chapter ${chapter.number}: ${chapter.title} header`} className="max-h-80 w-full object-cover" />}<div className="p-4 text-xs leading-6 text-muted-foreground">{chapter.text || 'No chapter text yet. Add a chapter manuscript below to preview it.'}</div></div>}</div>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-[90px_1fr]"><input value={newChapterNumber} onChange={(event) => setNewChapterNumber(event.target.value)} type="number" min="1" placeholder="No." className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="input-new-chapter-number" /><input value={newChapter} onChange={(event) => setNewChapter(event.target.value)} placeholder="Chapter title" className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="input-new-chapter" /></div><div className="mt-3 rounded-xl border border-border bg-muted/30 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold">Chapter opening image <span className="font-normal text-muted-foreground">(optional)</span></p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Upload your own title art, illustration, or chapter card. It appears once at the start of this chapter; Babel does not generate it.</p></div><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted"><Upload size={14} /> {newChapterHeaderImage ? 'Replace image' : 'Attach image'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectChapterHeaderImage} className="hidden" data-testid="input-chapter-header-image" /></label></div>{newChapterHeaderImage && <div className="mt-4 overflow-hidden rounded-xl border border-border bg-background"><img src={newChapterHeaderImage} alt="New chapter opening preview" className="max-h-80 w-full object-cover" /><div className="flex items-center justify-between px-3 py-2"><span className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-muted-foreground">Opening image preview</span><button onClick={() => setNewChapterHeaderImage(null)} className="text-[10px] text-muted-foreground hover:text-destructive">Remove</button></div></div>}</div><textarea value={newChapterText} onChange={(event) => setNewChapterText(event.target.value)} placeholder="Write or paste the chapter text here..." rows={5} className="mt-3 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-accent" data-testid="textarea-new-chapter" /><div className="mt-3 flex flex-wrap gap-2"><button onClick={addChapter} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted" data-testid="button-add-chapter"><Plus size={14} /> Add chapter</button><button onClick={() => setPublisherNotice('Chapter draft saved on this device.')} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted" data-testid="button-save-chapter-draft"><FileEdit size={14} /> Save draft</button><button onClick={() => setPublisherNotice('Chapter preview is ready above.')} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted" data-testid="button-preview-new-chapter"><Eye size={14} /> Preview</button><button onClick={() => setPublisherNotice('Chapter published in this local prototype.')} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground hover:opacity-90" data-testid="button-publish-new-chapter"><Check size={14} /> Publish</button></div></section>
          </div>
          <div className="space-y-5">
             <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl">Cover</h2><span className="font-mono-ui text-[10px] text-muted-foreground">Optional</span></div><button onClick={() => setCoverAdded(!coverAdded)} className="flex min-h-[180px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 text-center hover:border-accent" data-testid="button-upload-cover">{coverAdded ? <><Check className="mb-3 text-accent" size={22} /><span className="text-xs font-semibold">Cover placeholder added</span><span className="mt-1 text-[11px] text-muted-foreground">Click to replace</span></> : <><Upload className="mb-3 text-muted-foreground" size={22} /><span className="text-xs font-semibold">Upload cover</span><span className="mt-1 text-[11px] text-muted-foreground">JPG or PNG · 1600 × 2400 recommended</span></>}</button></section>
             <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl">Manuscript</h2><FileEdit className="text-muted-foreground" size={17} /></div><label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-left hover:bg-muted" data-testid="button-import-manuscript"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-accent"><Upload size={16} /></span><span className="flex-1"><span className="block text-xs font-semibold">{pdfImported ? 'File ready to review' : 'Import PDF or TXT'}</span><span className="mt-1 block text-[11px] text-muted-foreground">{pdfImported ? importedFileName || 'manuscript-draft.pdf' : 'TXT files load into the editor; PDF stays modular for later extraction.'}</span></span>{pdfImported && <Check size={15} className="text-accent" />}<input type="file" accept=".pdf,.txt,text/plain,application/pdf" onChange={importManuscript} className="hidden" /></label><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => insertFormat('**bold text**')} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted" data-testid="button-manuscript-bold" aria-label="Insert bold"><Bold size={14} /></button><button onClick={() => insertFormat('_italic text_')} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted" data-testid="button-manuscript-italic" aria-label="Insert italic"><Type size={14} /></button><button onClick={() => insertFormat('## Chapter heading')} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted" data-testid="button-manuscript-heading" aria-label="Insert heading">H2</button><button onClick={() => setManuscriptPreview(!manuscriptPreview)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted" data-testid="button-manuscript-preview"><Eye size={14} /> {manuscriptPreview ? 'Edit' : 'Preview'}</button></div>{manuscriptPreview ? <div className="mt-3 min-h-[180px] whitespace-pre-wrap rounded-xl bg-muted/50 p-4 text-sm leading-6">{manuscript || 'Nothing to preview yet.'}</div> : <textarea value={manuscript} onChange={(event) => setManuscript(event.target.value)} placeholder="Paste your manuscript or a chapter here..." rows={9} className="mt-3 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm leading-6 outline-none focus:border-accent" data-testid="textarea-manuscript" />}<div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-[11px] leading-5 text-muted-foreground"><CircleHelp size={14} className="mt-0.5 shrink-0" />PDF text extraction is kept modular for the dedicated publishing app. TXT import is available now.</div></section>
             <div className="rounded-2xl border border-accent/25 bg-accent/10 p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-accent">Draft preview</p><p className="mt-3 font-display text-xl">{title || 'Untitled story'}</p><p className="mt-1 text-xs text-muted-foreground">{author || 'No author yet'} · {selectedGenres.length ? selectedGenres.join(', ') : 'No genres selected'} · {language} · {seriesStatus}</p>{tags && <p className="mt-3 text-[11px] text-muted-foreground">Tags: {tags}</p>}<div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setPublisherNotice('Novel preview opened in this local prototype.')} className="inline-flex items-center gap-2 rounded-lg border border-accent/30 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/10" data-testid="button-preview-novel"><Eye size={14} /> Preview novel</button><button onClick={() => setPublisherNotice('Novel published in this local prototype.')} className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground hover:opacity-90" data-testid="button-publish-novel"><Check size={14} /> Publish novel</button></div></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-14">
      <PageHeader eyebrow="Publisher desk" title="Your writing room." description="Shape a story, keep an eye on its chapters, and decide when it is ready for a reader." action={<button onClick={() => setView('new')} className="inline-flex items-center gap-2 rounded-lg bg-sidebar px-4 py-2.5 text-xs font-semibold text-sidebar-foreground" data-testid="button-add-novel"><Plus size={15} /> Add a novel</button>} />
      {publisherNotice && <p className="mb-8 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-xs text-muted-foreground" role="status">{publisherNotice}</p>}
      <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-accent/25 bg-accent/10 p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold text-accent">Publisher Plan — Monthly subscription coming soon</p><p className="mt-1 text-xs text-muted-foreground">Publishing tools are available in this prototype. Payments and subscription verification are not active.</p></div><span className="rounded-full border border-accent/30 px-3 py-1 font-mono-ui text-[9px] uppercase tracking-[.12em] text-accent">Prototype access</span></div>
      <div className="grid gap-5 md:grid-cols-3"><div className="rounded-2xl bg-sidebar p-5 text-sidebar-foreground"><div className="flex items-center justify-between"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] opacity-55">Published</p><BookOpen size={17} className="opacity-55" /></div><p className="mt-7 font-display text-4xl">01</p><p className="mt-1 text-xs opacity-55">story on the shelf</p></div><div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">Drafts</p><FileEdit size={17} className="text-accent" /></div><p className="mt-7 font-display text-4xl">00</p><p className="mt-1 text-xs text-muted-foreground">waiting in the wings</p></div><div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">Readers</p><Sparkles size={17} className="text-accent" /></div><p className="mt-7 font-display text-4xl">—</p><p className="mt-1 text-xs text-muted-foreground">quietly gathering</p></div></div>
       <section className="mt-12"><div className="mb-5 flex items-center justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">Your catalogue</p><h2 className="mt-2 font-display text-2xl">Published & drafts</h2></div><button onClick={() => setSortNewest(!sortNewest)} className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground" data-testid="button-sort-publisher">{sortNewest ? 'Recently updated' : 'Oldest first'} <ChevronDown size={14} /></button></div><div className="overflow-visible rounded-2xl border border-border bg-card"><div className="relative flex items-center gap-4 p-4 md:p-5"><Cover novel={featuredNovel} size="sm" /><div className="min-w-0 flex-1"><p className="font-display text-xl">{featuredNovel.title}</p><p className="mt-1 text-xs text-muted-foreground">{featuredNovel.author} · 2 published chapters</p><div className="mt-3 flex items-center gap-2"><span className="rounded-full bg-accent/10 px-2 py-1 font-mono-ui text-[9px] uppercase tracking-[.1em] text-accent">{novelPublished ? 'Published' : 'Unpublished'}</span><span className="text-[11px] text-muted-foreground">Updated today</span></div></div><button onClick={() => setMoreOpen(!moreOpen)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid="button-more-novel" aria-label="More novel actions"><MoreHorizontal size={18} /></button>{moreOpen && <div className="absolute right-4 top-14 z-10 w-44 rounded-xl border border-border bg-popover p-1 shadow-[var(--shadow-card)]"><button onClick={() => { setMoreOpen(false); setView('new'); }} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-muted" data-testid="button-edit-published-novel">Edit details</button><button onClick={() => { setMoreOpen(false); setPublisherNotice('Novel preview opened in this local prototype.'); }} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-muted" data-testid="button-preview-published-novel">Preview</button><button onClick={() => { setMoreOpen(false); setNovelPublished((published) => !published); setPublisherNotice(novelPublished ? 'Novel unpublished from the shelf.' : 'Novel published to the shelf.'); }} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-muted" data-testid="button-toggle-published-novel">{novelPublished ? 'Unpublish' : 'Publish'}</button><button onClick={() => { setMoreOpen(false); setCoverChanged((changed) => !changed); setPublisherNotice(coverChanged ? 'Cover placeholder cleared.' : 'Cover placeholder ready to change.'); }} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-muted" data-testid="button-change-cover">Change cover</button><button onClick={() => { setMoreOpen(false); setView('new'); setPublisherNotice('Chapter manager opened below.'); }} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-muted" data-testid="button-manage-chapters">Manage chapters</button></div>}</div></div><div className="mt-4"><EmptyState icon={FilePlus2} title="No drafts yet" copy="Start a new manuscript when an idea begins asking for a shape." action={<button onClick={() => setView('new')} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:bg-muted" data-testid="button-create-first-draft"><Plus size={14} /> Create a draft</button>} /></div></section>
    </div>
  );
}

function SettingsPage({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  const { account, preferences, setPreferences } = useBabel();
  const [showProgress, setShowProgress] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [accountNotice, setAccountNotice] = useState(false);
  const control = <K extends keyof ReadingPreferences>(label: string, key: K, options: ReadingPreferences[K][]) => <div className="flex flex-wrap gap-2">{options.map((option) => <button key={option} onClick={() => setPreferences({ ...preferences, [key]: option })} className={`rounded-lg border px-3 py-2 text-xs ${preferences[key] === option ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:bg-muted'}`} data-testid={`button-${label.toLowerCase().replaceAll(' ', '-')}-${String(option).toLowerCase().replaceAll(' ', '-')}`}>{preferences[key] === option && <Check className="mr-1 inline" size={13} />}{option}</button>)}</div>;
  return (
    <div className="page-enter mx-auto max-w-[1000px] px-5 py-9 md:px-10 md:py-14">
      <PageHeader eyebrow="Preferences" title="Make it yours." description="A few small choices can make a reading room feel like your own." />
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
           <section className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="mb-7"><h2 className="font-display text-2xl">Appearance</h2><p className="mt-1 text-xs text-muted-foreground">Choose the atmosphere you return to.</p></div><div className="grid gap-3 sm:grid-cols-2"><button onClick={() => setTheme('light')} className={`relative rounded-xl border p-4 text-left ${theme === 'light' ? 'border-accent ring-1 ring-accent' : 'border-border hover:bg-muted'}`} data-testid="button-theme-light"><div className="mb-4 h-16 rounded-lg border border-[#d9e4f2] bg-[#f7fbff] p-3"><div className="h-2 w-14 rounded bg-[#2474c6]" /><div className="mt-2 h-1.5 w-20 rounded bg-[#c8d8ea]" /><div className="mt-1 h-1.5 w-12 rounded bg-[#c8d8ea]" /></div><span className="text-xs font-semibold">Daylight</span>{theme === 'light' && <Check className="absolute right-4 top-4 text-accent" size={15} />}</button><button onClick={() => setTheme('dark')} className={`relative rounded-xl border p-4 text-left ${theme === 'dark' ? 'border-accent ring-1 ring-accent' : 'border-border hover:bg-muted'}`} data-testid="button-theme-dark"><div className="mb-4 h-16 rounded-lg border border-[#32364c] bg-[#11131d] p-3"><div className="h-2 w-14 rounded bg-[#b95b46]" /><div className="mt-2 h-1.5 w-20 rounded bg-[#5d6274]" /><div className="mt-1 h-1.5 w-12 rounded bg-[#5d6274]" /></div><span className="text-xs font-semibold">After hours</span>{theme === 'dark' && <Check className="absolute right-4 top-4 text-accent" size={15} />}</button></div><div className="mt-7"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold">Reader accent</span><span className="font-mono-ui text-[10px] text-muted-foreground">{preferences.accentColor}</span></div><div className="flex flex-wrap gap-2">{(['Babel Blue', 'Babel Orange', 'Lavender', 'Sage', 'Rose'] as AccentColor[]).map((accent) => <button key={accent} onClick={() => setPreferences({ ...preferences, accentColor: accent })} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${preferences.accentColor === accent ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:bg-muted'}`} data-testid={`button-accent-${accent.toLowerCase().replaceAll(' ', '-')}`}><span className={`h-3 w-3 rounded-full ${accent === 'Babel Blue' ? 'bg-[#2474c6]' : accent === 'Babel Orange' ? 'bg-[#b95b46]' : accent === 'Lavender' ? 'bg-[#8d72c9]' : accent === 'Sage' ? 'bg-[#45806a]' : 'bg-[#c94f70]'}`} />{accent}</button>)}</div></div></section>
          <section className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="mb-7"><h2 className="font-display text-2xl">Reading preferences</h2><p className="mt-1 text-xs text-muted-foreground">Tune the page for the way your eyes like to wander.</p></div><div className="space-y-7"><div><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold">Reading mode</span><span className="font-mono-ui text-[10px] text-muted-foreground">{preferences.mode}</span></div>{control('reading-mode', 'mode', ['Vertical Scroll', 'Continuous Reading', 'Swipe/Page Mode', 'Tap Navigation'])}</div><div><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold">Font size</span><span className="font-mono-ui text-[10px] text-muted-foreground">{preferences.fontSize}</span></div>{control('font-size', 'fontSize', ['Small', 'Medium', 'Large', 'Extra large'])}</div><div><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold">Font family</span><span className="font-mono-ui text-[10px] text-muted-foreground">{preferences.fontFamily}</span></div>{control('font-family', 'fontFamily', ['Fraunces', 'DM Sans', 'Georgia', 'System'])}</div><div><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold">Line spacing</span><span className="font-mono-ui text-[10px] text-muted-foreground">{preferences.lineSpacing}</span></div>{control('line-spacing', 'lineSpacing', ['Compact', 'Comfortable', 'Spacious'])}</div><div><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold">Text width</span><span className="font-mono-ui text-[10px] text-muted-foreground">{preferences.textWidth}</span></div>{control('text-width', 'textWidth', ['Narrow', 'Comfortable', 'Wide'])}</div><div><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold">Paragraph spacing</span><span className="font-mono-ui text-[10px] text-muted-foreground">{preferences.paragraphSpacing}</span></div>{control('paragraph-spacing', 'paragraphSpacing', ['Tight', 'Comfortable', 'Generous'])}</div></div></section>
          <section className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="mb-5"><h2 className="font-display text-2xl">Interface</h2><p className="mt-1 text-xs text-muted-foreground">A couple of gentle signals, never more than you need.</p></div><div className="divide-y divide-border"><button onClick={() => setShowProgress(!showProgress)} className="flex w-full items-center justify-between py-4 text-left" data-testid="button-toggle-progress"><span><span className="block text-xs font-semibold">Show reading progress</span><span className="mt-1 block text-[11px] text-muted-foreground">Keep a small marker at the foot of each chapter.</span></span><span className={`flex h-6 w-10 items-center rounded-full p-1 transition-colors ${showProgress ? 'bg-accent' : 'bg-muted'}`}><span className={`h-4 w-4 rounded-full bg-white transition-transform ${showProgress ? 'translate-x-4' : ''}`} /></span></button><button onClick={() => setFocusMode(!focusMode)} className="flex w-full items-center justify-between py-4 text-left" data-testid="button-toggle-focus"><span><span className="block text-xs font-semibold">Focus mode by default</span><span className="mt-1 block text-[11px] text-muted-foreground">Hide surrounding navigation when a chapter opens.</span></span><span className={`flex h-6 w-10 items-center rounded-full p-1 transition-colors ${focusMode ? 'bg-accent' : 'bg-muted'}`}><span className={`h-4 w-4 rounded-full bg-white transition-transform ${focusMode ? 'translate-x-4' : ''}`} /></span></button></div></section>
        </div>
        <aside className="space-y-5"><div className="rounded-2xl border border-border bg-accent p-5 text-accent-foreground"><Sun size={18} /><p className="mt-8 font-display text-2xl leading-tight">Your reading room should feel like somewhere you want to stay.</p><p className="mt-3 text-xs leading-5 opacity-70">These preferences stay on this device.</p></div><div className="rounded-2xl border border-border bg-card p-5"><h3 className="font-display text-lg">Account</h3><div className="mt-5 space-y-4 text-xs"><div><p className="text-muted-foreground">Signed in as</p><p className="mt-1 font-medium">{account?.name || 'Guest reader'}</p></div><Link href={account ? '/profile' : '/auth'} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-muted-foreground hover:bg-muted" data-testid="button-account-settings">{account ? 'Account settings' : 'Sign in or create account'} <ArrowRight size={14} /></Link>{accountNotice && <p className="rounded-lg bg-muted p-3 text-[11px] leading-5 text-muted-foreground">Your signed-in account and reading choices sync to Babel, with a local cache for temporary offline use.</p>}</div></div><div className="rounded-2xl border border-dashed border-border p-5"><div className="flex items-center gap-2 text-muted-foreground"><Moon size={16} /><span className="font-mono-ui text-[10px] uppercase tracking-[.14em]">More to come</span></div><p className="mt-3 text-xs leading-5 text-muted-foreground">Downloads, offline reading, and protected in-app content are reserved for the dedicated Babel app.</p></div></aside>
      </div>
    </div>
  );
}

function AuthPage() {
  const { account, setAccount } = useBabel();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AccountRole>('reader');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');

  if (account) {
    return <ProfilePage />;
  }

  const submit = async () => {
    if (mode === 'create' && !name.trim()) {
      setNotice('Add a name so your reading room knows who to welcome.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setNotice('Enter a valid email address to continue.');
      return;
    }
    if (password.length < 8) {
      setNotice('Use a password with at least 8 characters.');
      return;
    }

    setNotice('');
    try {
      const response = await authRequest(mode === 'signin' ? '/login' : '/register', {
        method: 'POST',
        body: JSON.stringify(mode === 'signin'
          ? { email: email.trim().toLowerCase(), password }
          : { name: name.trim(), email: email.trim().toLowerCase(), password, role }),
      });
      const data = await response.json().catch(() => ({})) as { account?: Account; token?: string; error?: string };
      if (!response.ok || !data.account || !data.token) {
        setNotice(data.error || 'Could not complete account request.');
        return;
      }
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setAccount(data.account);
      setLocation(data.account.role === 'publisher' ? '/publisher' : '/');
    } catch {
      setNotice('Babel could not reach the account service. Check that the API and database are running.');
    }
  };

  return (
    <div className="page-enter mx-auto grid min-h-[calc(100dvh-68px)] max-w-[1120px] items-center gap-8 px-5 py-10 md:grid-cols-[.8fr_1.2fr] md:px-10 md:py-14 lg:min-h-[100dvh]">
      <div className="rounded-2xl bg-sidebar p-7 text-sidebar-foreground md:p-10">
        <Logo />
        <p className="mt-20 font-mono-ui text-[10px] uppercase tracking-[.2em] text-sidebar-foreground/45">Your reading room</p>
        <h1 className="mt-4 max-w-md font-display text-4xl leading-[.98] tracking-[-.04em] md:text-6xl">Keep your place in every story.</h1>
        <p className="mt-6 max-w-sm text-sm leading-6 text-sidebar-foreground/65">Sign in to keep your reading room synchronized. Babel restores your session from the server when available and keeps cached reading preferences available during temporary outages.</p>
      </div>
      <section className="mx-auto w-full max-w-lg rounded-2xl border border-border bg-card p-6 md:p-9">
        <div className="mb-8 flex gap-1 border-b border-border">
          <button onClick={() => { setMode('signin'); setNotice(''); }} className={`border-b-2 px-2 pb-3 text-xs font-medium ${mode === 'signin' ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground'}`} data-testid="button-auth-signin">Sign in</button>
          <button onClick={() => { setMode('create'); setNotice(''); }} className={`border-b-2 px-2 pb-3 text-xs font-medium ${mode === 'create' ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground'}`} data-testid="button-auth-create">Create account</button>
        </div>
        <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-accent">{mode === 'signin' ? 'Welcome back' : 'A new beginning'}</p>
        <h2 className="mt-3 font-display text-3xl">{mode === 'signin' ? 'Return to your shelf.' : 'Make a place for stories.'}</h2>
        <div className="mt-7 space-y-4">
          {mode === 'create' && <label className="block"><span className="mb-2 block text-xs font-semibold">Name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="What should we call you?" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="input-account-name" /></label>}
          <label className="block"><span className="mb-2 block text-xs font-semibold">Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="input-account-email" /></label>
          <label className="block"><span className="mb-2 block text-xs font-semibold">Password</span><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} placeholder="At least 8 characters" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="input-account-password" /></label>
          {mode === 'create' && <div><span className="mb-2 block text-xs font-semibold">Account type</span><div className="grid gap-2 sm:grid-cols-2"><button onClick={() => setRole('reader')} className={`rounded-xl border p-3 text-left ${role === 'reader' ? 'border-accent bg-accent/10' : 'border-border hover:bg-muted'}`} data-testid="button-role-reader"><User size={16} className="mb-3 text-accent" /><span className="block text-xs font-semibold">Reader account</span><span className="mt-1 block text-[11px] leading-5 text-muted-foreground">Read, save, and return to your place.</span></button><button onClick={() => setRole('publisher')} className={`rounded-xl border p-3 text-left ${role === 'publisher' ? 'border-accent bg-accent/10' : 'border-border hover:bg-muted'}`} data-testid="button-role-publisher"><UserPlus size={16} className="mb-3 text-accent" /><span className="block text-xs font-semibold">Publisher account</span><span className="mt-1 block text-[11px] leading-5 text-muted-foreground">Publish novels and manage chapters.</span></button></div></div>}
          {mode === 'create' && role === 'publisher' && <div className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-xs leading-5 text-muted-foreground"><span className="font-semibold text-accent">Publisher Plan</span> — Monthly subscription coming soon. Publishing tools are available in this prototype without payment.</div>}
          {notice && <p className="rounded-lg bg-muted p-3 text-xs text-destructive" role="alert">{notice}</p>}
          <button onClick={submit} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sidebar px-4 py-3 text-xs font-semibold text-sidebar-foreground hover:opacity-90" data-testid="button-submit-auth">{mode === 'signin' ? <LogIn size={15} /> : <UserPlus size={15} />}{mode === 'signin' ? 'Sign in' : 'Create account'}<ArrowRight size={14} /></button>
        </div>
        <div className="mt-6 rounded-xl border border-accent/25 bg-accent/10 p-3 text-[11px] leading-5 text-muted-foreground"><span className="font-semibold text-accent">Account security:</span> registration and sign-in now use Babel's server-backed account service. Email verification, password reset, Google/Facebook OAuth, and account linking still require their provider configuration.</div>
        <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setNotice('Password reset requires the secure authentication service to be connected.')} className="rounded-lg border border-border px-3 py-2 text-[11px] text-muted-foreground hover:bg-muted" data-testid="button-password-reset">Forgot password?</button><button onClick={() => setNotice('Email verification requires the secure authentication service to be connected.')} className="rounded-lg border border-border px-3 py-2 text-[11px] text-muted-foreground hover:bg-muted" data-testid="button-email-verification">Resend verification</button></div>
        <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">Babel does not mark an email as verified until an email-verification provider is connected and the address is confirmed.</p>
      </section>
    </div>
  );
}

function BadgeMark({ title, group, locked = false, featured = false, specialFont, specialAccent }: { title: string; group: AchievementGroup; locked?: boolean; featured?: boolean; specialFont?: ProfileSettings['specialBadgeFont']; specialAccent?: AccentColor }) {
  const icons: Record<AchievementGroup, typeof BookOpen> = {
    Reading: BookOpen,
    Streaks: Sparkles,
    Completion: Check,
    Time: Clock3,
    Exploration: Search,
    Library: Bookmark,
    Special: Key,
  };
  const Icon = icons[group];
  const special = group === 'Special';
  const label = title === 'The First Tower' ? 'BABEL' : title.split(' ').slice(0, 2).join(' ');
  const fontMap: Record<NonNullable<ProfileSettings['specialBadgeFont']>, string> = {
    Fraunces: "'Fraunces', serif",
    'DM Sans': "'DM Sans', sans-serif",
    'DM Mono': "'DM Mono', monospace",
    Georgia: 'Georgia, serif',
  };
  const accentMap: Record<AccentColor, string> = {
    'Babel Blue': '214 82% 52%',
    'Babel Orange': '11 74% 62%',
    Lavender: '263 54% 62%',
    Sage: '151 32% 40%',
    Rose: '347 55% 52%',
  };
  const style = special ? {
    '--badge-accent': accentMap[specialAccent ?? 'Babel Orange'],
    '--badge-font': fontMap[specialFont ?? 'Fraunces'],
  } as React.CSSProperties : undefined;
  return (
    <div className={`badge-mark ${special ? 'badge-mark-special' : ''} ${locked ? 'badge-mark-locked' : featured ? 'badge-mark-featured' : 'badge-mark-earned'}`} style={style} title={title} aria-label={title}>
      <div className="badge-mark-ring"><span className="badge-mark-glow" aria-hidden="true" /><Icon size={special ? 24 : 21} strokeWidth={1.8} /></div>
      <span className="badge-mark-label">{label}</span>
    </div>
  );
}

function ShareButton({ text, title = 'BABEL' }: { text: string; title?: string }) {
  const [notice, setNotice] = useState('');
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title, text });
      else if (navigator.clipboard) await navigator.clipboard.writeText(text);
      else throw new Error('Sharing is unavailable');
      setNotice('Ready to share');
    } catch {
      setNotice('Copy unavailable on this device');
    }
  };
  return <span className="inline-flex items-center gap-2"><button onClick={share} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted" data-testid="button-share-babel"><Upload size={14} /> Share</button>{notice && <span className="text-[10px] text-muted-foreground">{notice}</span>}</span>;
}

function ProfilePage() {
  const { account, setAccount, activity, favorites, bookmarks, profile, setProfile } = useBabel();
  const [, setLocation] = useLocation();
  const [showAchievements, setShowAchievements] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');
  const [badgeVerification, setBadgeVerification] = useState(false);
  const stats = getReadingStats(activity, favorites, bookmarks, [featuredNovel]);
  const progressFor = (definition: AchievementDefinition) => achievementProgress(definition, stats);
  const serverBadges = getServerBadgeStatus(account);
  const creatorBadge = serverBadges.creator;
  const foundingReaderBadge = serverBadges.foundingReader;
  const isServerEarned = (definition: AchievementDefinition) =>
    (definition.id === SERVER_BADGE_IDS.creator && creatorBadge) ||
    (definition.id === SERVER_BADGE_IDS.foundingReader && foundingReaderBadge);
  const earned = achievementDefinitions.filter(
    (definition) => isServerEarned(definition) || progressFor(definition) >= definition.target,
  );
  const featured = earned.find((definition) => definition.id === profile.featuredBadge) ?? earned[0];
  const handleAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      setProfileNotice('Choose an image under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfile({ ...profile, avatar: String(reader.result) });
    reader.readAsDataURL(file);
  };
  const verifySpecialBadges = async () => {
    if (!account) return;
    setBadgeVerification(true);
    try {
      const response = await authRequest('/me');
      if (!response.ok) throw new Error('verification failed');
      const data = await response.json() as { account?: Account };
      if (!data.account) throw new Error('verification failed');
      setAccount(data.account);
      const status = getServerBadgeStatus(data.account);
      setProfileNotice(status.creator ? 'Creator badge verified.' : status.foundingReader ? 'Founding Reader #' + status.foundingReaderNumber + ' verified.' : 'No special badge entitlement is attached to this account.');
    } catch {
      setProfileNotice('Could not verify special badges right now.');
    } finally {
      setBadgeVerification(false);
    }
  };

  const deleteAccount = async () => {
    if (!account) return;
    const confirmed = window.confirm('Delete this Babel account and its account-owned local reading data? This cannot be undone.');
    if (!confirmed) return;
    const password = window.prompt('For security, enter your Babel password to confirm account deletion.');
    if (!password) return;
    try {
      const response = await authRequest('/account', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        setProfileNotice(data.error || 'Could not delete the account from the server.');
        return;
      }
      const accountDataKeys = [
        'babel-account',
        ...ACCOUNT_STORAGE_BASE_KEYS.map((key) => accountStorageKey(key, account.email)),
        AUTH_TOKEN_KEY,
      ];
      setAccount(null);
      setProfile(defaultProfile);
      accountDataKeys.forEach((key) => localStorage.removeItem(key));
      setLocation('/auth');
    } catch {
      setProfileNotice('Babel could not reach the account service.');
    }
  };

  if (!account) return <AuthPage />;
  return (
    <div className="page-enter mx-auto max-w-[1000px] px-5 py-9 md:px-10 md:py-14">
      <PageHeader eyebrow="Account" title="Your profile." description="Your BABEL account keeps your reading room close and your publishing tools ready." />
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-4 border-b border-border pb-6"><div className="relative">{profile.avatar ? <img src={profile.avatar} alt={`${account.name} profile`} className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent font-display text-xl text-accent-foreground">{account.name.slice(0, 2).toUpperCase()}</div>}<label className="absolute -bottom-2 -right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground" title="Change profile picture"><Upload size={13} /><input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatar} className="hidden" /></label></div><div><p className="font-display text-2xl">{account.name}</p><p className="mt-1 text-xs text-muted-foreground">{profile.profileTitle || 'Reader'} · {account.email}</p><p className="mt-2 font-mono-ui text-[10px] uppercase tracking-[.12em] text-accent">{account.role === 'publisher' ? 'Publisher account' : 'Reader account'}</p></div>{profile.avatar && <button onClick={() => setProfile({ ...profile, avatar: null })} className="ml-auto text-[11px] text-muted-foreground hover:text-destructive" data-testid="button-remove-avatar">Remove picture</button>}</div>
          <div className="mt-6 rounded-xl border border-border bg-muted/50 p-4"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Profile identity</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1 block text-[11px] font-semibold">Display name</span><input value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-accent" data-testid="input-profile-display-name" /></label><label className="block"><span className="mb-1 block text-[11px] font-semibold">Profile title</span><input value={profile.profileTitle} onChange={(event) => setProfile({ ...profile, profileTitle: event.target.value.slice(0, 32) })} placeholder="Reader, Archivist, Night Owl..." className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-accent" data-testid="input-profile-title" /></label></div></div>
          <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-4"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-accent">Special badge design</p><p className="mt-1 text-[11px] text-muted-foreground">Customize your featured special identity without changing normal achievement badges.</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="block"><span className="mb-1 block text-[10px] font-semibold">Badge title</span><input value={profile.specialBadgeTitle} onChange={(event) => setProfile({ ...profile, specialBadgeTitle: event.target.value.slice(0, 24) })} placeholder="COSMIC ARCHIVIST" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-accent" data-testid="input-special-badge-title" /></label><label className="block"><span className="mb-1 block text-[10px] font-semibold">Badge font</span><select value={profile.specialBadgeFont} onChange={(event) => setProfile({ ...profile, specialBadgeFont: event.target.value as ProfileSettings['specialBadgeFont'] })} className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-accent" data-testid="select-special-badge-font"><option>Fraunces</option><option>DM Sans</option><option>DM Mono</option><option>Georgia</option></select></label><label className="block"><span className="mb-1 block text-[10px] font-semibold">Badge accent</span><select value={profile.specialBadgeAccent} onChange={(event) => setProfile({ ...profile, specialBadgeAccent: event.target.value as AccentColor })} className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-accent" data-testid="select-special-badge-accent"><option>Babel Orange</option><option>Babel Blue</option><option>Lavender</option><option>Sage</option><option>Rose</option></select></label></div></div>
<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl bg-muted p-4"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Current streak</p><p className="mt-3 font-display text-2xl">{stats.currentStreak}</p><p className="mt-1 text-[11px] text-muted-foreground">days</p></div><div className="rounded-xl bg-muted p-4"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Longest streak</p><p className="mt-3 font-display text-2xl">{stats.longestStreak}</p><p className="mt-1 text-[11px] text-muted-foreground">days</p></div><div className="rounded-xl bg-muted p-4"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Chapters done</p><p className="mt-3 font-display text-2xl">{stats.chaptersCompleted}</p><p className="mt-1 text-[11px] text-muted-foreground">completed</p></div><div className="rounded-xl bg-muted p-4"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Novels done</p><p className="mt-3 font-display text-2xl">{stats.novelsCompleted}</p><p className="mt-1 text-[11px] text-muted-foreground">completed</p></div></div>
          <div className="mt-6 rounded-[1.35rem] border border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card p-5 shadow-[0_18px_45px_rgba(20,23,40,.10)]"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-accent">Special identity</p><p className="mt-1 text-xs text-muted-foreground">Verify creator or founding-reader entitlement from Babel's account server.</p></div><button onClick={verifySpecialBadges} disabled={badgeVerification} className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-[11px] font-semibold text-accent transition hover:bg-accent/15 disabled:opacity-50" data-testid="button-verify-special-badges">{badgeVerification ? 'Verifying…' : 'Verify now'}</button></div><div className="badge-featured-panel rounded-2xl border border-accent/25 bg-accent/10 p-5"><div className="flex items-center gap-4"><BadgeMark title={featured?.group === 'Special' && profile.specialBadgeTitle ? profile.specialBadgeTitle : featured?.name ?? 'No featured badge'} group={featured?.group ?? 'Special'} featured={Boolean(featured)} specialFont={profile.specialBadgeFont} specialAccent={profile.specialBadgeAccent} /><div className="min-w-0 flex-1"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-accent">Featured badge</p><p className="mt-2 font-display text-xl">{featured?.name ?? 'Earn your first badge'}</p><p className="mt-1 text-xs text-muted-foreground">{featured?.description ?? 'Open a chapter to begin.'}</p></div>{featured && (profile.achievementsPublic ? <ShareButton title={`BABEL · ${featured.name}`} text={`BABEL · ${account.name}'s badge: ${featured.name} · ${featured.description}`} /> : <span className="text-[10px] text-muted-foreground">Private</span>)}</div></div>
          {account.role === 'publisher' && <div className="mt-6 rounded-xl border border-accent/30 bg-accent/10 p-4 text-xs leading-5 text-muted-foreground"><span className="font-semibold text-accent">Publisher Plan</span> — Monthly subscription coming soon. Payment verification is not active in this prototype.</div>}
          {profileNotice && <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-destructive" role="alert">{profileNotice}</p>}
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => setShowAchievements(!showAchievements)} className="rounded-lg bg-sidebar px-4 py-3 text-xs font-semibold text-sidebar-foreground" data-testid="button-view-all-achievements">{showAchievements ? 'Hide achievements' : 'View all achievements'}</button>{profile.statsPublic ? <ShareButton title="BABEL reading progress" text={`BABEL · ${account.name} · ${stats.chaptersCompleted} chapters completed · ${stats.currentStreak} day reading streak · ${stats.readingSeconds ? Math.round(stats.readingSeconds / 3600) : 0}h reading time`} /> : <span className="flex items-center justify-center rounded-lg border border-border px-3 py-2 text-[11px] text-muted-foreground">Stats are private</span>}</div>
          {showAchievements && <div className="mt-6 space-y-6"><div className="badge-collection-header"><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-accent">Your achievements</p><h3 className="mt-2 font-display text-2xl tracking-[-.02em]">Badge collection</h3><p className="mt-1 text-xs text-muted-foreground">Earned badges can be featured. Locked badges show real progress only.</p></div>{(['Reading', 'Streaks', 'Completion', 'Time', 'Exploration', 'Library', 'Special'] as AchievementGroup[]).map((group) => <section key={group}><p className="mb-3 font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">{group}</p><div className="grid gap-3 sm:grid-cols-2">{achievementDefinitions.filter((definition) => definition.group === group).map((definition) => { const isEarned = isServerEarned(definition) || progressFor(definition) >= definition.target; const progress = isServerEarned(definition) ? definition.target : progressFor(definition); return <div key={definition.id} className="flex items-center gap-3 rounded-xl border border-border p-3"><BadgeMark title={definition.name} group={group} locked={!isEarned} featured={profile.featuredBadge === definition.id} /><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{definition.name}</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">{definition.description}</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (progress / definition.target) * 100)}%` }} /></div><p className="mt-1 font-mono-ui text-[9px] text-muted-foreground">{Math.min(progress, definition.target)} / {definition.target}</p></div>{isEarned ? <button onClick={() => setProfile({ ...profile, featuredBadge: definition.id })} className="rounded-lg border border-border px-2 py-1 text-[10px] hover:bg-muted" data-testid={`button-feature-badge-${definition.id}`}>{profile.featuredBadge === definition.id ? 'Featured' : 'Feature'}</button> : <span className="text-[10px] text-muted-foreground">Locked</span>}</div>; })}</div></section>)}</div>}
        </section>
        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5"><h3 className="font-display text-xl">Your account</h3><div className="mt-5 space-y-2"><Link href="/library" className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-xs hover:bg-muted">Open my library <ArrowRight size={14} /></Link>{account.role === 'publisher' && <Link href="/publisher" className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-xs hover:bg-muted">Open publisher desk <ArrowRight size={14} /></Link>}<Link href="/settings" className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-xs hover:bg-muted">Reading settings <ArrowRight size={14} /></Link></div></div>
          <div className="rounded-2xl border border-border bg-card p-5"><h3 className="font-display text-xl">Privacy</h3><div className="mt-4 space-y-3"><label className="flex items-center justify-between gap-3 text-xs"><span>Profile public</span><input type="checkbox" checked={profile.profilePublic} onChange={(event) => setProfile({ ...profile, profilePublic: event.target.checked })} /></label><label className="flex items-center justify-between gap-3 text-xs"><span>Stats public</span><input type="checkbox" checked={profile.statsPublic} onChange={(event) => setProfile({ ...profile, statsPublic: event.target.checked })} /></label><label className="flex items-center justify-between gap-3 text-xs"><span>Achievements public</span><input type="checkbox" checked={profile.achievementsPublic} onChange={(event) => setProfile({ ...profile, achievementsPublic: event.target.checked })} /></label><p className="pt-2 text-[11px] leading-5 text-muted-foreground">Sharing uses only the information you choose to share.</p></div></div>
          {creatorBadge ? <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5"><div className="flex items-center gap-3"><BadgeMark title={profile.specialBadgeTitle || 'The First Tower'} group="Special" featured specialFont={profile.specialBadgeFont} specialAccent={profile.specialBadgeAccent} /><div><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-accent">Creator badge</p><p className="mt-2 font-display text-xl">The First Tower</p><p className="mt-1 text-xs text-muted-foreground">Reserved for the securely verified Babel creator identity.</p></div></div></div> : <div className="rounded-2xl border border-dashed border-border p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Creator badge</p><p className="mt-3 text-xs leading-5 text-muted-foreground">Reserved for a securely verified creator identity. External authentication configuration is required.</p></div>}
          {foundingReaderBadge ? <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5"><div className="flex items-center gap-3"><BadgeMark title={profile.specialBadgeTitle || 'Founding Reader'} group="Special" featured specialFont={profile.specialBadgeFont} specialAccent={profile.specialBadgeAccent} /><div><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-accent">Founding reader badge</p><p className="mt-2 font-display text-xl">Founding Reader #{serverBadges.foundingReaderNumber}</p><p className="mt-1 text-xs text-muted-foreground">Founding Reader #{serverBadges.foundingReaderNumber} · permanently assigned by Babel at registration.</p></div></div></div> : <div className="rounded-2xl border border-dashed border-border p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Founding reader badges</p><p className="mt-3 text-xs leading-5 text-muted-foreground">The first 10 reader accounts receive a permanent founding number from Babel at registration. It cannot be claimed or changed from the client.</p></div>}
          <button onClick={deleteAccount} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground hover:bg-muted hover:text-destructive" data-testid="button-delete-account"><Trash2 size={14} /> Delete account</button>
          <button onClick={async () => { try { await authRequest('/logout', { method: 'POST' }); } finally { localStorage.removeItem(AUTH_TOKEN_KEY); setAccount(null); setLocation('/'); } }} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground" data-testid="button-logout"><LogOut size={15} /> Log out</button>
        </aside>
      </div>
    </div>
  );
}

function NotFound() {
  return <div className="flex min-h-[80dvh] flex-col items-center justify-center px-5 text-center"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-accent">404 · off the shelf</p><h1 className="mt-4 font-display text-5xl">This page is still being written.</h1><p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">The story you are looking for is not in this catalogue.</p><Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-sidebar px-4 py-2.5 text-xs font-semibold text-sidebar-foreground" data-testid="link-not-found-home">Return home <ArrowRight size={14} /></Link></div>;
}

function PublisherRoute() {
  const { account } = useBabel();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!account) {
      setLocation('/auth');
    } else if (account.role !== 'publisher') {
      setLocation('/');
    }
  }, [account]);

  if (!account || account.role !== 'publisher') return null;
  return <PublisherPage />;
}

function Router({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <Shell theme={theme}>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/discover" component={DiscoverPage} />
          <Route path="/library" component={LibraryPage} />
          <Route path="/publisher" component={PublisherRoute} />
          <Route path="/settings"><SettingsPage theme={theme} setTheme={setTheme} /></Route>
          <Route path="/novel/:id" component={NovelPage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route component={NotFound} />
        </Switch>
      </Shell>
    </ErrorBoundary>
  );
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('babel-theme') as Theme) || 'light';
  });
  const cachedAccount = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    return token ? loadStored<Account | null>('babel-account', null) : null;
  }, []);
  const [account, setAccountState] = useState<Account | null>(cachedAccount);
  const [history, setHistory] = useState<ReadingRecord[]>(() => cachedAccount ? loadAccountStored('babel-history', cachedAccount.email, []) : loadStored<ReadingRecord[]>('babel-history', []));
  const [favorites, setFavorites] = useState<string[]>(() => cachedAccount ? loadAccountStored('babel-favorites', cachedAccount.email, []) : loadStored<string[]>('babel-favorites', []));
  const [bookmarks, setBookmarks] = useState<string[]>(() => cachedAccount ? loadAccountStored('babel-bookmarks', cachedAccount.email, []) : loadStored<string[]>('babel-bookmarks', []));
  const [preferences, setPreferencesState] = useState<ReadingPreferences>(() => ({ ...defaultPreferences, ...(cachedAccount ? loadAccountStored<Partial<ReadingPreferences>>('babel-reading-preferences', cachedAccount.email, {}) : loadStored<Partial<ReadingPreferences>>('babel-reading-preferences', {})) }));
  const [activity, setActivity] = useState<ReadingActivity[]>(() => cachedAccount ? loadAccountStored('babel-reading-activity', cachedAccount.email, []) : loadStored<ReadingActivity[]>('babel-reading-activity', []));
  const [profile, setProfileState] = useState<ProfileSettings>(() => ({ ...defaultProfile, ...(cachedAccount ? loadAccountStored<Partial<ProfileSettings>>('babel-profile', cachedAccount.email, {}) : loadStored<Partial<ProfileSettings>>('babel-profile', {})) }));
  const [achievementNotice, setAchievementNotice] = useState<AchievementDefinition | null>(null);
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;
    let cancelled = false;
    authRequest('/me')
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            saveStored('babel-account', null);
            if (!cancelled) setAccountState(null);
          }
          return;
        }
        const data = await response.json() as { account: Account };
        if (!cancelled) {
          setAccount(data.account);
        }
      })
      .catch(() => {
        // Keep cached account data available during temporary offline/API outages.
      });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('babel-theme', theme);
    if (account) saveCloudPatch({ theme });
  }, [theme, account]);
  useEffect(() => {
    const customAccent = account ? localStorage.getItem(accountStorageKey('babel-accent-customized', account.email)) === 'true' : localStorage.getItem('babel-accent-customized') === 'true';
    if (!customAccent) {
      setPreferencesState((current) => ({ ...current, accentColor: theme === 'dark' ? 'Babel Orange' : 'Babel Blue' }));
    }
  }, [theme]);
  useEffect(() => {
    const accents: Record<AccentColor, { value: string; foreground: string }> = {
      'Babel Blue': { value: '211 72% 48%', foreground: '0 0% 100%' },
      'Babel Orange': { value: '11 62% 47%', foreground: '0 0% 100%' },
      Lavender: { value: '263 54% 62%', foreground: '0 0% 100%' },
      Sage: { value: '151 32% 40%', foreground: '0 0% 100%' },
      Rose: { value: '347 55% 52%', foreground: '0 0% 100%' },
    };
    const selected = accents[preferences.accentColor];
    document.documentElement.style.setProperty('--accent', selected.value);
    document.documentElement.style.setProperty('--accent-foreground', selected.foreground);
    document.documentElement.style.setProperty('--ring', selected.value);
  }, [preferences.accentColor]);
  const saveCloudPatch = (patch: Record<string, unknown>) => {
    if (!account) return;
    void authRequest('/data', {
      method: 'PUT',
      body: JSON.stringify({ data: patch }),
    }).catch(() => {
      // Local account-scoped cache remains available if the server is temporarily offline.
    });
  };

  const hydrateAccountFromCloud = async (next: Account) => {
    try {
      const response = await authRequest('/data');
      if (!response.ok) return;
      const payload = await response.json() as { data?: Record<string, unknown> };
      const data = payload.data ?? {};
      if (Array.isArray(data.history)) {
        const value = data.history as ReadingRecord[];
        setHistory(value); saveStored(accountStorageKey('babel-history', next.email), value);
      }
      if (Array.isArray(data.favorites)) {
        const value = data.favorites as string[];
        setFavorites(value); saveStored(accountStorageKey('babel-favorites', next.email), value);
      }
      if (Array.isArray(data.bookmarks)) {
        const value = data.bookmarks as string[];
        setBookmarks(value); saveStored(accountStorageKey('babel-bookmarks', next.email), value);
      }
      if (data.preferences && typeof data.preferences === 'object') {
        const value = { ...defaultPreferences, ...(data.preferences as Partial<ReadingPreferences>) };
        setPreferencesState(value); saveStored(accountStorageKey('babel-reading-preferences', next.email), value);
      }
      if (Array.isArray(data.activity)) {
        const value = data.activity as ReadingActivity[];
        setActivity(value); saveStored(accountStorageKey('babel-reading-activity', next.email), value);
      }
      if (data.profile && typeof data.profile === 'object') {
        const value = { ...defaultProfile, ...(data.profile as Partial<ProfileSettings>) };
        setProfileState(value); saveStored(accountStorageKey('babel-profile', next.email), value);
      }
      if (Array.isArray(data.earnedAchievementIds)) {
        saveStored(accountStorageKey('babel-earned-achievements', next.email), data.earnedAchievementIds);
      }
      if (data.theme === 'light' || data.theme === 'dark') {
        setTheme(data.theme);
        localStorage.setItem(accountStorageKey('babel-theme', next.email), data.theme);
      }
      if (typeof data.accentCustomized === 'boolean') {
        localStorage.setItem(accountStorageKey('babel-accent-customized', next.email), String(data.accentCustomized));
      }
    } catch {
      // Cached account data is the offline fallback.
    }
  };

  const setAccount = (next: Account | null) => {
    const previous = account;
    setAccountState(next);
    saveStored('babel-account', next);
    if (previous && next && previous.email === next.email && previous.name !== next.name) {
      void authRequest('/me', {
        method: 'PATCH',
        body: JSON.stringify({ name: next.name }),
      }).catch(() => {
        // Keep the local profile responsive during temporary API outages.
      });
    }
    if (!next) {
      setHistory([]);
      setFavorites([]);
      setBookmarks([]);
      setPreferencesState(defaultPreferences);
      setActivity([]);
      setProfileState(defaultProfile);
      return;
    }
    const nextHistory = loadAccountStored<ReadingRecord[]>('babel-history', next.email, []);
    const nextFavorites = loadAccountStored<string[]>('babel-favorites', next.email, []);
    const nextBookmarks = loadAccountStored<string[]>('babel-bookmarks', next.email, []);
    const nextPreferences = { ...defaultPreferences, ...loadAccountStored<Partial<ReadingPreferences>>('babel-reading-preferences', next.email, {}) };
    const nextActivity = loadAccountStored<ReadingActivity[]>('babel-reading-activity', next.email, []);
    const nextProfile = { ...defaultProfile, ...loadAccountStored<Partial<ProfileSettings>>('babel-profile', next.email, {}) };
    setHistory(nextHistory);
    setFavorites(nextFavorites);
    setBookmarks(nextBookmarks);
    setPreferencesState(nextPreferences);
    setActivity(nextActivity);
    setProfileState(nextProfile);
    saveStored(accountStorageKey('babel-history', next.email), nextHistory);
    saveStored(accountStorageKey('babel-favorites', next.email), nextFavorites);
    saveStored(accountStorageKey('babel-bookmarks', next.email), nextBookmarks);
    saveStored(accountStorageKey('babel-reading-preferences', next.email), nextPreferences);
    saveStored(accountStorageKey('babel-reading-activity', next.email), nextActivity);
    saveStored(accountStorageKey('babel-profile', next.email), nextProfile);
    void hydrateAccountFromCloud(next);
  };
  const updateHistory = (record: ReadingRecord) => {
    setHistory((current) => {
      const next = [record, ...current.filter((item) => item.novelId !== record.novelId)];
      if (account) {
        saveStored(accountStorageKey('babel-history', account.email), next);
        saveCloudPatch({ history: next });
      }
      return next;
    });
  };
  const removeHistory = (novelId: string) => {
    setHistory((current) => {
      const next = current.filter((item) => item.novelId !== novelId);
      if (account) {
        saveStored(accountStorageKey('babel-history', account.email), next);
        saveCloudPatch({ history: next });
      }
      return next;
    });
  };
  const clearHistory = () => {
    setHistory([]);
    if (account) {
      saveStored(accountStorageKey('babel-history', account.email), []);
      saveCloudPatch({ history: [] });
    }
  };
  const toggleFavorite = (novelId: string) => {
    setFavorites((current) => {
      const next = current.includes(novelId) ? current.filter((id) => id !== novelId) : [...current, novelId];
      if (account) {
        saveStored(accountStorageKey('babel-favorites', account.email), next);
        saveCloudPatch({ favorites: next });
      }
      return next;
    });
  };
  const toggleBookmark = (novelId: string) => {
    setBookmarks((current) => {
      const next = current.includes(novelId) ? current.filter((id) => id !== novelId) : [...current, novelId];
      if (account) {
        saveStored(accountStorageKey('babel-bookmarks', account.email), next);
        saveCloudPatch({ bookmarks: next });
      }
      return next;
    });
  };
  const setPreferences = (next: ReadingPreferences) => {
    setPreferencesState(next);
    if (account) {
      saveStored(accountStorageKey('babel-reading-preferences', account.email), next);
      if (next.accentColor !== preferences.accentColor) localStorage.setItem(accountStorageKey('babel-accent-customized', account.email), 'true');
      saveCloudPatch({ preferences: next, accentCustomized: next.accentColor !== defaultPreferences.accentColor });
    } else {
      saveStored('babel-reading-preferences', next);
    }
  };
  const recordReadingSession = (session: Omit<ReadingActivity, 'id'>) => {
    setActivity((current) => {
      const id = `${session.novelId}:${session.chapterId}:${session.startedAt}`;
      if (current.some((item) => item.id === id)) return current;
      const next = [...current, { ...session, id }];
      if (account) {
        saveStored(accountStorageKey('babel-reading-activity', account.email), next);
        saveCloudPatch({ activity: next });
      }
      return next;
    });
  };
  const setProfile = (next: ProfileSettings) => {
    setProfileState(next);
    if (account) {
      saveStored(accountStorageKey('babel-profile', account.email), next);
      saveCloudPatch({ profile: next });
    } else saveStored('babel-profile', next);
  };
  const activityStats = getReadingStats(activity, favorites, bookmarks, [featuredNovel]);
  const serverBadges = getServerBadgeStatus(account);
  const locallyEarnedAchievementIds = achievementDefinitions
    .filter((definition) => !['creator', 'founding-reader'].includes(definition.id))
    .filter((definition) => achievementProgress(definition, activityStats) >= definition.target)
    .map((definition) => definition.id);
  const serverEarnedBadgeIds = [
    ...(serverBadges.creator ? [SERVER_BADGE_IDS.creator] : []),
    ...(serverBadges.foundingReader ? [SERVER_BADGE_IDS.foundingReader] : []),
  ];
  const earnedAchievementIds = [...locallyEarnedAchievementIds, ...serverEarnedBadgeIds];
  useEffect(() => {
    const known = account ? loadStored<string[]>(accountStorageKey('babel-earned-achievements', account.email), []) : loadStored<string[]>('babel-earned-achievements', []);
    const newlyEarned = earnedAchievementIds.find((id) => !known.includes(id));
    if (newlyEarned) setAchievementNotice(achievementDefinitions.find((definition) => definition.id === newlyEarned) ?? null);
    if (earnedAchievementIds.join('|') !== known.join('|')) {
      saveStored(account ? accountStorageKey('babel-earned-achievements', account.email) : 'babel-earned-achievements', earnedAchievementIds);
      if (account) saveCloudPatch({ earnedAchievementIds });
    }
  }, [earnedAchievementIds.join('|')]);
  const contextValue: BabelContextValue = {
    account,
    setAccount,
    history,
    favorites,
    bookmarks,
    preferences,
    setPreferences,
    activity,
    recordReadingSession,
    profile,
    setProfile,
    updateHistory,
    removeHistory,
    clearHistory,
    toggleFavorite,
    toggleBookmark,
  };
  return (
      <TooltipProvider>
        <BabelContext.Provider value={contextValue}>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router theme={theme} setTheme={setTheme} />
          </WouterRouter>
          <Toaster />
           {achievementNotice && <div className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-2xl border border-accent/30 bg-card p-4 shadow-[var(--shadow-card)]" role="status"><BadgeMark title={achievementNotice.name} group={achievementNotice.group} /><div className="min-w-0 flex-1"><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-accent">Achievement unlocked</p><p className="mt-1 font-display text-lg">{achievementNotice.name}</p><p className="mt-1 text-xs text-muted-foreground">{achievementNotice.description}</p></div><button onClick={() => setAchievementNotice(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted" aria-label="Dismiss achievement notification"><X size={14} /></button></div>}
        </BabelContext.Provider>
      </TooltipProvider>
  );
}

export default App;