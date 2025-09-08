const getPreviousMonth = (inputDate?: string | Date): string => {
    // Use the provided date or default to current date
    const date = inputDate ? new Date(inputDate) : new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toLocaleString("default", {month: "long"}).toLocaleUpperCase();
}

export default getPreviousMonth;
