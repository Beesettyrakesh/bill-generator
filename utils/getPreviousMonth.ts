const getPreviousMonth = (): string => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1)
    return  date.toLocaleString("default", {month: "long"}).toLocaleUpperCase();
}

export default getPreviousMonth;