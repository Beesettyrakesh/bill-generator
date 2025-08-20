import {IFormValues} from "@/interfaces/IFormValues";
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {saveAs} from 'file-saver';
import {IBranchConfig} from "@/interfaces/IBranchConfig";
import {ICompanyConfig} from "@/interfaces/ICompanyConfig";
import getBranchDetails from "@/utils/getBranchDetails";
import getCompanyDetails from "@/utils/getCompanyDetails";
import getPreviousMonth from "@/utils/getPreviousMonth";
import convertDate from "@/utils/convertDate";
import roundOffTotal from "@/utils/roundOffTotal";
import convertToWords from "@/utils/convertToWords";
import formatHours from "@/utils/formatHours";
import formatCpm from "@/utils/formatCpm";
import { generateAndSavePdf } from "@/utils/cloudConvertService";

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

// Function that returns a blob instead of downloading
export const generateDocumentAsBlob = (input: IFormValues): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const branchDetails: IBranchConfig = getBranchDetails(input.branch)
        const companyDetails: ICompanyConfig = getCompanyDetails(branchDetails["company"])

        let url;
        const date = new Date()
        const currYear = date.getFullYear();
        const prevMonth = getPreviousMonth()
        const submitDate = convertDate(input.date)
        const template = branchDetails["template"]
        const endDate = new Date(date.setDate(0)).toLocaleDateString().replaceAll("/", "-")
        const startDate = new Date(date.setDate(1)).toLocaleDateString().replaceAll("/", "-")
        
        // Handle MINUTES template differently
        let finalTotal, totalInWords;
        if (template === "MINUTES") {
            // For MINUTES template, don't round off
            finalTotal = input.total;
            // Include paisa in words
            totalInWords = convertToWords(finalTotal, "MINUTES");
        } else {
            // For other templates, use existing logic
            finalTotal = roundOffTotal(Number(input.total));
            totalInWords = convertToWords(finalTotal);
        }
        
        // Format hours to display in HH.MM format
        const formattedHours = formatHours(input.hours)

        if (template == "START_AND_END")
            url = 'res/StartEnd_Template.docx'
        else if (template == "MINUTES")
            url = 'res/Minutes_Template.docx'
        else
            url = 'res/Hours_Template.docx'

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        loadFile(url, function (error, content) {
            if (error) {
                reject(error);
                return;
            }
            
            try {
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
                    
                    // Conditional fields based on template
                    ...(template === "MINUTES" ? {
                        // MINUTES template specific fields
                        minutes: input.hours, // For MINUTES, the hours input is actually minutes
                        consumption: branchDetails["consumption"], // Include consumption for reference
                        cpm: formatCpm(branchDetails["cpm"]), // Format cpm to 3 decimal places
                    } : {
                        // Other templates
                        start: input.startReading,
                        end: input.endReading,
                        hours: formattedHours,
                        consumption: branchDetails["consumption"],
                    }),
                    
                    // Common fields
                    fuelPrice: input.fuelPrice,
                    total: input.total,
                    roundOff: finalTotal,
                    totalInWords: totalInWords,
                    totalInWordsWithPaisa: totalInWords,
                    account: companyDetails["account"]
                });

                const blob = doc.getZip().generate({
                    type: 'blob',
                    mimeType:
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                });

                // Resolve with the blob instead of saving
                resolve(blob);
            } catch (err) {
                reject(err);
            }
        });
    });
};

// Function for direct downloads with PDF conversion
const generateDocument = async (input: IFormValues) => {
    try {
        // Use the generateAndSavePdf function from cloudConvertService
        // This will generate a DOCX blob, convert it to PDF, and save it
        await generateAndSavePdf(input, input.branch, generateDocumentAsBlob);
    } catch (error) {
        console.error('Error generating document:', error);
        alert('Failed to generate document. Please try again.');
    }
}

export default generateDocument;
