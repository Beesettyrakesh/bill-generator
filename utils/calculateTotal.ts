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

    const decimalsMap: Map<number, number> = new Map<number, number>();
    decimalsMap.set(15, 0.25);
    decimalsMap.set(30, 0.50);
    decimalsMap.set(45, 0.75);

    const decimal = Math.floor((hours * 100) % 100);
    const modifiedHours = Math.floor(hours) + (decimalsMap.get(decimal) || 0);
    return modifiedHours * consumption * fuelPrice;
};

export default calculateTotal;
