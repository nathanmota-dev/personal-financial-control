// LC 123/2006, Anexos I a V: alíquota nominal e parcela a deduzir em reais.
export const SIMPLES_BRACKETS = {
  1: [[4,0],[7.3,5940],[9.5,13860],[10.7,22500],[14.3,87300],[19,378000]],
  2: [[4.5,0],[7.8,5940],[10,13860],[11.2,22500],[14.7,85500],[30,720000]],
  3: [[6,0],[11.2,9360],[13.5,17640],[16,35640],[21,125640],[33,648000]],
  4: [[4.5,0],[9,8100],[10.2,12420],[14,39780],[22,183780],[33,828000]],
  5: [[15.5,0],[18,4500],[19.5,9900],[20.5,17100],[23,62100],[30.5,540000]],
};
export function simplesRate(annualCents: number, annex: number) {
  if (!(annex in SIMPLES_BRACKETS)) throw new Error("Selecione um anexo de I a V.");
  const index = [18000000,36000000,72000000,180000000,360000000,480000000].findIndex(limit => annualCents <= limit);
  if (index < 0) throw new Error("A receita projetada excede o limite do Simples Nacional (R$ 4,8 milhões/ano).");
  const [nominal, deduction] = SIMPLES_BRACKETS[annex as keyof typeof SIMPLES_BRACKETS][index];
  return { rate: annualCents ? (annualCents * nominal / 100 - deduction * 100) / annualCents : nominal / 100, nominal, deduction, bracket: index + 1 };
}
