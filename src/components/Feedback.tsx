import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "cartao flex flex-col items-center justify-center gap-2 px-6 py-12 text-center",
        className,
      )}
    >
      <span aria-hidden className="text-3xl text-latao/60">
        ⌖
      </span>
      <h3 className="font-titulo text-lg text-pergaminho">{title}</h3>
      <p className="max-w-md text-sm text-cinza">{description}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({ pct, label }: { pct: number; label?: string }) {
  const safe = Math.max(0, Math.min(100, pct));
  return (
    <div>
      {label ? (
        <div className="mb-1 flex justify-between text-xs text-cinza">
          <span>{label}</span>
          <span>{Math.round(safe)}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={Math.round(safe)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progresso"}
        className="h-2 w-full overflow-hidden rounded-full bg-white/8"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-latao to-latao-claro transition-[width] duration-500"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}
