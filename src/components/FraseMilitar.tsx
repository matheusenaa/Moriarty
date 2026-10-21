import { cn } from "@/lib/cn";
import { classeTema, fraseDoDia, identificarConcurso } from "@/lib/temas";

/**
 * Linha de motivação no rodapé de páginas de estudo. Frase genérica de
 * motivação (não é lema oficial de corporação), alternada por dia.
 */
export function FraseMilitar({
  slug = "",
  className,
}: {
  slug?: string;
  className?: string;
}) {
  const id = identificarConcurso(slug);
  const frase = fraseDoDia(id, slug);
  if (!frase) return null;
  return (
    <p
      className={cn(
        classeTema(id),
        "mt-8 border-t border-white/5 pt-4 text-center text-xs italic text-cinza-escuro",
        className,
      )}
    >
      <span className="text-latao/50">“</span>
      {frase}
      <span className="text-latao/50">”</span>
    </p>
  );
}
