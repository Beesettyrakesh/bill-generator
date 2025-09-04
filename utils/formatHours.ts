/**
 * Formats hours value to display in HH.MM format
 * For START_AND_END template: converts decimal hours to hours.minutes format (5.5 -> 05.30)
 * For other templates: keeps decimal format (5.5 -> 05.50)
 * 
 * @param hours - The hours value as a string or number
 * @param template - Optional template type to determine formatting style
 * @returns Formatted hours string in HH.MM format
 */
const formatHours = (hours: string | number, template?: string): string => {
  // Convert to string if it's a number
  const hoursStr = typeof hours === 'number' ? hours.toString() : hours;
  
  // If empty, return empty string
  if (!hoursStr) return '';
  
  // Parse the hours value
  const parsedHours = parseFloat(hoursStr);
  
  // Split into whole hours and decimal part
  const wholeHours = Math.floor(parsedHours);
  const decimalPart = parsedHours - wholeHours;
  
  // Format whole hours with leading zero if needed
  const formattedWholeHours = wholeHours < 10 ? `0${wholeHours}` : `${wholeHours}`;
  
  // Convert decimal part to minutes representation (e.g., 0.5 -> 50)
  // Round to 2 decimal places to handle cases like 0.3 -> 30
  const minutes = template === "START_AND_END" ? Math.round(decimalPart * 60) : Math.round(decimalPart * 100);
  
  // Format minutes with trailing zero if needed
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  
  // Combine whole hours and minutes
  return `${formattedWholeHours}.${formattedMinutes}`;
};

export default formatHours;
