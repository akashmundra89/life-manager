import { useEffect, useState, useCallback } from 'react';
import PageHeader from '../components/PageHeader.jsx';

// Free Google News India RSS feed served as JSON via rss2json.com.
// No API key needed for low traffic.
const FEED_URL =
  'https://api.rss2json.com/v1/api.json?rss_url=' +
  encodeURIComponent('https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en');

export default function News() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(FEED_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status !== 'ok' || !Array.isArray(data.items)) {
        throw new Error(data.message || 'Bad response from feed');
      }
      setItems(data.items.slice(0, 5));
      setFetchedAt(new Date());
    } catch (e) {
      setError(e.message || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return (
    <div>
      <PageHeader
        title="Top India Headlines"
        subtitle="Top 5 stories from Google News India · updates on refresh."
        action={
          <button
            onClick={fetchNews}
            disabled={loading}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white hover:border-slate-400 disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-4 text-sm">
          Couldn't load headlines: {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 && !error ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-500">
          No headlines available.
        </div>
      ) : (
        <ol className="space-y-3">
          {items.map((item, idx) => {
            const src = extractSource(item.title);
            const cleanTitle = stripSource(item.title);
            return (
              <li key={item.link || idx}>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-500 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl font-semibold text-brand-500 leading-none">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900">{cleanTitle}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {src && <span>{src} · </span>}
                        {item.pubDate && <span>{formatRelative(item.pubDate)}</span>}
                      </div>
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ol>
      )}

      {fetchedAt && (
        <div className="text-xs text-slate-400 mt-4">
          Last updated {fetchedAt.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

// Google News titles usually look like "Some headline - Source Name".
function extractSource(title) {
  if (!title) return '';
  const idx = title.lastIndexOf(' - ');
  return idx > 0 ? title.slice(idx + 3).trim() : '';
}

function stripSource(title) {
  if (!title) return '';
  const idx = title.lastIndexOf(' - ');
  return idx > 0 ? title.slice(0, idx).trim() : title;
}

function formatRelative(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
