import { cx } from '../../lib/cx.js';

/**
 * Conic-style progress ring. SVG-based so it animates and theme-adapts cleanly.
 *   <ProgressRing value={75} size={64} />
 */
export default function ProgressRing({
  value = 0,           // 0..100
  size = 64,
  stroke = 6,
  showLabel = true,
  className = '',
  gradientId = 'pr-grad-default',
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;

  return (
    <div className={cx('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b6dff" />
            <stop offset="100%" stopColor="#9b6bff" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-edge-strong/30"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - dash}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 grid place-items-center text-sm font-bold text-ink">
          {v}%
        </div>
      )}
    </div>
  );
}
