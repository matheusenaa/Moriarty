/**
 * Tipos públicos do módulo de seed (scripts/seed-catalog.mjs).
 * O módulo é JavaScript puro (fonte única de conteúdo), mas é importado
 * estaticamente pela app para que o bundler o embuta no pacote da função.
 */

export type CatalogItem = {
  title: string;
  kind: "area" | "nota" | "flashcard" | "questao" | "fonte";
  category?: string;
  order: number;
  body?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  originNote?: string;
  refLabel?: string;
  url?: string;
};

export type CatalogCollection = {
  slug: string;
  title: string;
  summary: string;
  status: "vigente" | "historico" | "comum" | "aguardando";
  statusNote: string;
  source: { name: string; url: string };
  editalRef: string;
  areas: string[];
  items: CatalogItem[];
};

export declare const CHECKED_AT: string;
export declare const SOURCES: Record<string, { name: string; url: string }>;
export declare const COLLECTIONS: CatalogCollection[];

export declare function seedCatalogPg(client: {
  query: (
    text: string,
    params?: unknown[],
  ) => Promise<{ rowCount: number | null; rows: unknown[] }>;
}): Promise<{ collections: number; items: number; inserted: number }>;
