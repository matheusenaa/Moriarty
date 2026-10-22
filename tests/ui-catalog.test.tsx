// @vitest-environment jsdom
/**
 * Testes de RENDER da UI do catálogo (componentes cliente das trilhas).
 *
 * Cobrem o comportamento que o usuário vê na trilha:
 * - flashcard: frente -> verso (virar o card);
 * - questão: selecionar alternativa, ver gabarito/explicação, "você acertou/errou",
 *   "responder de novo" e o aviso da tentativa anterior;
 * - botões de progresso: "lido"/"dominado".
 *
 * As server actions são mockadas (não tocam o banco).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/actions/catalog", () => ({
  answerCatalogQuestionAction: vi.fn(async () => ({ ok: true })),
  saveCatalogItemAction: vi.fn(async () => ({ ok: true })),
  scheduleCatalogItemReviewAction: vi.fn(async () => ({ ok: true })),
  setCatalogItemProgressAction: vi.fn(async () => ({ ok: true })),
}));

import { answerCatalogQuestionAction } from "@/actions/catalog";
import { CatalogFlashcard } from "@/components/CatalogFlashcard";
import { CatalogQuestion, type QuizItemView } from "@/components/CatalogQuestion";
import { CatalogProgressButtons } from "@/components/CatalogProgressButtons";
import { splitFlashcard } from "@/lib/flashcard";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const questao: QuizItemView = {
  id: "catalog:pmdf-cfo:questao:100",
  title: "Questão autoral PMDF-01",
  statement: "Segundo o art. 37 da CF/88, são princípios expressos da Administração Pública:",
  options: ["legalidade e moralidade", "eficiência e economicidade", "publicidade eundiade", "mérito e类专业"],
  correctIndex: 0,
  explanation: "Os princípios expressos são legalidade, impessoalidade, moralidade, publicidade e eficiência (LIMPE).",
  originNote: "Autoral/gerada para prática — NÃO é questão oficial.",
};

describe("splitFlashcard (lib server-safe)", () => {
  it("separa frente e verso do corpo do flashcard", () => {
    const r = splitFlashcard("Frente: o que?\n\nVerso: a resposta.", "Título");
    expect(r.front).toBe("o que?");
    expect(r.back).toBe("a resposta.");
  });

  it("usa o título como frente quando não há marcador", () => {
    const r = splitFlashcard("Só um texto solto.", "Título padrão");
    expect(r.front).toBe("Título padrão");
    expect(r.back).toBe("Só um texto solto.");
  });
});

describe("CatalogFlashcard", () => {
  const item = {
    id: "catalog:pmdf-cfo:flashcard:20",
    title: "Flashcard — art. 144",
    front: "Quem é responsável pela segurança pública?",
    back: "É dever do Estado, direito e responsabilidade de todos.",
    refLabel: "CF/88, art. 144",
    url: "https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao",
  };

  it("mostra a frente e vira para o verso ao clicar", () => {
    render(<CatalogFlashcard item={item} slug="pmdf-cfo" state={null} />);

    expect(screen.getByText(item.front)).toBeInTheDocument();
    expect(screen.queryByText(item.back)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("ver verso"));

    expect(screen.getByText(item.back)).toBeInTheDocument();
    expect(screen.queryByText(item.front)).not.toBeInTheDocument();
  });

  it("identifica o item como flashcard e mostra a referência", () => {
    render(<CatalogFlashcard item={item} slug="pmdf-cfo" state={null} />);
    expect(screen.getByText("flashcard")).toBeInTheDocument();
    expect(screen.getByText(item.refLabel)).toBeInTheDocument();
  });
});

describe("CatalogQuestion", () => {
  it("não revela o gabarito antes de escolher uma alternativa", () => {
    render(<CatalogQuestion item={questao} />);
    const botao = screen.getByRole("button", { name: /ver gabarito/i });
    expect(botao).toBeDisabled();
    expect(screen.queryByText(questao.explanation)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gabarito:/)).not.toBeInTheDocument();
  });

  it("revela gabarito, explicação e acerto ao escolher a alternativa correta", async () => {
    render(<CatalogQuestion item={questao} />);

    fireEvent.click(screen.getByText(/legalidade e moralidade/));
    const botao = screen.getByRole("button", { name: /ver gabarito/i });
    expect(botao).toBeEnabled();
    fireEvent.click(botao);

    expect(await screen.findByText("você acertou")).toBeInTheDocument();
    expect(screen.getByText(/Gabarito:/)).toBeInTheDocument();
    expect(screen.getByText(questao.explanation)).toBeInTheDocument();

    await waitFor(() => {
      expect(answerCatalogQuestionAction).toHaveBeenCalledWith({
        itemId: questao.id,
        chosenIndex: 0,
      });
    });
  });

  it("mostra 'você errou' quando a alternativa escolhida é incorreta", async () => {
    render(<CatalogQuestion item={questao} />);
    fireEvent.click(screen.getByText(/eficiência e economicidade/));
    fireEvent.click(screen.getByRole("button", { name: /ver gabarito/i }));

    expect(await screen.findByText("você errou")).toBeInTheDocument();
    await waitFor(() => {
      expect(answerCatalogQuestionAction).toHaveBeenCalledWith({
        itemId: questao.id,
        chosenIndex: 1,
      });
    });
  });

  it("marca a questão como autoral e não oficial", () => {
    render(<CatalogQuestion item={questao} />);
    expect(screen.getByText("autoral · não oficial")).toBeInTheDocument();
    expect(screen.getByText(questao.originNote)).toBeInTheDocument();
  });

  it("avisa da tentativa anterior (errou antes) e permite responder de novo", async () => {
    render(<CatalogQuestion item={questao} previous={{ isCorrect: false, attempts: 2 }} />);
    expect(screen.getByText(/errou antes/)).toBeInTheDocument();
    expect(screen.getByText(/2x/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/legalidade e moralidade/));
    fireEvent.click(screen.getByRole("button", { name: /ver gabarito/i }));
    await screen.findByText("você acertou");

    fireEvent.click(screen.getByRole("button", { name: /responder de novo/i }));
    expect(screen.getByRole("button", { name: /ver gabarito/i })).toBeDisabled();
    expect(screen.queryByText(questao.explanation)).not.toBeInTheDocument();
  });

  it("usa a âncora questao-{id} para link direto", () => {
    const { container } = render(<CatalogQuestion item={questao} />);
    expect(container.querySelector(`#questao-${CSS.escape(questao.id)}`)).toBeTruthy();
  });
});

describe("CatalogProgressButtons", () => {
  it("oferece marcar como lido e dominado quando não há progresso", () => {
    render(<CatalogProgressButtons itemId="catalog:pmdf-cfo:nota:1" slug="pmdf-cfo" state={null} />);
    expect(screen.getByRole("button", { name: /marcar como lido/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /marcar como dominado/i })).toBeInTheDocument();
  });

  it("reflete o estado atual (lido)", () => {
    render(<CatalogProgressButtons itemId="catalog:pmdf-cfo:nota:1" slug="pmdf-cfo" state="lido" />);
    expect(screen.getByRole("button", { name: /✓ lido/i })).toBeInTheDocument();
    expect(screen.getByText("lido")).toBeInTheDocument();
  });
});
