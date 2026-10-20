import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primario" | "secundario" | "fantasma" | "perigo" | "sucesso";

const styles: Record<Variant, string> = {
  primario:
    "bg-latao text-carvao font-semibold hover:bg-latao-claro disabled:bg-cinza-escuro disabled:text-pergaminho/60",
  secundario:
    "border border-latao/40 text-pergaminho hover:bg-latao/10 disabled:opacity-50",
  fantasma: "text-cinza hover:text-pergaminho hover:bg-white/5 disabled:opacity-50",
  perigo: "border border-alerta/50 text-alerta-claro hover:bg-alerta/15 disabled:opacity-50",
  sucesso: "bg-petroleo text-pergaminho hover:bg-petroleo-claro disabled:opacity-50",
};

export function Button({
  variant = "secundario",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm transition-colors disabled:cursor-not-allowed",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
