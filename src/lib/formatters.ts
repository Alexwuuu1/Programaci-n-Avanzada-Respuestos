const moneyFormatter = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("es-BO", {
  maximumFractionDigits: 0,
});

export const formatMoney = (value: number | string | null | undefined): string => {
  const amount = Number(value ?? 0);
  return `Bs. ${moneyFormatter.format(Number.isFinite(amount) ? amount : 0)}`;
};

export const formatNumber = (value: number | string | null | undefined): string => {
  const amount = Number(value ?? 0);
  return integerFormatter.format(Number.isFinite(amount) ? amount : 0);
};

export const formatPercent = (value: number | string | null | undefined): string => {
  const amount = Number(value ?? 0);
  return `${integerFormatter.format(Number.isFinite(amount) ? amount : 0)}%`;
};
