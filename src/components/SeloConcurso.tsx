import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { classeTema, identificarConcurso, type IdentidadeConcurso } from "@/lib/temas";

/**
 * Selo discreto de identificação do concurso. Usa apenas cor/acento e texto —
 * não reproduz símbolo, brasão ou marca institucional.
 */
export function SeloConcurso({
  slug,
  identidade,
  className,
}: {
  slug?: string;
  identidade?: IdentidadeConcurso;
  className?: string;
}) {
  const id = identidade ?? identificarConcurso(slug ?? "");
  return (
    <span className={cn(classeTema(id), "selo-concurso", className)} title={id.descricao}>
      <ShieldCheck aria-hidden size={11} />
      {id.sigla} · {id.rotulo}
    </span>
  );
}
