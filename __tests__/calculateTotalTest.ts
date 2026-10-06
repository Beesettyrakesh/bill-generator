
import '@testing-library/jest-dom'

import {describe, it} from "@jest/globals";
import expect from "expect";
import calculateTotal from "@/utils/calculateTotal";

describe('calculateTotal', () => {
    it('should return 216.10 for Nakkapalli (MINUTES template)', () => {
        // MINUTES template, cpm=0.079 → 28.30 * 0.079 * 96.66 = 216.10
        expect(
            calculateTotal(28.30, 96.66, { template: "MINUTES", cpm: 0.079 })
        ).toBeCloseTo(216.10, 1)
    });

    it('should return 3987.93 for Vishalakshi Nagar (HOURS template)', () => {
        // HOURS template, consumption=2.91 → 14.25 * 2.91 * 96.17
        expect(
            calculateTotal(14.15, 96.17, { template: "HOURS", consumption: 2.91 })
        ).toBeCloseTo(3987.93, 1)
    });

    it('should return 108.25 for Yellamanchalli (MINUTES template)', () => {
        // MINUTES template, cpm=0.135 → 8.30 * 0.135 * 96.61 = 108.25
        expect(
            calculateTotal(8.30, 96.61, { template: "MINUTES", cpm: 0.135 })
        ).toBeCloseTo(108.25, 1)
    });

    // Regression: HH.MM minutes must be priced as .15→0.25, .30→0.50, .45→0.75.
    // The old Math.floor((h*100)%100) extraction mis-read some of these due to
    // floating-point (e.g. 1.15 -> 14, 579.30 -> 29), silently dropping the
    // minutes from the price. These assert the corrected conversion.
    describe('HH.MM minute-to-price conversion (HOURS template, consumption=1, fuelPrice=1)', () => {
        const cfg = { template: "HOURS", consumption: 1 };
        it('prices :00 as the whole hour', () => {
            expect(calculateTotal(1.00, 1, cfg)).toBeCloseTo(1.00, 5);
        });
        it('prices :15 as 0.25 (was broken: floor gave 14)', () => {
            expect(calculateTotal(1.15, 1, cfg)).toBeCloseTo(1.25, 5);
        });
        it('prices :30 as 0.50', () => {
            expect(calculateTotal(1.30, 1, cfg)).toBeCloseTo(1.50, 5);
        });
        it('prices :45 as 0.75', () => {
            expect(calculateTotal(1.45, 1, cfg)).toBeCloseTo(1.75, 5);
        });
        it('prices large reading-derived hours :30 correctly (was broken: 579.30 -> 29)', () => {
            expect(calculateTotal(579.30, 1, cfg)).toBeCloseTo(579.50, 5);
        });
        it('prices large reading-derived hours :45 correctly', () => {
            expect(calculateTotal(550.45, 1, cfg)).toBeCloseTo(550.75, 5);
        });
        it('prices large reading-derived hours :15 correctly', () => {
            expect(calculateTotal(385.15, 1, cfg)).toBeCloseTo(385.25, 5);
        });
    });
})
