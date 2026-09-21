import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileEdit,
  FilePlus2,
  Heart,
  Home,
  LayoutDashboard,
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
  Trash2,
  Upload,
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

const queryClient = new QueryClient();

type Theme = 'light' | 'dark';
type Genre = 'Fantasy' | 'Literary' | 'Romance' | 'Mystery' | 'Science fiction';

type Novel = {
  id: string;
  title: string;
  author: string;
  description: string;
  genres: Genre[];
  chapters: { id: number; title: string; minutes: number; published: boolean }[];
};

const featuredNovel: Novel = {
  id: 'atlas-of-small-hours',
  title: 'The Atlas of Small Hours',
  author: 'Mira Voss',
  description:
    'In a city that only appears between midnight and morning, a cartographer maps the places people forget when the sun comes up.',
  genres: ['Literary', 'Fantasy'],
  chapters: [
    { id: 1, title: 'The Hour Between', minutes: 12, published: true },
    { id: 2, title: 'A Map for Leaving', minutes: 16, published: true },
    { id: 3, title: 'The Lantern District', minutes: 14, published: false },
  ],
};

const genres: (Genre | 'All')[] = ['All', 'Fantasy', 'Literary', 'Romance', 'Mystery', 'Science fiction'];

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
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (href: string) => href === '/' ? location === '/' : location.startsWith(href);
  const navigation = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/discover', label: 'Discover', icon: Search },
    { href: '/library', label: 'My library', icon: Library },
  ];

  return (
    <div className="noise min-h-[100dvh] bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col bg-sidebar px-4 py-6 lg:flex">
        <Logo />
        <div className="mt-14">
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
          <div className="mt-5 flex items-center gap-3 border-t border-sidebar-border px-3 pt-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent font-mono-ui text-[11px] text-sidebar-foreground/80">RV</div>
            <div className="min-w-0">
              <p className="truncate text-xs text-sidebar-foreground/80">Reader account</p>
              <p className="font-mono-ui text-[10px] text-sidebar-foreground/35">{theme === 'dark' ? 'night reader' : 'quiet reader'}</p>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur lg:hidden">
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
          </nav>
        </div>
      )}
      <main className="shell-main lg:pl-[236px]">{children}</main>
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
  return (
    <div className="page-enter mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-14">
      <div className="mb-16 flex items-start justify-between">
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
          <div className="group relative overflow-hidden rounded-2xl bg-sidebar p-6 text-sidebar-foreground md:p-8">
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
          <EmptyState icon={Clock3} title="Nothing open yet" copy="When a story catches your attention, it will wait here for your return." action={<Link href="/discover" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:bg-muted" data-testid="link-find-story">Find a story <ArrowRight size={14} /></Link>} />
        </div>
      </section>

      <section className="mt-20 border-t border-border/80 pt-7">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">A small beginning</p><h2 className="mt-2 font-display text-3xl tracking-[-.025em]">Leave room for the next chapter.</h2></div>
          <div className="grid grid-cols-3 gap-10 md:pt-2"><div><p className="font-display text-3xl">01</p><p className="mt-1 text-xs text-muted-foreground">story in the library</p></div><div><p className="font-display text-3xl">00</p><p className="mt-1 text-xs text-muted-foreground">saved for later</p></div><div><p className="font-display text-3xl">∞</p><p className="mt-1 text-xs text-muted-foreground">pages ahead</p></div></div>
        </div>
      </section>
    </div>
  );
}

function NovelCard({ novel }: { novel: Novel }) {
  return (
    <article className="group rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1" data-testid={`card-novel-${novel.id}`}>
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
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState<(typeof genres)[number]>('All');
  const results = useMemo(() => {
    const normalized = search.toLowerCase();
    return [featuredNovel].filter((novel) => {
      const matchesSearch = !normalized || `${novel.title} ${novel.author} ${novel.description}`.toLowerCase().includes(normalized);
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
      <div className="mt-20 flex max-w-3xl items-center gap-4 border-t border-border pt-5 text-xs text-muted-foreground"><Sparkles size={16} className="text-accent" /><p>New shelves are added by hand. No noise, no endless scroll — just stories with somewhere to land.</p></div>
    </div>
  );
}

function LibraryPage() {
  const [active, setActive] = useState('Continue reading');
  const tabs = [
    { label: 'Continue reading', icon: Clock3 },
    { label: 'Favorites', icon: Heart },
    { label: 'Bookmarks', icon: Bookmark },
    { label: 'History', icon: Archive },
  ];
  return (
    <div className="page-enter mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-14">
      <PageHeader eyebrow="Your shelves" title="My library." description="Stories you have chosen to keep close, arranged for the way you read." />
      <div className="mb-10 flex gap-1 overflow-x-auto border-b border-border">{tabs.map(({ label, icon: Icon }) => <button key={label} onClick={() => setActive(label)} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 text-xs font-medium transition-colors ${active === label ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`} data-testid={`button-library-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={15} />{label}<span className="font-mono-ui text-[10px] opacity-45">0</span></button>)}</div>
      <EmptyState icon={tabs.find((tab) => tab.label === active)?.icon ?? Library} title={`No ${active.toLowerCase()} yet`} copy={active === 'Continue reading' ? 'Start a story and your place will be kept here, ready whenever you return.' : 'When you find something worth keeping, it will appear on this shelf.'} action={<Link href="/discover" className="inline-flex items-center gap-2 rounded-lg bg-sidebar px-4 py-2.5 text-xs font-semibold text-sidebar-foreground" data-testid="link-library-discover">Explore the catalogue <ArrowRight size={14} /></Link>} />
      <div className="mt-12 grid gap-5 md:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Saved stories</p><p className="mt-4 font-display text-3xl">00</p><p className="mt-1 text-xs text-muted-foreground">Your personal shelf</p></div><div className="rounded-2xl border border-border bg-card p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Reading time</p><p className="mt-4 font-display text-3xl">0h</p><p className="mt-1 text-xs text-muted-foreground">A blank page is also a beginning</p></div><div className="rounded-2xl border border-border bg-accent p-5 text-accent-foreground"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] opacity-65">Shelf note</p><p className="mt-4 font-display text-xl leading-tight">“Read what asks for your attention.”</p><p className="mt-3 text-xs opacity-65">— BABEL</p></div></div>
    </div>
  );
}

function NovelPage() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const [reading, setReading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  if (params.id !== featuredNovel.id) return <NotFound />;
  if (reading) {
    return (
      <div className="page-enter mx-auto max-w-[780px] px-5 py-8 md:px-10 md:py-14">
        <button onClick={() => setReading(false)} className="mb-14 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground" data-testid="button-close-reader"><ArrowLeft size={15} /> Back to details</button>
        <div className="mb-14 border-b border-border pb-8"><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-accent">Chapter one · 12 min</p><h1 className="mt-4 font-display text-5xl leading-none tracking-[-.04em] md:text-6xl" data-testid="heading-reading-chapter">The Hour Between</h1><p className="mt-4 text-sm text-muted-foreground">The Atlas of Small Hours · Mira Voss</p></div>
        <article className="reading-rule font-display text-xl leading-[1.85] text-foreground/90 md:text-2xl"><p>At 12:07 every night, the city forgot one small thing.</p><p className="mt-8">Not always the same thing. A doorstep. The name of a street. The exact sound of a person’s laugh. By morning, the absence had folded itself so neatly into the day that no one thought to look for it.</p><p className="mt-8">Mara kept a pencil for these omissions. She drew them in the margins of the atlas, where the dark was wide enough to hold a secret.</p></article>
        <div className="mt-16 flex items-center justify-between border-t border-border pt-5"><span className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">12% complete</span><button onClick={() => setBookmarked(!bookmarked)} className={`inline-flex items-center gap-2 text-xs font-semibold ${bookmarked ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`} data-testid="button-reader-bookmark"><Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />{bookmarked ? 'Bookmarked' : 'Save passage'}</button></div>
      </div>
    );
  }
  return (
    <div className="page-enter mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-14">
      <button onClick={() => setLocation('/discover')} className="mb-12 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground" data-testid="button-back-discover"><ArrowLeft size={15} /> Back to discover</button>
      <div className="grid gap-10 md:grid-cols-[270px_1fr] md:gap-16">
        <Cover novel={featuredNovel} size="lg" />
        <div className="max-w-2xl pt-1"><div className="flex flex-wrap gap-2">{featuredNovel.genres.map((genre) => <span key={genre} className="rounded-full bg-muted px-3 py-1 font-mono-ui text-[10px] uppercase tracking-[.1em] text-muted-foreground">{genre}</span>)}</div><h1 className="mt-5 font-display text-5xl leading-[.96] tracking-[-.045em] md:text-7xl" data-testid="heading-novel-title">{featuredNovel.title}</h1><p className="mt-4 text-sm text-muted-foreground">by <span className="text-foreground">{featuredNovel.author}</span></p><p className="mt-8 max-w-xl text-base leading-7 text-muted-foreground">{featuredNovel.description}</p><div className="mt-9 flex flex-wrap gap-3"><button onClick={() => setReading(true)} className="inline-flex items-center gap-2 rounded-lg bg-sidebar px-5 py-3 text-xs font-semibold text-sidebar-foreground hover:opacity-90" data-testid="button-start-reading">Start reading <ArrowRight size={15} /></button><button onClick={() => setBookmarked(!bookmarked)} className={`inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-xs font-semibold hover:bg-muted ${bookmarked ? 'text-accent' : ''}`} data-testid="button-bookmark-novel"><Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />{bookmarked ? 'Saved' : 'Bookmark'}</button></div><p className="mt-8 font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">2 published chapters · 28 min total</p></div>
      </div>
      <section className="mt-20 max-w-3xl border-t border-border pt-8"><div className="mb-5 flex items-center justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">Inside the book</p><h2 className="mt-2 font-display text-3xl">Chapters</h2></div><span className="font-mono-ui text-[10px] text-muted-foreground">{featuredNovel.chapters.length} listed</span></div><div className="divide-y divide-border">{featuredNovel.chapters.map((chapter, index) => <div key={chapter.id} className={`flex items-center gap-4 py-5 ${!chapter.published ? 'opacity-45' : ''}`} data-testid={`row-chapter-${chapter.id}`}><span className="font-mono-ui text-[10px] text-muted-foreground">0{index + 1}</span><div className="flex-1"><p className="text-sm font-medium">{chapter.title}</p><p className="mt-1 font-mono-ui text-[10px] text-muted-foreground">{chapter.published ? `${chapter.minutes} min read` : 'Coming soon'}</p></div>{chapter.published && <button onClick={() => setReading(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid={`button-open-chapter-${chapter.id}`} aria-label={`Read ${chapter.title}`}><ArrowRight size={16} /></button>}</div>)}</div></section>
    </div>
  );
}

type DraftChapter = { id: number; title: string; status: 'Draft' | 'Published'; };

function PublisherPage() {
  const [view, setView] = useState<'overview' | 'new'>('overview');
  const [sortNewest, setSortNewest] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [pdfImported, setPdfImported] = useState(false);
  const [coverAdded, setCoverAdded] = useState(false);
  const [chapters, setChapters] = useState<DraftChapter[]>([{ id: 1, title: 'First light', status: 'Draft' }]);
  const [newChapter, setNewChapter] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const toggleGenre = (genre: Genre) => setSelectedGenres((current) => current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre]);
  const addChapter = () => { if (!newChapter.trim()) return; setChapters((current) => [...current, { id: Date.now(), title: newChapter.trim(), status: 'Draft' }]); setNewChapter(''); };
  const deleteChapter = (id: number) => setChapters((current) => current.filter((chapter) => chapter.id !== id));

  if (view === 'new') {
    return (
      <div className="page-enter mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-14">
        <button onClick={() => setView('overview')} className="mb-10 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground" data-testid="button-back-publisher"><ArrowLeft size={15} /> Publisher desk</button>
        <PageHeader eyebrow="New manuscript" title="Make room for a story." description="A quiet workspace for the details that help a reader choose what to open next." action={<button onClick={() => setView('overview')} className="rounded-lg bg-sidebar px-4 py-2.5 text-xs font-semibold text-sidebar-foreground" data-testid="button-save-novel">Save as draft</button>} />
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="mb-7 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-mono-ui text-xs">01</span><div><h2 className="font-display text-xl">The essentials</h2><p className="text-xs text-muted-foreground">Give the story a name and a way in.</p></div></div><div className="space-y-5"><label className="block"><span className="mb-2 block text-xs font-semibold">Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="The name readers will remember" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="input-novel-title" /></label><label className="block"><span className="mb-2 block text-xs font-semibold">Author</span><input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Your name or pen name" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="input-novel-author" /></label><label className="block"><span className="mb-2 block text-xs font-semibold">Description <span className="font-normal text-muted-foreground">(optional)</span></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A short invitation to the world inside..." rows={4} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-accent" data-testid="textarea-novel-description" /></label></div></section>
            <section className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="mb-6 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-mono-ui text-xs">02</span><div><h2 className="font-display text-xl">A little context</h2><p className="text-xs text-muted-foreground">Help the right readers find it.</p></div></div><div className="flex flex-wrap gap-2">{genres.filter((item): item is Genre => item !== 'All').map((genre) => <button key={genre} onClick={() => toggleGenre(genre)} className={`rounded-full border px-3 py-2 text-xs transition-colors ${selectedGenres.includes(genre) ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-muted'}`} data-testid={`button-genre-${genre.toLowerCase().replaceAll(' ', '-')}`}>{selectedGenres.includes(genre) && <Check className="mr-1 inline" size={13} />}{genre}</button>)}</div></section>
            <section className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-mono-ui text-xs">03</span><div><h2 className="font-display text-xl">Chapters</h2><p className="text-xs text-muted-foreground">Add the shape of your manuscript.</p></div></div><span className="font-mono-ui text-[10px] text-muted-foreground">{chapters.length} total</span></div><div className="divide-y divide-border">{chapters.map((chapter, index) => <div className="flex items-center gap-3 py-3" key={chapter.id} data-testid={`row-draft-chapter-${chapter.id}`}><span className="font-mono-ui text-[10px] text-muted-foreground">0{index + 1}</span>{editingId === chapter.id ? <input autoFocus defaultValue={chapter.title} onBlur={(event) => { setChapters((current) => current.map((item) => item.id === chapter.id ? { ...item, title: event.target.value || item.title } : item)); setEditingId(null); }} className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none focus:border-accent" data-testid={`input-edit-chapter-${chapter.id}`} /> : <span className="flex-1 text-sm">{chapter.title}</span>}<span className="rounded-full bg-muted px-2 py-1 font-mono-ui text-[9px] text-muted-foreground">{chapter.status}</span><button onClick={() => setEditingId(chapter.id)} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid={`button-edit-chapter-${chapter.id}`} aria-label="Edit chapter"><Pencil size={14} /></button><button onClick={() => deleteChapter(chapter.id)} className="rounded-md p-2 text-muted-foreground hover:bg-red-50 hover:text-destructive dark:hover:bg-red-950/30" data-testid={`button-delete-chapter-${chapter.id}`} aria-label="Delete chapter"><Trash2 size={14} /></button></div>)}</div><div className="mt-4 flex gap-2"><input value={newChapter} onChange={(event) => setNewChapter(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addChapter()} placeholder="Chapter title" className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="input-new-chapter" /><button onClick={addChapter} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted" data-testid="button-add-chapter"><Plus size={14} /> Add</button></div></section>
          </div>
          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl">Cover</h2><span className="font-mono-ui text-[10px] text-muted-foreground">Optional</span></div><button onClick={() => setCoverAdded(!coverAdded)} className="flex min-h-[180px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 text-center hover:border-accent" data-testid="button-upload-cover">{coverAdded ? <><Check className="mb-3 text-accent" size={22} /><span className="text-xs font-semibold">Cover placeholder added</span><span className="mt-1 text-[11px] text-muted-foreground">Click to replace</span></> : <><Upload className="mb-3 text-muted-foreground" size={22} /><span className="text-xs font-semibold">Upload cover</span><span className="mt-1 text-[11px] text-muted-foreground">JPG or PNG · 1600 × 2400 recommended</span></>}</button></section>
            <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl">Manuscript</h2><FileEdit className="text-muted-foreground" size={17} /></div><button onClick={() => setPdfImported(!pdfImported)} className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left hover:bg-muted" data-testid="button-import-pdf"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-accent"><Upload size={16} /></span><span className="flex-1"><span className="block text-xs font-semibold">{pdfImported ? 'PDF ready to review' : 'Import a PDF'}</span><span className="mt-1 block text-[11px] text-muted-foreground">{pdfImported ? 'manuscript-draft.pdf' : 'Placeholder for your source file'}</span></span>{pdfImported && <Check size={15} className="text-accent" />}</button><div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-[11px] leading-5 text-muted-foreground"><CircleHelp size={14} className="mt-0.5 shrink-0" />PDF processing will be connected when publishing tools are ready.</div></section>
            <div className="rounded-2xl border border-accent/25 bg-accent/10 p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-accent">Draft preview</p><p className="mt-3 font-display text-xl">{title || 'Untitled story'}</p><p className="mt-1 text-xs text-muted-foreground">{author || 'No author yet'} · {selectedGenres.length ? selectedGenres.join(', ') : 'No genres selected'}</p></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-14">
      <PageHeader eyebrow="Publisher desk" title="Your writing room." description="Shape a story, keep an eye on its chapters, and decide when it is ready for a reader." action={<button onClick={() => setView('new')} className="inline-flex items-center gap-2 rounded-lg bg-sidebar px-4 py-2.5 text-xs font-semibold text-sidebar-foreground" data-testid="button-add-novel"><Plus size={15} /> Add a novel</button>} />
      <div className="grid gap-5 md:grid-cols-3"><div className="rounded-2xl bg-sidebar p-5 text-sidebar-foreground"><div className="flex items-center justify-between"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] opacity-55">Published</p><BookOpen size={17} className="opacity-55" /></div><p className="mt-7 font-display text-4xl">01</p><p className="mt-1 text-xs opacity-55">story on the shelf</p></div><div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">Drafts</p><FileEdit size={17} className="text-accent" /></div><p className="mt-7 font-display text-4xl">00</p><p className="mt-1 text-xs text-muted-foreground">waiting in the wings</p></div><div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">Readers</p><Sparkles size={17} className="text-accent" /></div><p className="mt-7 font-display text-4xl">—</p><p className="mt-1 text-xs text-muted-foreground">quietly gathering</p></div></div>
      <section className="mt-12"><div className="mb-5 flex items-center justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">Your catalogue</p><h2 className="mt-2 font-display text-2xl">Published & drafts</h2></div><button onClick={() => setSortNewest(!sortNewest)} className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground" data-testid="button-sort-publisher">{sortNewest ? 'Recently updated' : 'Oldest first'} <ChevronDown size={14} /></button></div><div className="overflow-visible rounded-2xl border border-border bg-card"><div className="relative flex items-center gap-4 p-4 md:p-5"><Cover novel={featuredNovel} size="sm" /><div className="min-w-0 flex-1"><p className="font-display text-xl">{featuredNovel.title}</p><p className="mt-1 text-xs text-muted-foreground">{featuredNovel.author} · 2 published chapters</p><div className="mt-3 flex items-center gap-2"><span className="rounded-full bg-accent/10 px-2 py-1 font-mono-ui text-[9px] uppercase tracking-[.1em] text-accent">Published</span><span className="text-[11px] text-muted-foreground">Updated today</span></div></div><button onClick={() => setMoreOpen(!moreOpen)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid="button-more-novel" aria-label="More novel actions"><MoreHorizontal size={18} /></button>{moreOpen && <div className="absolute right-4 top-14 z-10 w-36 rounded-xl border border-border bg-popover p-1 shadow-[var(--shadow-card)]"><button onClick={() => { setMoreOpen(false); setView('new'); }} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-muted" data-testid="button-edit-published-novel">Edit details</button><button onClick={() => setMoreOpen(false)} className="w-full rounded-lg px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted" data-testid="button-close-novel-menu">Close menu</button></div>}</div></div><div className="mt-4"><EmptyState icon={FilePlus2} title="No drafts yet" copy="Start a new manuscript when an idea begins asking for a shape." action={<button onClick={() => setView('new')} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:bg-muted" data-testid="button-create-first-draft"><Plus size={14} /> Create a draft</button>} /></div></section>
    </div>
  );
}

function SettingsPage({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  const [fontSize, setFontSize] = useState('Medium');
  const [spacing, setSpacing] = useState('Comfortable');
  const [showProgress, setShowProgress] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [accountNotice, setAccountNotice] = useState(false);
  const control = (label: string, value: string, onChange: (value: string) => void, options: string[]) => <div className="flex flex-wrap gap-2">{options.map((option) => <button key={option} onClick={() => onChange(option)} className={`rounded-lg border px-3 py-2 text-xs ${value === option ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:bg-muted'}`} data-testid={`button-${label.toLowerCase().replaceAll(' ', '-')}-${option.toLowerCase()}`}>{value === option && <Check className="mr-1 inline" size={13} />}{option}</button>)}</div>;
  return (
    <div className="page-enter mx-auto max-w-[1000px] px-5 py-9 md:px-10 md:py-14">
      <PageHeader eyebrow="Preferences" title="Make it yours." description="A few small choices can make a reading room feel like your own." />
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="mb-7"><h2 className="font-display text-2xl">Appearance</h2><p className="mt-1 text-xs text-muted-foreground">Choose the atmosphere you return to.</p></div><div className="grid gap-3 sm:grid-cols-2"><button onClick={() => setTheme('light')} className={`relative rounded-xl border p-4 text-left ${theme === 'light' ? 'border-accent ring-1 ring-accent' : 'border-border hover:bg-muted'}`} data-testid="button-theme-light"><div className="mb-4 h-16 rounded-lg border border-[#e3dccd] bg-[#f6f0e4] p-3"><div className="h-2 w-14 rounded bg-[#252b4a]" /><div className="mt-2 h-1.5 w-20 rounded bg-[#cfc6b4]" /><div className="mt-1 h-1.5 w-12 rounded bg-[#cfc6b4]" /></div><span className="text-xs font-semibold">Daylight</span>{theme === 'light' && <Check className="absolute right-4 top-4 text-accent" size={15} />}</button><button onClick={() => setTheme('dark')} className={`relative rounded-xl border p-4 text-left ${theme === 'dark' ? 'border-accent ring-1 ring-accent' : 'border-border hover:bg-muted'}`} data-testid="button-theme-dark"><div className="mb-4 h-16 rounded-lg border border-[#32364c] bg-[#191d2d] p-3"><div className="h-2 w-14 rounded bg-[#f0e9db]" /><div className="mt-2 h-1.5 w-20 rounded bg-[#5d6274]" /><div className="mt-1 h-1.5 w-12 rounded bg-[#5d6274]" /></div><span className="text-xs font-semibold">After hours</span>{theme === 'dark' && <Check className="absolute right-4 top-4 text-accent" size={15} />}</button></div></section>
          <section className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="mb-7"><h2 className="font-display text-2xl">Reading preferences</h2><p className="mt-1 text-xs text-muted-foreground">Tune the page for the way your eyes like to wander.</p></div><div className="space-y-7"><div><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold">Font size</span><span className="font-mono-ui text-[10px] text-muted-foreground">{fontSize}</span></div>{control('font-size', fontSize, setFontSize, ['Small', 'Medium', 'Large', 'Extra large'])}</div><div><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold">Text spacing</span><span className="font-mono-ui text-[10px] text-muted-foreground">{spacing}</span></div>{control('text-spacing', spacing, setSpacing, ['Compact', 'Comfortable', 'Spacious'])}</div></div></section>
          <section className="rounded-2xl border border-border bg-card p-5 md:p-7"><div className="mb-5"><h2 className="font-display text-2xl">Interface</h2><p className="mt-1 text-xs text-muted-foreground">A couple of gentle signals, never more than you need.</p></div><div className="divide-y divide-border"><button onClick={() => setShowProgress(!showProgress)} className="flex w-full items-center justify-between py-4 text-left" data-testid="button-toggle-progress"><span><span className="block text-xs font-semibold">Show reading progress</span><span className="mt-1 block text-[11px] text-muted-foreground">Keep a small marker at the foot of each chapter.</span></span><span className={`flex h-6 w-10 items-center rounded-full p-1 transition-colors ${showProgress ? 'bg-accent' : 'bg-muted'}`}><span className={`h-4 w-4 rounded-full bg-white transition-transform ${showProgress ? 'translate-x-4' : ''}`} /></span></button><button onClick={() => setFocusMode(!focusMode)} className="flex w-full items-center justify-between py-4 text-left" data-testid="button-toggle-focus"><span><span className="block text-xs font-semibold">Focus mode by default</span><span className="mt-1 block text-[11px] text-muted-foreground">Hide surrounding navigation when a chapter opens.</span></span><span className={`flex h-6 w-10 items-center rounded-full p-1 transition-colors ${focusMode ? 'bg-accent' : 'bg-muted'}`}><span className={`h-4 w-4 rounded-full bg-white transition-transform ${focusMode ? 'translate-x-4' : ''}`} /></span></button></div></section>
        </div>
        <aside className="space-y-5"><div className="rounded-2xl border border-border bg-accent p-5 text-accent-foreground"><Sun size={18} /><p className="mt-8 font-display text-2xl leading-tight">Your reading room should feel like somewhere you want to stay.</p><p className="mt-3 text-xs leading-5 opacity-70">These preferences stay on this device.</p></div><div className="rounded-2xl border border-border bg-card p-5"><h3 className="font-display text-lg">Account</h3><div className="mt-5 space-y-4 text-xs"><div><p className="text-muted-foreground">Signed in as</p><p className="mt-1 font-medium">Reader account</p></div><button onClick={() => setAccountNotice(!accountNotice)} className="w-full rounded-lg border border-border px-3 py-2.5 text-left text-muted-foreground hover:bg-muted" data-testid="button-account-settings">Account settings <ArrowRight className="float-right" size={14} /></button>{accountNotice && <p className="rounded-lg bg-muted p-3 text-[11px] leading-5 text-muted-foreground">Account management will be available when BABEL adds sign-in.</p>}</div></div><div className="rounded-2xl border border-dashed border-border p-5"><div className="flex items-center gap-2 text-muted-foreground"><Moon size={16} /><span className="font-mono-ui text-[10px] uppercase tracking-[.14em]">More to come</span></div><p className="mt-3 text-xs leading-5 text-muted-foreground">Custom typefaces, reading themes, and more ways to make the page yours will live here.</p></div></aside>
      </div>
    </div>
  );
}

function NotFound() {
  return <div className="flex min-h-[80dvh] flex-col items-center justify-center px-5 text-center"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-accent">404 · off the shelf</p><h1 className="mt-4 font-display text-5xl">This page is still being written.</h1><p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">The story you are looking for is not in this catalogue.</p><Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-sidebar px-4 py-2.5 text-xs font-semibold text-sidebar-foreground" data-testid="link-not-found-home">Return home <ArrowRight size={14} /></Link></div>;
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
          <Route path="/publisher" component={PublisherPage} />
          <Route path="/settings"><SettingsPage theme={theme} setTheme={setTheme} /></Route>
          <Route path="/novel/:id" component={NovelPage} />
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
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('babel-theme', theme);
  }, [theme]);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router theme={theme} setTheme={setTheme} />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;