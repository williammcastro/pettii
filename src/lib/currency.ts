export function formatMoneyFromCents(
  cents: number | null | undefined,
  currency: string
) {
  const safeCents = cents ?? 0;

  if (currency === "COP") {
    const pesos = Math.round(safeCents / 100);
    return `${new Intl.NumberFormat("es-CO", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(pesos)} COP`;
  }

  const value = safeCents / 100;
  return `${new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)} ${currency}`;
}
