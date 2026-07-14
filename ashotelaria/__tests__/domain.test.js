"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  parseStayRange,
  countNights,
  rangesOverlap,
  calculateStayTotal,
  buildOperationalSummary,
  operationalDate,
  validateCheckInEligibility,
  validateReservationInput,
  validateReservationTransition,
} = require("../domain");

test("parseStayRange normalizes a valid exclusive checkout range", () => {
  assert.deepEqual(
    parseStayRange({ checkIn: "2026-07-14", checkOut: "2026-07-17" }),
    { checkIn: "2026-07-14", checkOut: "2026-07-17", nights: 3 },
  );

  assert.equal(countNights("2028-02-28", "2028-03-01"), 2);
});

test("stay dates must be real YYYY-MM-DD values with checkout after checkin", () => {
  assert.throws(
    () => parseStayRange({ checkIn: 20260714, checkOut: "2026-07-17" }),
    TypeError,
  );
  assert.throws(
    () => parseStayRange({ checkIn: "14/07/2026", checkOut: "2026-07-17" }),
    RangeError,
  );
  assert.throws(
    () => parseStayRange({ checkIn: "2026-02-30", checkOut: "2026-03-02" }),
    RangeError,
  );
  assert.throws(
    () => countNights("2026-07-14", "2026-07-14"),
    RangeError,
  );
  assert.throws(
    () => countNights("2026-07-15", "2026-07-14"),
    RangeError,
  );
});

test("rangesOverlap treats checkout as exclusive", () => {
  assert.equal(
    rangesOverlap("2026-07-14", "2026-07-17", "2026-07-17", "2026-07-20"),
    false,
  );
  assert.equal(
    rangesOverlap("2026-07-14", "2026-07-18", "2026-07-17", "2026-07-20"),
    true,
  );
  assert.equal(
    rangesOverlap("2026-07-14", "2026-07-18", "2026-07-15", "2026-07-16"),
    true,
  );
});

test("rangesOverlap rejects invalid stay ranges", () => {
  assert.throws(
    () => rangesOverlap("2026-07-14", "2026-07-14", "2026-07-17", "2026-07-20"),
    RangeError,
  );
  assert.throws(
    () => rangesOverlap("2026-07-14", "2026-07-18", "2026-02-30", "2026-07-20"),
    RangeError,
  );
});

test("calculateStayTotal returns an integer-cent breakdown", () => {
  assert.deepEqual(
    calculateStayTotal({ nightlyRate: 15_050, nights: 3, extras: 2_500, taxes: 1_250 }),
    {
      roomSubtotal: 45_150,
      extras: 2_500,
      taxes: 1_250,
      total: 48_900,
    },
  );

  assert.deepEqual(calculateStayTotal({ nightlyRate: 10_000, nights: 1 }), {
    roomSubtotal: 10_000,
    extras: 0,
    taxes: 0,
    total: 10_000,
  });
});

test("calculateStayTotal rejects invalid counts, cents and unsafe totals", () => {
  assert.throws(
    () => calculateStayTotal({ nightlyRate: "10000", nights: 2 }),
    TypeError,
  );
  assert.throws(
    () => calculateStayTotal({ nightlyRate: 100.5, nights: 2 }),
    RangeError,
  );
  assert.throws(
    () => calculateStayTotal({ nightlyRate: 10_000, nights: 0 }),
    RangeError,
  );
  assert.throws(
    () => calculateStayTotal({ nightlyRate: 10_000, nights: 2, extras: -1 }),
    RangeError,
  );
  assert.throws(
    () => calculateStayTotal({ nightlyRate: Number.MAX_SAFE_INTEGER, nights: 2 }),
    RangeError,
  );
  assert.throws(
    () => calculateStayTotal({
      nightlyRate: 1,
      nights: 1,
      extras: Number.MAX_SAFE_INTEGER - 1,
      taxes: 1,
    }),
    RangeError,
  );
});

test("buildOperationalSummary derives room, movement and revenue metrics", () => {
  const rooms = [
    { id: "101", status: "available" },
    { id: "102", status: "occupied" },
    { id: "103", status: "dirty" },
    { id: "104", status: "maintenance" },
  ];
  const reservations = [
    {
      id: "r1",
      status: "confirmed",
      checkIn: "2026-07-14",
      checkOut: "2026-07-16",
      total: 30_000,
    },
    {
      id: "r2",
      status: "checked_in",
      checkIn: "2026-07-12",
      checkOut: "2026-07-14",
      total: 20_000,
    },
    {
      id: "r3",
      status: "cancelled",
      checkIn: "2026-07-14",
      checkOut: "2026-07-15",
      total: 99_000,
    },
    {
      id: "r4",
      status: "confirmed",
      checkIn: "2026-07-20",
      checkOut: "2026-07-21",
      total: 12_000,
    },
  ];

  assert.deepEqual(
    buildOperationalSummary({ rooms, reservations, now: "2026-07-14" }),
    {
      totalRooms: 4,
      occupiedRooms: 1,
      availableRooms: 1,
      dirtyRooms: 1,
      maintenanceRooms: 1,
      arrivalsToday: 1,
      departuresToday: 1,
      occupancyRate: 25,
      confirmedRevenue: 42_000,
    },
  );
});

test("buildOperationalSummary handles empty inventory and validates collections", () => {
  assert.deepEqual(
    buildOperationalSummary({ rooms: [], reservations: [], now: new Date("2026-07-14T12:00:00Z") }),
    {
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      dirtyRooms: 0,
      maintenanceRooms: 0,
      arrivalsToday: 0,
      departuresToday: 0,
      occupancyRate: 0,
      confirmedRevenue: 0,
    },
  );
  assert.throws(
    () => buildOperationalSummary({ rooms: null, reservations: [] }),
    TypeError,
  );
});

test("buildOperationalSummary derives the operational day in America/Rio_Branco", () => {
  const summary = buildOperationalSummary({
    rooms: [],
    reservations: [{
      status: "confirmed",
      checkIn: "2026-07-14",
      checkOut: "2026-07-16",
      total: 10_000,
    }],
    now: new Date("2026-07-15T01:00:00.000Z"),
  });

  assert.equal(summary.arrivalsToday, 1);
  assert.equal(summary.departuresToday, 0);
});

test("check-in eligibility uses the property operational day and only accepts arrival day", () => {
  const localDay = operationalDate(
    new Date("2026-07-15T03:30:00.000Z"),
    "America/Rio_Branco",
  );
  assert.equal(localDay, "2026-07-14");
  assert.equal(validateCheckInEligibility({
    checkIn: "2026-07-14",
    checkOut: "2026-07-16",
    operationalDate: localDay,
  }), "2026-07-14");

  for (const rejectedDay of ["2026-07-13", "2026-07-15", "2026-07-16"]) {
    assert.throws(
      () => validateCheckInEligibility({
        checkIn: "2026-07-14",
        checkOut: "2026-07-16",
        operationalDate: rejectedDay,
      }),
      (error) => error.code === "CHECK_IN_NOT_ALLOWED",
      rejectedDay,
    );
  }
});

test("buildOperationalSummary rejects unknown or non-textual room statuses", () => {
  assert.throws(
    () => buildOperationalSummary({
      rooms: [{ id: "101", status: "blocked" }],
      reservations: [],
      now: "2026-07-14",
    }),
    RangeError,
  );
  assert.throws(
    () => buildOperationalSummary({
      rooms: [{ id: "101", status: null }],
      reservations: [],
      now: "2026-07-14",
    }),
    TypeError,
  );
});

test("buildOperationalSummary validates active reservation dates, status and cents", () => {
  const summarize = (reservation) => buildOperationalSummary({
    rooms: [],
    reservations: [reservation],
    now: "2026-07-14",
  });

  assert.throws(
    () => summarize({
      status: "confirmed",
      checkIn: "invalid",
      checkOut: "2026-07-15",
      total: 10_000,
    }),
    RangeError,
  );
  assert.throws(
    () => summarize({
      status: "checked_in",
      checkIn: "2026-07-15",
      checkOut: "2026-07-14",
      total: 10_000,
    }),
    RangeError,
  );
  assert.throws(
    () => summarize({
      status: 1,
      checkIn: "2026-07-14",
      checkOut: "2026-07-15",
      total: 10_000,
    }),
    TypeError,
  );
  assert.throws(
    () => summarize({
      status: "unknown",
      checkIn: "2026-07-14",
      checkOut: "2026-07-15",
      total: 10_000,
    }),
    RangeError,
  );
  assert.throws(
    () => summarize({
      status: "confirmed",
      checkIn: "2026-07-14",
      checkOut: "2026-07-15",
      total: Number.MAX_SAFE_INTEGER + 1,
    }),
    RangeError,
  );
});

test("validateReservationInput trims and normalizes a reservation", () => {
  assert.deepEqual(
    validateReservationInput({
      guestName: "  Ana Souza  ",
      roomTypeId: "  deluxe  ",
      checkIn: "2026-07-14",
      checkOut: "2026-07-17",
      adults: 2,
      children: 1,
      nightlyRate: 15_000,
      extras: 2_000,
      taxes: 1_000,
    }),
    {
      guestName: "Ana Souza",
      roomTypeId: "deluxe",
      checkIn: "2026-07-14",
      checkOut: "2026-07-17",
      nights: 3,
      adults: 2,
      children: 1,
      nightlyRate: 15_000,
      extras: 2_000,
      taxes: 1_000,
      total: 48_000,
    },
  );

  assert.deepEqual(
    validateReservationInput({
      guestName: "Bia Lima",
      roomTypeId: "standard",
      checkIn: "2026-08-01",
      checkOut: "2026-08-02",
      nightlyRate: 9_000,
    }),
    {
      guestName: "Bia Lima",
      roomTypeId: "standard",
      checkIn: "2026-08-01",
      checkOut: "2026-08-02",
      nights: 1,
      adults: 1,
      children: 0,
      nightlyRate: 9_000,
      extras: 0,
      taxes: 0,
      total: 9_000,
    },
  );
});

test("validateReservationInput reports structural and value errors", () => {
  assert.throws(() => validateReservationInput(null), TypeError);
  assert.throws(
    () => validateReservationInput({
      guestName: " ",
      roomTypeId: "standard",
      checkIn: "2026-08-01",
      checkOut: "2026-08-02",
      nightlyRate: 9_000,
    }),
    RangeError,
  );
  assert.throws(
    () => validateReservationInput({
      guestName: "Ana",
      roomTypeId: "standard",
      checkIn: "2026-08-01",
      checkOut: "2026-08-02",
      adults: 1.5,
      nightlyRate: 9_000,
    }),
    RangeError,
  );
  assert.throws(
    () => validateReservationInput({
      guestName: "Ana",
      roomTypeId: "standard",
      checkIn: "2026-08-01",
      checkOut: "2026-08-02",
    }),
    TypeError,
  );
});

test("reservation lifecycle accepts only operational transitions", () => {
  assert.equal(validateReservationTransition("pending", "confirmed"), "confirmed");
  assert.equal(validateReservationTransition("pending", "cancelled"), "cancelled");
  assert.equal(validateReservationTransition("confirmed", "checked_in"), "checked_in");
  assert.equal(validateReservationTransition("confirmed", "cancelled"), "cancelled");
  assert.equal(validateReservationTransition("checked_in", "checked_out"), "checked_out");
  assert.equal(validateReservationTransition("checked_out", "checked_out"), "checked_out");
  assert.throws(
    () => validateReservationTransition("checked_out", "checked_in"),
    (error) => error.code === "INVALID_RESERVATION_TRANSITION",
  );
  assert.throws(
    () => validateReservationTransition("confirmed", "unknown"),
    (error) => error.code === "INVALID_RESERVATION_TRANSITION",
  );
});
