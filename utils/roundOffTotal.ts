const roundOffTotal = (total: number): string => {
    const temp = Math.floor(total)
    const diff = Number(total) - temp
    if (diff > 0.50) {
        return (temp+1).toString()+".00"
    } else {
        return temp.toString()
    }
}

export default roundOffTotal;