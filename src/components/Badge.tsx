import { cn } from "@/lib/cn";

const tones: Record<string, string> = {
  latiao: "bg-latao/15 text-latao-claro border-latao/30",
  petroleo: "bg-petroleo/15 text-petroleo-claro border-petroleo/40",
  alerta: "bg-alerta/15 text-alerta-claro border-alerta/40",
  neutro: "bg-white/5 text-cinza border-white/10",
};

export function Badge({
  children,
  tone = "neutro",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones | "latiao";
  className?: string;
}) {
  const key = tone === "latiao" ? "latiao" : tone;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tones[key] ?? tones.neutro,
        className,
      )}
    >
      {children}
    </span>
  );
}
