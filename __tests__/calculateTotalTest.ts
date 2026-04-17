
import '@testing-library/jest-dom'

import {describe, it} from "@jest/globals";
import expect from "expect";
import calculateTotal from "@/utils/calculateTotal";

describe('calculateTotal', () => {
    it('should return 216.10 for Nakkapalli (MINUTES template)', async () => {
        // Nakkapalli: MINUTES template, cpm=0.079 → 28.30 * 0.079 * 96.66 = 216.10
        expect(await calculateTotal(28.30, 96.66, "Nakkapalli")).toBeCloseTo(216.10, 1)
    });

    it('should return 3987.93 for Vishalakshi Nagar (HOURS template)', async () => {
        // Vishalakshi Nagar: HOURS template, consumption=2.91 → 14.25 * 2.91 * 96.17
        expect(await calculateTotal(14.15, 96.17, "Vishalakshi Nagar")).toBeCloseTo(3987.93, 1)
    });

    it('should return 108.25 for Yellamanchalli (MINUTES template)', async () => {
        // Yellamanchalli: MINUTES template, cpm=0.135 → 8.30 * 0.135 * 96.61 = 108.25
        expect(await calculateTotal(8.30, 96.61, "Yellamanchalli")).toBeCloseTo(108.25, 1)
    });
})
