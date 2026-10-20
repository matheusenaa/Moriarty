import { describe, expect, it } from "vitest";
import { progressToNextRank, rankForXp, RANKS } from "@/lib/xp";

describe("gamificação", () => {
  it("patentes em ordem crescente de XP", () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].minXp).toBeGreaterThan(RANKS[i - 1].minXp);
    }
  });

  it("rank para XP", () => {
    expect(rankForXp(0).code).toBe("aprendiz");
    expect(rankForXp(150).code).toBe("escriba");
    expect(rankForXp(100000).code).toBe("mestre");
  });

  it("progresso para a próxima patente fica entre 0 e 100", () => {
    for (const xp of [0, 50, 149, 150, 399, 400, 1999, 2000, 99999]) {
      const p = progressToNextRank(xp);
      expect(p.pct).toBeGreaterThanOrEqual(0);
      expect(p.pct).toBeLessThanOrEqual(100);
    }
  });
});
