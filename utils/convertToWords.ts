const numbersMap:Map<number, string> = new Map<number,  string>()
numbersMap.set(0, 'Zero')
numbersMap.set(1, 'One')
numbersMap.set(2, 'Two')
numbersMap.set(3, 'Three')
numbersMap.set(4, 'Four')
numbersMap.set(5, 'Five')
numbersMap.set(6, 'Six')
numbersMap.set(7, 'Seven')
numbersMap.set(8, 'Eight')
numbersMap.set(9, 'Nine')
numbersMap.set(10, 'Ten')
numbersMap.set(11, 'Eleven')
numbersMap.set(12, 'Twelve')
numbersMap.set(13, 'Thirteen')
numbersMap.set(14, 'Fourteen')
numbersMap.set(15, 'Fifteen')
numbersMap.set(16, 'Sixteen')
numbersMap.set(17, 'Seventeen')
numbersMap.set(18, 'Eighteen')
numbersMap.set(19, 'Nineteen')
numbersMap.set(20, 'Twenty')
numbersMap.set(30, 'Thirty')
numbersMap.set(40, 'Forty')
numbersMap.set(50, 'Fifty')
numbersMap.set(60, 'Sixty')
numbersMap.set(70, 'Seventy')
numbersMap.set(80, 'Eighty')
numbersMap.set(90, 'Ninety')
numbersMap.set(100, 'Hundred')

const convertToWords = (finalTotal: string): string => {

    const total: number = Number(finalTotal)
    const hundreds: number = Math.floor(total % 1000 / 100)
    const thousands: number = (parseInt((total / 1000).toString()))
    const unitsAndTens: number = Number(total % 100)

    const hundredsString = stringify(hundreds, "Hundred")
    const thousandsString = stringify(thousands, "Thousand")
    const unitsAndTensString = stringify(unitsAndTens, "").replaceAll(" ", "-")

    if ((thousands || hundreds) && unitsAndTens) {
        return (thousandsString+" "+hundredsString+" and "+unitsAndTensString+" Rupees Only").trim().replaceAll("  ", " ")
    } else {
        return (thousandsString+" "+hundredsString+" "+unitsAndTensString+" Rupees Only").trim().replaceAll("  ", " ")
    }
}

export const stringify = (number: number,  sufix: string = ""): string => {
    let temp = ""
    if (number > 0 && number < 20) {
        temp += numbersMap.get(number)
    } else if (number >= 20) {
        const numberUnitsValue = number % 10
        const numberUnitsValueString: string | undefined = numbersMap.get(numberUnitsValue)
        const numberTensValueString: string | undefined = numbersMap.get(number - numberUnitsValue)
        if (numberUnitsValue == 0) {
            temp += numberTensValueString
        } else {
            temp += numberTensValueString+" "+numberUnitsValueString
        }
    }
    if (number === 0) {
        return temp
    }
    return (temp+" "+sufix).trim()
}

export default convertToWords