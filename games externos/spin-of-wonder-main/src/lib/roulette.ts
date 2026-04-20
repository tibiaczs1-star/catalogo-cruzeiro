// European roulette wheel order (clockwise from 0)
export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export type Color = "red" | "black" | "green";

export function colorOf(n: number): Color {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

export type BetType =
  | { kind: "number"; value: number }
  | { kind: "color"; value: "red" | "black" }
  | { kind: "parity"; value: "even" | "odd" }
  | { kind: "range"; value: "low" | "high" } // 1-18, 19-36
  | { kind: "dozen"; value: 1 | 2 | 3 } // 1-12, 13-24, 25-36
  | { kind: "column"; value: 1 | 2 | 3 };

export interface Bet {
  id: string;
  type: BetType;
  amount: number;
}

export function payoutMultiplier(type: BetType): number {
  switch (type.kind) {
    case "number":
      return 35;
    case "color":
    case "parity":
    case "range":
      return 1;
    case "dozen":
    case "column":
      return 2;
  }
}

export function betWins(type: BetType, n: number): boolean {
  if (n === 0) return type.kind === "number" && type.value === 0;
  switch (type.kind) {
    case "number":
      return type.value === n;
    case "color":
      return colorOf(n) === type.value;
    case "parity":
      return type.value === "even" ? n % 2 === 0 : n % 2 === 1;
    case "range":
      return type.value === "low" ? n >= 1 && n <= 18 : n >= 19 && n <= 36;
    case "dozen": {
      const d = type.value;
      return n >= (d - 1) * 12 + 1 && n <= d * 12;
    }
    case "column": {
      // Column 1: 1,4,7...; Column 2: 2,5,8...; Column 3: 3,6,9...
      return n % 3 === (type.value === 3 ? 0 : type.value);
    }
  }
}

export function betKey(type: BetType): string {
  switch (type.kind) {
    case "number":
      return `n-${type.value}`;
    default:
      return `${type.kind}-${type.value}`;
  }
}
