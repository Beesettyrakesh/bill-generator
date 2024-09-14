const convertDate = (dateInput: string): string => {
    const [year, month, dt] = dateInput.split('-')
    return dt + "-" + month + "-" + year
}

export default convertDate;