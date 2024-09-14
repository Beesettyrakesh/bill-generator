import {IFormValues} from "@/interfaces/IFormValues";
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import {saveAs} from 'file-saver';
import {IBranchConfig} from "@/interfaces/IBranchConfig";
import {ICompanyConfig} from "@/interfaces/ICompanyConfig";
import getBranchDetails from "@/utils/getBranchDetails";
import getCompanyDetails from "@/utils/getCompanyDetails";
import getPreviousMonth from "@/utils/getPreviousMonth";
import convertDate from "@/utils/convertDate";
import roundOffTotal from "@/utils/roundOffTotal";
import convertToWords from "@/utils/convertToWords";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
let PizZipUtils = null;

if (typeof window !== 'undefined') {
    import('pizzip/utils/index.js').then(function (r) {
        PizZipUtils = r;
    });
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
function loadFile(url, callback) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    PizZipUtils.getBinaryContent(url, callback);
}

const generateDocument = (input: IFormValues) => {

    const branchDetails: IBranchConfig = getBranchDetails(input.branch)
    const companyDetails: ICompanyConfig = getCompanyDetails(branchDetails["company"])

    let url;
    const date = new Date()
    const currYear = date.getFullYear();
    const prevMonth = getPreviousMonth()
    const submitDate = convertDate(input.date)
    const finalTotal = roundOffTotal(Number(input.total))
    const endDate = new Date(date.setDate(0)).toLocaleDateString().replaceAll("/", "-")
    const startDate = new Date(date.setDate(1)).toLocaleDateString().replaceAll("/", "-")
    const totalInWords = convertToWords(finalTotal)
    const template = branchDetails["template"]

    if (template == "START_AND_END")
        url = 'res/StartEnd_Template.docx'
    else
        url = 'res/Hours_Template.docx'

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    loadFile(url, function (error, content) {
        if (error) {
            throw error;
        }
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            linebreaks: true,
            paragraphLoop: true,
        });

        // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        doc.render({
            contact: companyDetails["contact"],
            company: branchDetails["company"],
            address: companyDetails["address"],
            date: submitDate,
            toBranch: input.branch,
            branch: input.branch.toLocaleUpperCase(),
            genCapacity: branchDetails["genCapacity"],
            month: prevMonth,
            year: currYear,
            monthEnd: endDate,
            monthStart: startDate,
            start: input.startReading,
            end: input.endReading,
            hours: input.hours,
            consumption: branchDetails["consumption"],
            fuelPrice: input.fuelPrice,
            total: input.total,
            roundOff: finalTotal,
            totalInWords: totalInWords,
            account: companyDetails["account"]
        });

        const blob = doc.getZip().generate({
            type: 'blob',
            mimeType:
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        // Output the document using Data-URI
        saveAs(blob, `${input.branch}.docx`);
    });
}

export default generateDocument;