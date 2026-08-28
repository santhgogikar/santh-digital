export function BrandMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/mark.png" alt="" width={size} height={size} className={className} />
  );
}

export function BrandWordmark({ className = "h-14 w-auto sm:h-16" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/wordmark.png" alt="Santh Digital" className={className} />
  );
}

export function BrandLockup({ className = "h-14 w-auto" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/lockup.png" alt="Santh Digital" className={className} />
  );
}
