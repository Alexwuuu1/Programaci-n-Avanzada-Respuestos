/**
 * Formatea un valor numérico a un formato de moneda (es-BO)
 * Ejemplo: 100000 -> 100.000,00
 */
export const formatMoney = (amount: number | null | undefined): string => {
  if (amount == null || isNaN(amount)) return "0,00";
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
