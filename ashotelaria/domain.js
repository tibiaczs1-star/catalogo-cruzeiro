"use strict";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_OPERATIONAL_TIME_ZONE = "America/Rio_Branco";

const ROOM_STATUS_TO_COUNT = new Map([
  ["occupied", "occupiedRooms"],
  ["checked_in", "occupiedRooms"],
  ["available", "availableRooms"],
  ["clean", "availableRooms"],
  ["vacant_clean", "availableRooms"],
  ["dirty", "dirtyRooms"],
  ["vacant_dirty", "dirtyRooms"],
  ["maintenance", "maintenanceRooms"],
  ["out_of_service", "maintenanceRooms"],
]);

const RESERVATION_STATUSES = new Set([
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "canceled",
  "no_show",
]);

const ACTIVE_RESERVATION_STATUSES = new Set(["confirmed", "checked_in"]);

function assertObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year, month) {
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1];
}

function parseDate(value, label) {
  if (typeof value !== "string") {
    throw new TypeError(`${label} must be a string`);
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new RangeError(`${label} must use YYYY-MM-DD`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    year < 1
    || month < 1
    || month > 12
    || day < 1
    || day > daysInMonth(year, month)
  ) {
    throw new RangeError(`${label} must be a real calendar date`);
  }

  const instant = new Date(0);
  instant.setUTCHours(0, 0, 0, 0);
  instant.setUTCFullYear(year, month - 1, day);

  return { value, dayNumber: Math.floor(instant.getTime() / DAY_IN_MS) };
}

function parseStayRange(input) {
  assertObject(input, "stay range");

  const checkIn = parseDate(input.checkIn, "checkIn");
  const checkOut = parseDate(input.checkOut, "checkOut");
  const nights = checkOut.dayNumber - checkIn.dayNumber;

  if (nights <= 0) {
    throw new RangeError("checkOut must be after checkIn");
  }

  return { checkIn: checkIn.value, checkOut: checkOut.value, nights };
}

function countNights(checkIn, checkOut) {
  return parseStayRange({ checkIn, checkOut }).nights;
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const first = parseStayRange({ checkIn: aStart, checkOut: aEnd });
  const second = parseStayRange({ checkIn: bStart, checkOut: bEnd });

  return first.checkIn < second.checkOut && second.checkIn < first.checkOut;
}

function assertInteger(value, label, { minimum = 0 } = {}) {
  if (typeof value !== "number") {
    throw new TypeError(`${label} must be a number`);
  }
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new RangeError(`${label} must be a safe integer of at least ${minimum}`);
  }
  return value;
}

function assertCents(value, label) {
  return assertInteger(value, label);
}

/**
 * Calculates a stay price. Every monetary input and output uses integer cents.
 */
function calculateStayTotal(input) {
  assertObject(input, "stay total");

  const nightlyRateCents = assertCents(input.nightlyRate, "nightlyRate");
  const nights = assertInteger(input.nights, "nights", { minimum: 1 });
  const extrasCents = assertCents(input.extras ?? 0, "extras");
  const taxesCents = assertCents(input.taxes ?? 0, "taxes");
  const roomSubtotalCents = nightlyRateCents * nights;
  const totalCents = roomSubtotalCents + extrasCents + taxesCents;

  if (!Number.isSafeInteger(roomSubtotalCents) || !Number.isSafeInteger(totalCents)) {
    throw new RangeError("stay total exceeds the safe integer range");
  }

  return {
    roomSubtotal: roomSubtotalCents,
    extras: extrasCents,
    taxes: taxesCents,
    total: totalCents,
  };
}

function normalizeKnownStatus(value, label, allowedStatuses) {
  if (typeof value !== "string") {
    throw new TypeError(`${label} must be a string`);
  }
  const status = value.trim().toLowerCase();
  if (!allowedStatuses.has(status)) {
    throw new RangeError(`${label} is unknown`);
  }
  return status;
}

function dateFromNow(now, timeZone) {
  if (typeof now === "string") {
    return parseDate(now, "now").value;
  }
  if (!(now instanceof Date)) {
    throw new TypeError("now must be a Date or YYYY-MM-DD string");
  }
  if (Number.isNaN(now.getTime())) {
    throw new RangeError("now must be a valid Date");
  }
  if (typeof timeZone !== "string" || !timeZone.trim()) {
    throw new TypeError("timeZone must be a non-empty string when now is a Date");
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const byType = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${byType.year}-${byType.month}-${byType.day}`;
}

function roundPercentage(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Builds operational metrics. confirmedRevenue and reservation.total use integer cents.
 */
function buildOperationalSummary({
  rooms,
  reservations,
  now = new Date(),
  timeZone = DEFAULT_OPERATIONAL_TIME_ZONE,
} = {}) {
  if (!Array.isArray(rooms)) {
    throw new TypeError("rooms must be an array");
  }
  if (!Array.isArray(reservations)) {
    throw new TypeError("reservations must be an array");
  }

  const today = dateFromNow(now, timeZone);
  const roomCounts = {
    occupiedRooms: 0,
    availableRooms: 0,
    dirtyRooms: 0,
    maintenanceRooms: 0,
  };

  for (const room of rooms) {
    assertObject(room, "room");
    const status = normalizeKnownStatus(room.status, "room.status", ROOM_STATUS_TO_COUNT);
    roomCounts[ROOM_STATUS_TO_COUNT.get(status)] += 1;
  }

  let arrivalsToday = 0;
  let departuresToday = 0;
  let confirmedRevenueCents = 0;

  for (const reservation of reservations) {
    assertObject(reservation, "reservation");
    const status = normalizeKnownStatus(
      reservation.status,
      "reservation.status",
      RESERVATION_STATUSES,
    );
    const active = ACTIVE_RESERVATION_STATUSES.has(status);

    if (!active) {
      continue;
    }

    const range = parseStayRange(reservation);
    const reservationTotalCents = assertCents(reservation.total, "reservation.total");

    if (range.checkIn === today) {
      arrivalsToday += 1;
    }
    if (range.checkOut === today) {
      departuresToday += 1;
    }
    if (status === "confirmed") {
      confirmedRevenueCents += reservationTotalCents;
      if (!Number.isSafeInteger(confirmedRevenueCents)) {
        throw new RangeError("confirmed revenue exceeds the safe integer range");
      }
    }
  }

  const totalRooms = rooms.length;
  const occupancyRate = totalRooms === 0
    ? 0
    : roundPercentage((roomCounts.occupiedRooms / totalRooms) * 100);

  return {
    totalRooms,
    ...roomCounts,
    arrivalsToday,
    departuresToday,
    occupancyRate,
    confirmedRevenue: confirmedRevenueCents,
  };
}

function normalizeRequiredText(value, label) {
  if (typeof value !== "string") {
    throw new TypeError(`${label} must be a string`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new RangeError(`${label} cannot be empty`);
  }
  return normalized;
}

/**
 * Normalizes reservation input. nightlyRate, extras, taxes and total use integer cents.
 */
function validateReservationInput(input) {
  assertObject(input, "reservation input");

  const guestName = normalizeRequiredText(input.guestName, "guestName");
  const roomTypeId = normalizeRequiredText(input.roomTypeId, "roomTypeId");
  const { checkIn, checkOut, nights } = parseStayRange(input);
  const adults = assertInteger(input.adults ?? 1, "adults", { minimum: 1 });
  const children = assertInteger(input.children ?? 0, "children");
  const nightlyRateCents = assertCents(input.nightlyRate, "nightlyRate");
  const { extras, taxes, total } = calculateStayTotal({
    nightlyRate: nightlyRateCents,
    nights,
    extras: input.extras,
    taxes: input.taxes,
  });

  return {
    guestName,
    roomTypeId,
    checkIn,
    checkOut,
    nights,
    adults,
    children,
    nightlyRate: nightlyRateCents,
    extras,
    taxes,
    total,
  };
}

module.exports = {
  parseStayRange,
  countNights,
  rangesOverlap,
  calculateStayTotal,
  buildOperationalSummary,
  validateReservationInput,
};
