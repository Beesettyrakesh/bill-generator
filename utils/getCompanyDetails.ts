import {ICompanyConfig} from "@/interfaces/ICompanyConfig";
import {companyConfig} from "@/config/companyConfig";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const getCompanyDetails = (company: string): ICompanyConfig => {
    let companyData: ICompanyConfig
    const keys = Object.keys(companyConfig);
    for (const key of keys) {
        if (key == company) {
            companyData = companyConfig[key as keyof typeof companyConfig]
            return companyData
        }
    }
}

export default getCompanyDetails;