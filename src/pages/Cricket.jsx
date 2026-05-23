import { useEffect, useState, useCallback, useMemo } from 'react';
import PageHeader from '../components/PageHeader.jsx';

// Uses CricAPI (https://cricapi.com). Free tier: 100 requests/day.
// 1. Sign up and copy your API key.
// 2. Create life-manager/.env with:
//      VITE_CRICAPI_KEY=your_key_here
// 3. Restart `npm run dev`.

const API_KEY = import.meta.env.VITE_CRICAPI_KEY;

// /matches gives upcoming + live + recent (broader than /currentMatches,
// which only includes matches happening right now).
const ENDPOINT = `https://api.cricapi.com/v1/matches?apikey=${API_KEY}&offset=0`;

export default function Cricket() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [filter, setFilter] = useState('relevant'); // relevant | india | ipl | all
  const [includeWomens, setIncludeWomens] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!API_KEY) {
      setError(
        'No CricAPI key configured. Add VITE_CRICAPI_KEY to your .env file ' +
        '(get a free key at cricapi.com) and restart npm run dev.'
      );
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

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

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
        title="Live Cricket Scores"
        subtitle="India and IPL matches via CricAPI."
        action={
          <button
            onClick={fetchMatches}
            disabled={loading}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white hover:border-slate-400 disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-3 text-sm items-center">
        {[
          ['relevant', `India + IPL${API_KEY ? ` (${counts.india + counts.ipl})` : ''}`],
          ['india', `India only${API_KEY ? ` (${counts.india})` : ''}`],
          ['ipl', `IPL only${API_KEY ? ` (${counts.ipl})` : ''}`],
          ['all', `All matches${API_KEY ? ` (${counts.total})` : ''}`],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={
              'px-3 py-1.5 rounded-full border ' +
              (filter === v
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400')
            }
          >
            {l}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-600 mb-4">
        <input
          type="checkbox"
          checked={includeWomens}
          onChange={(e) => setIncludeWomens(e.target.checked)}
          className="h-3.5 w-3.5 accent-brand-500"
        />
        Include women's matches in India filter
      </label>

      {!API_KEY && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-900">
          <div className="font-medium mb-1">Set up your CricAPI key</div>
          <ol className="list-decimal pl-5 space-y-0.5">
            <li>Sign up at <a className="underline" href="https://cricapi.com" target="_blank" rel="noreferrer">cricapi.com</a> (free tier, 100 reqs/day).</li>
            <li>Create a file <code>life-manager/.env</code> with: <code>VITE_CRICAPI_KEY=your_key_here</code></li>
            <li>Restart <code>npm run dev</code>.</li>
          </ol>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-4 text-sm">
          {error}
        </div>
      )}

      {loading && matches.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : filtered.length === 0 && !error ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          {!API_KEY ? (
            <div className="text-slate-500">Configure your API key above to see live scores.</div>
          ) : counts.total === 0 ? (
            <div className="text-slate-500">CricAPI returned no matches right now. Try Refresh in a bit.</div>
          ) : (
            <div className="space-y-2">
              <div className="text-slate-700 font-medium">
                No matches for this filter, but CricAPI returned {counts.total} match(es) overall.
              </div>
              <div className="text-sm text-slate-500">
                There may be no live India or IPL games at the moment.
              </div>
              <button
                onClick={() => setFilter('all')}
                className="mt-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm"
              >
                Show all matches ({counts.total})
              </button>
            </div>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </ul>
      )}

      {fetchedAt && (
        <div className="text-xs text-slate-400 mt-4">
          Last updated {fetchedAt.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }) {
  const live = match.matchStarted && !match.matchEnded;
  const tone =
    live ? 'bg-emerald-100 text-emerald-700' :
    match.matchEnded ? 'bg-slate-100 text-slate-600' :
    'bg-amber-100 text-amber-700';
  const tag = live ? 'LIVE' : match.matchEnded ? 'Ended' : 'Upcoming';
  return (
    <li className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + tone}>{tag}</span>
            {match.matchType && (
              <span className="text-xs text-slate-500">{String(match.matchType).toUpperCase()}</span>
            )}
            {match.series && (
              <span className="text-xs text-slate-500 truncate">· {match.series}</span>
            )}
          </div>
          <div className="font-medium text-slate-900">{match.name}</div>
          {Array.isArray(match.score) && match.score.length > 0 && (
            <ul className="text-sm text-slate-700 mt-2 space-y-0.5">
              {match.score.map((s, i) => (
                <li key={i}>
                  <span className="font-medium">{s.inning}:</span>{' '}
                  {s.r}/{s.w} ({s.o} overs)
                </li>
              ))}
            </ul>
          )}
          {match.venue && (
            <div className="text-xs text-slate-500 mt-2">{match.venue}</div>
          )}
          {match.date && !live && (
            <div className="text-xs text-slate-500 mt-1">
              {new Date(match.dateTimeGMT || match.date).toLocaleString()}
            </div>
          )}
          {match.status && (
            <div className="text-xs text-slate-600 mt-1 italic">{match.status}</div>
          )}
        </div>
      </div>
    </li>
  );
}
