const roundOffTotal = (total: number, template?: string): string => {

    if(template === "MINUTES") {
        return total.toFixed(2).toString()
    }
    const temp = Math.floor(total)
    const diff = Number(total) - temp
    if (diff > 0.50) {
        return (temp+1).toString()+".00"
    } else {
        return temp.toString()+".00"
    }
}

export default roundOffTotal;