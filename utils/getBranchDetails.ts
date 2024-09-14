import {IBranchConfig} from "@/interfaces/IBranchConfig";
import {branchConfig} from "@/config/branchConfig";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const getBranchDetails = (branch: string): IBranchConfig => {
    let branchData: IBranchConfig
    const keys = Object.keys(branchConfig);
    for (const key of keys) {
        if (key == branch) {
            branchData = branchConfig[key as keyof typeof branchConfig]
            return branchData
        }
    }
}

export default getBranchDetails;