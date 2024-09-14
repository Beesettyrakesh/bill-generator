
import '@testing-library/jest-dom'

import {describe, it} from "@jest/globals";
import expect from "expect";
import calculateTotal from "@/utils/calculateTotal";

describe('calculateTotal', () => {
    it('should return 13167.99', () => {
        expect(calculateTotal(28.30, 96.66, "Nakkapalli")).toBe(13167.99)
    });

    it('should return 3987.92', () => {
        expect(calculateTotal(14.15, 96.17, "Vishalakshi Nagar")).toBe(3987.93)
    });

    it('should return 6659.81', () => {
        expect(calculateTotal(8.30, 96.61, "Yellamanchalli")).toBe(6659.81)
    });
})