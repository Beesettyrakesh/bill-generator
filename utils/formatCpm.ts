/**
 * Formats a number to always show 3 decimal places
 * @param cpm The consumption per minute value to format
 * @returns The formatted string with 3 decimal places
 */
const formatCpm = (cpm: number | string | undefined): string => {
    if (cpm === undefined) return "0.000";
    
    const cpmNumber = typeof cpm === 'string' ? parseFloat(cpm) : cpm;
    
    // Format to always show 3 decimal places
    return cpmNumber.toFixed(3);
};

export default formatCpm;
