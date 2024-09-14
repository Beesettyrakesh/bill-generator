import convertToWords, { stringify } from "@/utils/convertToWords";

import '@testing-library/jest-dom'

import {describe, it} from "@jest/globals";
import expect from "expect";

describe('convertToWords', () => {
    it('should convert 100', () => {
        expect(convertToWords("100")).toBe("One Hundred Rupees Only");
    });

    it('should convert 101', () => {
        expect(convertToWords("101")).toBe("One Hundred and One Rupees Only");
    });

    it('should convert 119', () => {
        expect(convertToWords("119")).toBe("One Hundred and Nineteen Rupees Only");
    });

    it('should convert 120', () => {
        expect(convertToWords("120")).toBe("One Hundred and Twenty Rupees Only");
    });

    it('should convert 173', () => {
        expect(convertToWords("173")).toBe("One Hundred and Seventy-Three Rupees Only");
    });

    it('should convert 5001', () => {
        expect(convertToWords("5001")).toBe("Five Thousand and One Rupees Only");
    });

    it('should convert 3700', () => {
        expect(convertToWords("3700")).toBe("Three Thousand Seven Hundred Rupees Only");
    });

    it('should convert 4034', () => {
        expect(convertToWords("4034")).toBe("Four Thousand and Thirty-Four Rupees Only");
    });

    it('should convert 9999', () => {
        expect(convertToWords("9999")).toBe("Nine Thousand Nine Hundred and Ninety-Nine Rupees Only");
    });

    it('should convert 22733', () => {
        expect(convertToWords("22733")).toBe("Twenty Two Thousand Seven Hundred and Thirty-Three Rupees Only");
    });

})

describe('stringify', () => {
    it('should convert to 75', () => {
        expect(stringify(75, "HUNDRED")).toBe("SEVENTY FIVE HUNDRED")
        expect(stringify(75)).toBe("SEVENTY FIVE")
    });

    it('should convert to 0 and hundred', () => {
        expect(stringify(0, "HUNDRED")).toBe("")
    });

    it('should convert to 0 units', () => {
        expect(stringify(0)).toBe("")
    });

    it('should convert to 11', () => {
        expect(stringify(11, "THOUSAND")).toBe("ELEVEN THOUSAND")
        expect(stringify(11)).toBe("ELEVEN")
        expect(stringify(11, "")).toBe("ELEVEN")
    });

    it('should convert to 20', () => {
        expect(stringify(20, "THOUSAND")).toBe("TWENTY THOUSAND")
    });
})