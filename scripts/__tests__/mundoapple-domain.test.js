const test = require("node:test");
const assert = require("node:assert/strict");

const {
  calculateInventoryPricing,
  calculateSaleResult,
  normalizeCondition,
  validateMoney,
} = require("../../mundoapple/server/domain");

test("inventory pricing includes every acquisition and preparation cost", () => {
  const result = calculateInventoryPricing({
    purchasePriceCents: 300_000,
    freightCents: 5_000,
    motoboyCents: 2_000,
    packagingCents: 1_000,
    preparationCents: 4_000,
    warrantyReserveCents: 8_000,
    webPriceCents: 450_000,
    pickupPriceCents: 430_000,
  });

  assert.equal(result.totalCostCents, 320_000);
  assert.equal(result.webProjectedProfitCents, 130_000);
  assert.equal(result.pickupProjectedProfitCents, 110_000);
});

test("sale result subtracts fees, discounts and sale expenses exactly once", () => {
  const result = calculateSaleResult({
    totalCostCents: 320_000,
    receivedCents: 420_000,
    paymentFeeCents: 12_000,
    discountCents: 5_000,
    saleExpensesCents: 3_000,
  });

  assert.equal(result.netRevenueCents, 403_000);
  assert.equal(result.profitCents, 80_000);
  assert.equal(result.marginBasisPoints, 1_985);
});

test("money values and device condition are normalized safely", () => {
  assert.equal(validateMoney(0, "valor"), 0);
  assert.equal(validateMoney(1234, "valor"), 1234);
  assert.throws(() => validateMoney(-1, "valor"), /valor/);
  assert.throws(() => validateMoney(1.2, "valor"), /valor/);
  assert.equal(normalizeCondition("novo"), "new");
  assert.equal(normalizeCondition("seminovo"), "used");
  assert.throws(() => normalizeCondition("quebrado"), /condição/i);
});
