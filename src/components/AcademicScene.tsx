/**
 * Cena decorativa de estudos para a tela de autenticação.
 * Puramente visual: não recebe foco, não captura cliques (pointer-events: none)
 * e é marcada como decorativa para tecnologias assistivas.
 * As animações respeitam `prefers-reduced-motion` via CSS (globals.css e aqui).
 */

type ConstitutionQuote = {
  article: string;
  text: string;
};

const FORMULAS = [
  "x = (−b ± √(b² − 4ac)) / 2a",
  "Δ = b² − 4ac",
  "P(A) = favoráveis / possíveis",
  "aₙ = a₁ + (n − 1)r",
  "S = (a₁ + aₙ) · n / 2",
  "V = V₀ · (1 ± i)",
];

/**
 * Trechos curtos da Constituição Federal de 1988, conferidos na fonte oficial
 * (Planalto — https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao).
 * Mantidos como citação literal e identificados pelo artigo.
 */
const QUOTES: ConstitutionQuote[] = [
  {
    article: "Art. 5º",
    text: "“Todos são iguais perante a lei, sem distinção de qualquer natureza…”",
  },
  {
    article: "Art. 37",
    text: "“legalidade, impessoalidade, moralidade, publicidade e eficiência”",
  },
  {
    article: "Art. 144",
    text: "“A segurança pública, dever do Estado, direito e responsabilidade de todos…”",
  },
];

export function AcademicScene() {
  return (
    <div
      aria-hidden="true"
      data-scene="academico"
      className="cena-estudos pointer-events-none relative h-full min-h-72 w-full overflow-hidden"
    >
      {/* Luz suave de abajur + textura de página */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(201,162,39,0.16),transparent_46%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_82%,rgba(47,111,98,0.12),transparent_50%)]" />

      {/* Páginas/livros estilizados em movimento lento */}
      <div className="cena-pagina absolute left-1/2 top-1/2 h-64 w-52 -translate-x-1/2 -translate-y-1/2">
        <div className="cena-folha cena-folha-1" />
        <div className="cena-folha cena-folha-2" />
        <div className="cena-folha cena-folha-3" />
      </div>

      {/* Fórmulas em planos distintos */}
      <ul className="absolute inset-0">
        {FORMULAS.map((f, i) => (
          <li
            key={f}
            className={`cena-formula font-titulo text-pergaminho/25 ${
              ["left-[6%] top-[14%] text-2xl", "right-[8%] top-[24%] text-lg", "left-[12%] bottom-[26%] text-xl", "right-[14%] bottom-[16%] text-sm", "left-[42%] top-[8%] text-xs", "right-[38%] bottom-[8%] text-base"][i]
            }`}
            style={{ animationDelay: `${i * 1.4}s` }}
          >
            {f}
          </li>
        ))}
      </ul>

      {/* Linha de progresso de estudo que se desenha */}
      <svg className="absolute bottom-[38%] left-[10%] h-10 w-40 text-latao/40" viewBox="0 0 160 40" fill="none">
        <path
          className="cena-progresso"
          d="M2 34 C 40 34, 40 8, 80 8 S 130 34, 158 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Pontos luminosos discretos conectando conceitos */}
      <div className="absolute inset-0">
        {[
          ["20%", "34%"],
          ["62%", "30%"],
          ["78%", "62%"],
          ["34%", "72%"],
          ["50%", "50%"],
        ].map(([l, t], i) => (
          <span
            key={i}
            className="cena-ponto absolute h-1.5 w-1.5 rounded-full bg-latao/60"
            style={{ left: l, top: t, animationDelay: `${i * 0.9}s` }}
          />
        ))}
      </div>

      {/* Fichas de revisão que se alinham */}
      <div className="absolute right-[10%] top-[58%] space-y-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="cena-ficha h-2 w-16 rounded-sm bg-pergaminho/10"
            style={{ animationDelay: `${0.3 + i * 0.5}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Lista textual dos trechos constitucionais, para uso opcional fora da cena
 * decorativa (ex.: bloco de leitura acessível no painel de login).
 */
export function ConstitutionQuotes() {
  return (
    <ul className="space-y-3 text-sm">
      {QUOTES.map((q) => (
        <li key={q.article} className="text-pergaminho/80">
          <span className="mr-1 font-titulo text-latao">{q.article}</span>
          <span className="text-cinza">{q.text}</span>
        </li>
      ))}
    </ul>
  );
}

export const CONSTITUTION_SOURCE_URL =
  "https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao";
