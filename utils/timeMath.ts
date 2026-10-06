/**
 * Time math for meter readings expressed as HH.MM.
 *
 * Meter readings in the START_AND_END template are NOT decimal hours — the part
 * after the dot is literal minutes (00–59). So "579.30" means 579 hours and
 * 30 minutes, and "578.45" means 578 hours 45 minutes. They must be converted
 * to total minutes before any arithmetic; subtracting them as plain decimals
 * (579.15 - 578.45 = 0.70) is wrong — the correct elapsed time is 30 minutes
 * (00.30), which needs a borrow across the hour boundary.
 *
 * The elapsed HH.MM value this produces is later priced by calculateTotal,
 * which converts the minute part (.15/.30/.45) to a fraction of an hour
 * (.25/.50/.75) for the money calculation.
 */

/**
 * Parse an HH.MM reading into total minutes. "579.30" -> 579*60 + 30 = 34770.
 * Returns NaN for empty/invalid input.
 */
export const hhmmToMinutes = (reading: string | number): number => {
  const str = typeof reading === 'number' ? reading.toString() : (reading ?? '').trim();
  if (!str) return NaN;

  const [hoursPart, minutesPartRaw = '0'] = str.split('.');
  const hours = parseInt(hoursPart, 10);
  if (isNaN(hours)) return NaN;

  // The fractional part is minutes, not a fraction: "579.3" means 30 minutes,
  // not 3. Pad a single trailing digit to two so it reads as tens of minutes,
  // and clamp to two digits ("579.305" -> "30").
  const minutes = parseInt(minutesPartRaw.padEnd(2, '0').slice(0, 2), 10);
  if (isNaN(minutes)) return NaN;

  return hours * 60 + minutes;
};

/** Format total minutes back to a zero-padded HH.MM string. 90 -> "01.30". */
export const minutesToHHMM = (totalMinutes: number): string => {
  if (isNaN(totalMinutes) || totalMinutes < 0) return '';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(hours)}.${pad(minutes)}`;
};

/**
 * Elapsed HH.MM time between two meter readings.
 * elapsedHHMM("578.45", "579.15") -> "00.30" (30 minutes).
 * elapsedHHMM("578", "579.30")    -> "01.30" (1 hour 30 minutes).
 * Returns '' when inputs are invalid or end <= start (in time).
 */
export const elapsedHHMM = (start: string | number, end: string | number): string => {
  const startMin = hhmmToMinutes(start);
  const endMin = hhmmToMinutes(end);
  if (isNaN(startMin) || isNaN(endMin) || endMin <= startMin) return '';
  return minutesToHHMM(endMin - startMin);
};
