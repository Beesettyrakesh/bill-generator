import { IBranchConfig } from "@/interfaces/IBranchConfig";

/**
 * Minimal shape needed to calculate a bill total.
 * Any object carrying template + consumption (+ optional cpm) works,
 * so both IBranchConfig and the cached BranchRecord are accepted.
 */
export interface CalcConfig {
    template: string;
    consumption?: number;
    cpm?: number;
}

/**
 * Pure, synchronous total calculation.
 *
 * The branch configuration is passed in by the caller (from the in-memory
 * ConfigContext cache) — this function performs NO network calls, so it can
 * run instantly on every keystroke.
 *
 * @param hours     Hours (or minutes, for MINUTES template) as a number
 * @param fuelPrice Fuel price as a number
 * @param config    Branch config providing template + consumption/cpm
 */
const calculateTotal = (
    hours: number,
    fuelPrice: number,
    config: CalcConfig | IBranchConfig,
): number => {
    const template = config.template;

    if (template === "MINUTES") {
        const cpm: number = config.cpm || 0;
        const minutes: number = Number(hours);
        return minutes * cpm * fuelPrice;
    }

    const consumption: number = config.consumption || 0;

    // The decimal part of `hours` represents MINUTES (HH.MM), not a fraction of
    // an hour. The client only ever enters :15, :30 or :45, which must be priced
    // as 0.25, 0.50, 0.75 of an hour respectively.
    const decimalsMap: Map<number, number> = new Map<number, number>();
    decimalsMap.set(15, 0.25);
    decimalsMap.set(30, 0.50);
    decimalsMap.set(45, 0.75);

    // Extract the minutes with Math.round, NOT Math.floor on (hours*100)%100.
    // Floating-point representation means e.g. 1.15 -> (1.15*100)%100 === 14.999…
    // which floor()s to 14, missing the map and silently dropping the minutes
    // from the price. Rounding the fractional part gives the correct 15/30/45.
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 100);
    const modifiedHours = wholeHours + (decimalsMap.get(minutes) || 0);
    return modifiedHours * consumption * fuelPrice;
};

export default calculateTotal;
