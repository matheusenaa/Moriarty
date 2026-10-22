/**
 * Testes dos lembretes: descrição em linguagem natural e leitura dos dias marcados.
 */
import { describe, expect, it } from "vitest";
import { descreverDias, descreverLembrete } from "@/lib/lembretes";
import { diasDoLembrete } from "@/lib/repo/notifications";

describe("lembretes — descrição", () => {
  it("descreve casos especiais", () => {
    expect(descreverDias([])).toBe("nenhum dia");
    expect(descreverDias([0, 1, 2, 3, 4, 5, 6])).toBe("todos os dias");
    expect(descreverDias([1, 2, 3, 4, 5])).toBe("dias úteis");
    expect(descreverDias([0, 6])).toBe("finais de semana");
    expect(descreverDias([1, 2, 3, 4, 5, 6])).toBe("segunda a sábado");
  });

  it("lista os dias em ordem", () => {
    expect(descreverDias([5, 1, 3])).toBe("seg, qua, sex");
  });

  it("descreve o lembrete com horário", () => {
    expect(descreverLembrete("revisao", 540, [1, 2, 3, 4, 5])).toBe("Revisão às 09:00 (dias úteis)");
    expect(descreverLembrete("sessao", 870, [1, 3])).toBe("Sessão de estudo às 14:30 (seg, qua)");
  });
});

describe("lembretes — dias configurados", () => {
  it("lê a lista de dias do banco", () => {
    expect(diasDoLembrete("[1,2,3,4,5]")).toEqual([1, 2, 3, 4, 5]);
  });

  it("descarta valores inválidos", () => {
    expect(diasDoLembrete("[0,9,-1,1.5]")).toEqual([0]);
  });

  it("tolera JSON inválido", () => {
    expect(diasDoLembrete("nao-json")).toEqual([]);
    expect(diasDoLembrete("{\"a\":1}")).toEqual([]);
  });
});
