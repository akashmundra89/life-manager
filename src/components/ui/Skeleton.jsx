import { cx } from '../../lib/cx.js';

/** Shimmer-loading placeholder. */
export default function Skeleton({ className = '', rounded = 'rounded-lg' }) {
  return (
    <div
      className={cx(
        'animate-shimmer bg-[length:200%_100%]',
        'bg-gradient-to-r from-edge/5 via-edge/15 to-edge/5',
        'dark:from-white/5 dark:via-white/10 dark:to-white/5',
        rounded,
        className,
      )}
    />
  );
}

export function SkeletonRow({ className = '' }) {
  return (
    <div className={cx('flex items-center gap-3 py-2', className)}>
      <Skeleton className="w-8 h-8" rounded="rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2 w-1/2" />
      </div>
    </div>
  );
}
