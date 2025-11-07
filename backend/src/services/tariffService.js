// Tariff suggestion logic centralised here for reuse across HTTP handlers or background jobs.
const BASE_BOARDING_FARE = 1500; // Base pickup cost (COP)
const RATE_PER_KM = 450;         // Rate per kilometre (COP)
const RATE_PER_MINUTE = 120;     // Rate per minute (COP)
const MINIMUM_FARE = 3000;       // Never suggest less than a minimum viable fare.
const ROUNDING_GRANULARITY = 100; // Round fares to the nearest hundred pesos.
const DEFAULT_DEMAND_FACTOR = 1;  // Neutral demand multiplier.
const MIN_DEMAND_FACTOR = 0.5;    // Avoid collapsing fares below 50%.
const MAX_DEMAND_FACTOR = 2;      // Avoid extreme surge pricing (>2x).

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundToGranularity(value) {
  return Math.round(value / ROUNDING_GRANULARITY) * ROUNDING_GRANULARITY;
}

function clampDemandFactor(value) {
  const parsed = toNumber(value, DEFAULT_DEMAND_FACTOR);
  return Math.min(Math.max(parsed, MIN_DEMAND_FACTOR), MAX_DEMAND_FACTOR);
}

export function suggestTariff({ distanceKm, durationMinutes, demandFactor }) {
  const km = Math.max(0, toNumber(distanceKm));
  const minutes = Math.max(0, toNumber(durationMinutes));
  const factor = clampDemandFactor(demandFactor);

  const baseFare = BASE_BOARDING_FARE + km * RATE_PER_KM + minutes * RATE_PER_MINUTE;
  const adjusted = Math.max(baseFare * factor, MINIMUM_FARE);
  const suggested = roundToGranularity(adjusted);

  const variance = suggested * 0.2; // ±20% window.
  const rangeMin = Math.max(MINIMUM_FARE, roundToGranularity(suggested - variance));
  const rangeMax = roundToGranularity(suggested + variance);

  return {
    suggestedTariff: suggested,
    range: {
      min: rangeMin,
      max: rangeMax
    },
    breakdown: {
      baseBoarding: BASE_BOARDING_FARE,
      distanceComponent: km * RATE_PER_KM,
      durationComponent: minutes * RATE_PER_MINUTE,
      demandFactor: factor,
      minimumFare: MINIMUM_FARE
    }
  };
}

export function validateTariffInputs({ distanceKm, durationMinutes }) {
  const km = Number(distanceKm);
  const minutes = Number(durationMinutes);

  if (!Number.isFinite(km) || km < 0) {
    return "distanceKm debe ser un número mayor o igual a 0";
  }
  if (!Number.isFinite(minutes) || minutes < 0) {
    return "durationMinutes debe ser un número mayor o igual a 0";
  }
  return null;
}

export function isWithinRange(value, range) {
  if (!range) return true;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return false;
  return amount >= range.min && amount <= range.max;
}
