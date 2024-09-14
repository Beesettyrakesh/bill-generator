import {IBranchConfig} from "@/interfaces/IBranchConfig";
import getBranchDetails from "@/utils/getBranchDetails";

const calculateTotal = (hours: number, fuelPrice: number, branch: string): number => {

    const branchDetails: IBranchConfig = getBranchDetails(branch)
    const consumption: number = branchDetails["consumption"]
    const decimalsMap:Map<number, number> = new Map<number,  number>()
    decimalsMap.set(15, 0.25)
    decimalsMap.set(30, 0.50)
    decimalsMap.set(45, 0.75)

    const decimal =  Math.floor((hours * 100) % 100)

    const modifiedHours = Math.floor(hours) + (decimalsMap.get(decimal) || 0)
    return  modifiedHours * consumption * fuelPrice
}

export default calculateTotal;