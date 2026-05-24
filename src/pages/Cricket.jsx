import { useEffect, useState, useCallback, useMemo } from 'react';
import { Trophy, RefreshCw, AlertCircle, MapPin, Radio, Info } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { Card, CardHeader, Badge, Button, EmptyState } from '../components/ui';
import { cx } from '../lib/cx.js';

const API_KEY = import.meta.env.VITE_CRICAPI_KEY;
const ENDPOINT = `https://api.cricapi.com/v1/matches?apikey=${API_KEY}&offset=0`;

export default function Cricket() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [filter, setFilter] = useState('relevant');
  const [includeWomens, setIncludeWomens] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!API_KEY) {
      setError('No CricAPI key configured. Add VITE_CRICAPI_KEY to your .env file (get a free key at cricapi.com) and restart npm run dev.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINT);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status !== 'success' || !Array.isArray(data.data)) {
        throw new Error(data.reason || data.message || 'Bad response from CricAPI');
      }
      setMatches(data.data);
      setFetchedAt(new Date());
    } catch (e) {
      setError(e.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const isIPL = (m) => {
    const hay = [m.name, m.series, m.matchType].filter(Boolean).join(' ').toLowerCase();
    return /\bipl\b|indian premier league/.test(hay);
  };

  const isIndia = (m) => {
    const teams = (Array.isArray(m.teams) ? m.teams.join(' ') : '') + ' ' + (m.name || '');
    const hasIndia = /\bindia\b/i.test(teams);
    if (!hasIndia) return false;
    if (includeWomens) return true;
    const isWomen = /women|w\)|\bw\s|women's/i.test(`${m.name || ''} ${m.matchType || ''}`);
    return !isWomen;
  };

  const counts = useMemo(() => ({
    total: matches.length,
    india: matches.filter(isIndia).length,
    ipl: matches.filter(isIPL).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [matches, includeWomens]);

  const filtered = useMemo(() => {
    if (filter === 'india') return matches.filter(isIndia);
    if (filter === 'ipl') return matches.filter(isIPL);
    if (filter === 'all') return matches;
    return matches.filter((m) => isIndia(m) || isIPL(m));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, filter, includeWomens]);

  return (
    <div>
      <PageHeader
        icon={<Trophy className="w-5 h-5" />}
        title="Cricket scores"
        subtitle="India and IPL matches via CricAPI."
        action={
          <Button variant="secondary" size="sm" onClick={fetchMatches} disabled={loading}>
            <RefreshCw className={cx('w-4 h-4', loading && 'animate-spin')} />
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-3 animate-fade-up">
        {[
          ['relevant', `India + IPL`, API_KEY ? counts.india + counts.ipl : null],
          ['india', `India`, API_KEY ? counts.india : null],
          ['ipl', `IPL`, API_KEY ? counts.ipl : null],
          ['all', `All`, API_KEY ? counts.total : null],
        ].map(([v, l, n]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={cx(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all',
              filter === v
                ? 'bg-grad-brand text-white shadow-glow-brand'
                : 'glass glass-hover text-ink-muted hover:text-ink',
            )}
          >
            <span>{l}</span>
            {n != null && (
              <span className={cx(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                filter === v ? 'bg-white/20' : 'bg-surface-strong/70 text-ink-faint',
              )}>{n}</span>
            )}
          </button>
        ))}
      </div>

      <label className="inline-flex items-center gap-2 text-xs text-ink-muted mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={includeWomens}
          onChange={(e) => setIncludeWomens(e.target.checked)}
          className="h-3.5 w-3.5 accent-brand-500 rounded"
        />
        Include women's matches in India filter
      </label>

      {!API_KEY && (
        <Card className="mb-4 ring-1 ring-amber-500/30 animate-fade-up" hover={false}>
          <CardHeader
            icon={<Info className="w-4 h-4" />}
            iconTone="amber"
            title="Set up your CricAPI key"
            subtitle="Free tier: 100 requests/day."
          />
          <ol className="list-decimal pl-5 text-sm text-ink-muted space-y-1">
            <li>Sign up at <a className="text-brand-600 dark:text-brand-300 hover:underline" href="https://cricapi.com" target="_blank" rel="noreferrer">cricapi.com</a>.</li>
            <li>Create <code className="px-1 py-0.5 rounded bg-surface-strong/70 text-ink text-xs">life-manager/.env</code> with <code className="px-1 py-0.5 rounded bg-surface-strong/70 text-ink text-xs">VITE_CRICAPI_KEY=your_key</code>.</li>
            <li>Restart <code className="px-1 py-0.5 rounded bg-surface-strong/70 text-ink text-xs">npm run dev</code>.</li>
          </ol>
        </Card>
      )}

      {error && (
        <Card className="mb-4 ring-1 ring-rose-500/30 animate-fade-up" hover={false}>
          <div className="flex items-start gap-3 text-sm">
            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <div className="text-ink-muted">{error}</div>
          </div>
        </Card>
      )}

      {loading && matches.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} hover={false} className="h-28 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-edge/5 via-edge/15 to-edge/5 dark:from-white/5 dark:via-white/10 dark:to-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 && !error ? (
        !API_KEY ? null : counts.total === 0 ? (
          <EmptyState icon={<Trophy className="w-5 h-5" />} title="No matches right now" hint="CricAPI returned no matches. Try refresh in a bit." />
        ) : (
          <EmptyState
            icon={<Trophy className="w-5 h-5" />}
            title="No matches for this filter"
            hint={`CricAPI returned ${counts.total} match(es) overall — no India / IPL games at the moment.`}
            action={<Button variant="primary" onClick={() => setFilter('all')}>Show all matches ({counts.total})</Button>}
          />
        )
      ) : (
        <ul className="space-y-3">
          {filtered.map((m, idx) => (
            <li key={m.id} className="animate-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
              <MatchCard match={m} />
            </li>
          ))}
        </ul>
      )}

      {fetchedAt && (
        <div className="text-xs text-ink-faint mt-4 text-center">
          Last updated {fetchedAt.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }) {
  const live = match.matchStarted && !match.matchEnded;
  const tone = live ? 'emerald' : match.matchEnded ? 'slate' : 'amber';
  const tag = live ? 'LIVE' : match.matchEnded ? 'Ended' : 'Upcoming';
  const edge = live ? 'bg-emerald-500' : match.matchEnded ? 'bg-edge-strong/30' : 'bg-amber-500';
  return (
    <Card padded={false} hover={false} className="overflow-hidden">
      <div className="flex">
        <div className={cx('w-1 self-stretch shrink-0', edge)} />
        <div className="flex-1 p-4">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge tone={tone} size="sm">
              {live && <Radio className="w-3 h-3 animate-pulse" />}
              {tag}
            </Badge>
            {match.matchType && (
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-ink-faint">{String(match.matchType)}</span>
            )}
            {match.series && (
              <span className="text-xs text-ink-faint truncate">· {match.series}</span>
            )}
          </div>
          <div className="text-sm font-semibold text-ink">{match.name}</div>
          {Array.isArray(match.score) && match.score.length > 0 && (
            <ul className="text-sm text-ink-muted mt-2 space-y-0.5">
              {match.score.map((s, i) => (
                <li key={i} className="flex items-baseline gap-2">
                  <span className="font-semibold text-ink truncate">{s.inning}</span>
                  <span className="font-bold text-ink">{s.r}/{s.w}</span>
                  <span className="text-xs text-ink-faint">({s.o} ov)</span>
                </li>
              ))}
            </ul>
          )}
          {match.venue && (
            <div className="text-xs text-ink-faint mt-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {match.venue}
            </div>
          )}
          {match.date && !live && (
            <div className="text-xs text-ink-faint mt-1">
              {new Date(match.dateTimeGMT || match.date).toLocaleString()}
            </div>
          )}
          {match.status && (
            <div className="text-xs text-ink-muted mt-1.5 italic">{match.status}</div>
          )}
        </div>
      </div>
    </Card>
  );
}
