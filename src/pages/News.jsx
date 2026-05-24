import { useEffect, useState, useCallback } from 'react';
import { Newspaper, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { Card, Button, EmptyState } from '../components/ui';
import { SkeletonRow } from '../components/ui/Skeleton.jsx';
import { cx } from '../lib/cx.js';

// Free Google News India RSS feed served as JSON via rss2json.com.
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
      setItems(data.items.slice(0, 8));
      setFetchedAt(new Date());
    } catch (e) {
      setError(e.message || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  return (
    <div>
      <PageHeader
        icon={<Newspaper className="w-5 h-5" />}
        title="India headlines"
        subtitle="Top stories from Google News India · updates on refresh."
        action={
          <Button variant="secondary" size="sm" onClick={fetchNews} disabled={loading}>
            <RefreshCw className={cx('w-4 h-4', loading && 'animate-spin')} />
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        }
      />

      {error && (
        <Card className="mb-4 ring-1 ring-rose-500/30 animate-fade-up" hover={false}>
          <div className="flex items-start gap-3 text-sm">
            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-ink">Couldn't load headlines</div>
              <div className="text-ink-muted mt-0.5">{error}</div>
            </div>
          </div>
        </Card>
      )}

      {loading && items.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} hover={false}>
              <SkeletonRow />
            </Card>
          ))}
        </div>
      ) : items.length === 0 && !error ? (
        <EmptyState icon={<Newspaper className="w-5 h-5" />} title="No headlines available" hint="Try refresh." />
      ) : (
        <ol className="space-y-3">
          {items.map((item, idx) => {
            const src = extractSource(item.title);
            const cleanTitle = stripSource(item.title);
            return (
              <li key={item.link || idx} className="animate-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
                <Card
                  href={item.link}
                  hover={true}
                  className="group block"
                  {...{ target: '_blank', rel: 'noreferrer' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid place-items-center w-9 h-9 rounded-xl bg-grad-brand-soft text-brand-600 dark:text-brand-300 font-bold text-sm shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
                        {cleanTitle}
                      </div>
                      <div className="text-xs text-ink-faint mt-1 flex items-center gap-1.5 flex-wrap">
                        {src && <span className="font-medium">{src}</span>}
                        {src && item.pubDate && <span>·</span>}
                        {item.pubDate && <span>{formatRelative(item.pubDate)}</span>}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      )}

      {fetchedAt && (
        <div className="text-xs text-ink-faint mt-4 text-center">
          Last updated {fetchedAt.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

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
