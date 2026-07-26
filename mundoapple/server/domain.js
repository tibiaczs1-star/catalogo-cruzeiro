"use strict";

function validateMoney(value, label = "valor") {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new TypeError(`${label} deve ser informado em centavos, sem valor negativo.`);
  }
  return number;
}

function normalizeCondition(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["new", "novo", "nova"].includes(normalized)) return "new";
  if (["used", "usado", "usada", "seminovo", "seminova"].includes(normalized)) return "used";
  throw new TypeError("Condição deve ser novo ou seminovo.");
}

function calculateInventoryPricing(input = {}) {
  const purchasePriceCents = validateMoney(input.purchasePriceCents || 0, "preço de compra");
  const freightCents = validateMoney(input.freightCents || 0, "frete");
  const motoboyCents = validateMoney(input.motoboyCents || 0, "motoboy");
  const packagingCents = validateMoney(input.packagingCents || 0, "embalagem");
  const preparationCents = validateMoney(input.preparationCents || 0, "preparação");
  const warrantyReserveCents = validateMoney(input.warrantyReserveCents || 0, "reserva de garantia");
  const webPriceCents = validateMoney(input.webPriceCents || 0, "preço web");
  const pickupPriceCents = validateMoney(input.pickupPriceCents || 0, "preço de retirada");

  const totalCostCents =
    purchasePriceCents +
    freightCents +
    motoboyCents +
    packagingCents +
    preparationCents +
    warrantyReserveCents;

  return {
    totalCostCents,
    webProjectedProfitCents: webPriceCents - totalCostCents,
    pickupProjectedProfitCents: pickupPriceCents - totalCostCents,
  };
}

function calculateSaleResult(input = {}) {
  const totalCostCents = validateMoney(input.totalCostCents || 0, "custo total");
  const receivedCents = validateMoney(input.receivedCents || 0, "valor recebido");
  const paymentFeeCents = validateMoney(input.paymentFeeCents || 0, "taxa de pagamento");
  const discountCents = validateMoney(input.discountCents || 0, "desconto");
  const saleExpensesCents = validateMoney(input.saleExpensesCents || 0, "despesas da venda");

  const netRevenueCents = receivedCents - paymentFeeCents - discountCents;
  const profitCents = netRevenueCents - totalCostCents - saleExpensesCents;
  const marginBasisPoints = netRevenueCents > 0
    ? Math.round((profitCents / netRevenueCents) * 10_000)
    : 0;

  return { netRevenueCents, profitCents, marginBasisPoints };
}

module.exports = {
  calculateInventoryPricing,
  calculateSaleResult,
  normalizeCondition,
  validateMoney,
};
