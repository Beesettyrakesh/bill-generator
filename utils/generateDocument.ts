"use client";

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
import { getSession } from "next-auth/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PizZipUtils: any = null;

if (typeof window !== 'undefined') {
    import('pizzip/utils/index.js').then(function (r) {
        PizZipUtils = r;
    });
}

function loadFile(url: string, callback: (error: Error | null, content?: unknown) => void) {
    if (!PizZipUtils) {
        const error = new DocumentGenerationError(
            "Template loading failed: PizZipUtils not initialized",
            DocumentErrorType.TEMPLATE_LOADING_ERROR,
            { templateUrl: url }
        );
        callback(error);
        return;
    }

    PizZipUtils.getBinaryContent(url, (error: Error | null, content: ArrayBuffer) => {
        if (error) {
            let errorType = DocumentErrorType.TEMPLATE_LOADING_ERROR;
            let errorMessage = `Failed to load template: ${error.message}`;
            
            if (error.message?.includes('not found') || error.message?.includes('404')) {
                errorType = DocumentErrorType.TEMPLATE_NOT_FOUND;
                errorMessage = `Template file not found: ${url}`;
            } else if (error.message?.includes('network') || error.message?.includes('connection')) {
                errorType = DocumentErrorType.NETWORK_ERROR;
                errorMessage = `Network error while loading template: ${error.message}`;
            }
            
            const templateError = new DocumentGenerationError(
                errorMessage,
                errorType,
                { originalError: error, templateUrl: url }
            );
            callback(templateError);
            return;
        }
        callback(null, content);
    });
}

/**
 * Optional pre-resolved config supplied by callers that already have it
 * cached (e.g. from ConfigContext). When provided, generateDocumentAsBlob
 * skips its internal network fetches for branch/company/session.
 */
export interface ResolvedDocConfig {
    branchDetails: IBranchConfig;
    companyDetails: ICompanyConfig;
    isDemo: boolean;
}

// Function that returns a blob instead of downloading
export const generateDocumentAsBlob = (
    input: IFormValues,
    resolved?: ResolvedDocConfig,
): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        // Use cached config when provided; otherwise fall back to fetching.
        const branchDetails: IBranchConfig = resolved
            ? resolved.branchDetails
            : await getBranchDetails(input.branch)
        const companyDetails: ICompanyConfig = resolved
            ? resolved.companyDetails
            : await getCompanyDetails(branchDetails["company"])

        let url;
        // Use the input date for calculating the previous month
        const selectedDate = new Date(input.date);
        const currYear = selectedDate.getFullYear();
        const prevMonth = getPreviousMonth(input.date);
        const submitDate = convertDate(input.date)
        const template = branchDetails["template"]
        // Calculate month start and end dates based on the selected date
        const monthDate = new Date(selectedDate);
        monthDate.setMonth(monthDate.getMonth() - 1); // Previous month
        const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
        
        const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toLocaleDateString().replaceAll("/", "-");
        const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), lastDay).toLocaleDateString().replaceAll("/", "-");
        
        let finalTotal, totalInWords;
        if (template === "MINUTES") {
            finalTotal = input.total;
            totalInWords = convertToWords(finalTotal, "MINUTES");
        } else {
            finalTotal = roundOffTotal(Number(input.total));
            totalInWords = convertToWords(finalTotal);
        }

        const formattedHours = template === "START_AND_END" ? input.hours : formatHours(input.hours, template)

        let isDemo = false;
        if (resolved) {
            isDemo = resolved.isDemo;
        } else {
            try {
                const session = await getSession();
                isDemo = session?.user?.role === "demo";
            } catch (error) {
                console.error("Error getting session:", error);
            }
        }
        
        const templatePath = isDemo ? 'res/demo/' : 'res/';
        
        if (template == "START_AND_END")
            url = `${templatePath}StartEnd_Template.docx`
        else if (template == "MINUTES")
            url = `${templatePath}Minutes_Template.docx`
        else
            url = `${templatePath}Hours_Template.docx`

        loadFile(url, function (error, content) {
            if (error) {
                console.error('Template loading error:', error);
                reject(error);
                return;
            }
            
            try {
                const zip = new PizZip(content as string | ArrayBuffer);
                const doc = new Docxtemplater(zip, {
                    linebreaks: true,
                    paragraphLoop: true,
                });

                const formattedStartReading = input.startReading ? Number(input.startReading).toFixed(2) : '';
                const formattedEndReading = input.endReading ? Number(input.endReading).toFixed(2) : '';
                
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
                    
                    ...(template === "MINUTES" ? {
                        minutes: input.hours, // For MINUTES, the hours input is actually minutes
                        consumption: branchDetails["consumption"], // Include consumption for reference
                        cpm: formatCpm(branchDetails["cpm"]), // Format cpm to 3 decimal places
                    } : {
                        start: formattedStartReading,
                        end: formattedEndReading,
                        hours: formattedHours,
                        consumption: branchDetails["consumption"],
                    }),
                    
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

                resolve(blob);
            } catch (err) {
                reject(err);
            }
        });
    });
};

export enum DocumentErrorType {
    TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
    TEMPLATE_LOADING_ERROR = 'TEMPLATE_LOADING_ERROR',
    CONVERSION_FAILED = 'CONVERSION_FAILED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    API_ERROR = 'API_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class DocumentGenerationError extends Error {
    type: DocumentErrorType;
    details?: Record<string, unknown>;

    constructor(message: string, type: DocumentErrorType, details?: Record<string, unknown>) {
        super(message);
        this.name = 'DocumentGenerationError';
        this.type = type;
        this.details = details;
    }
}

// Function for direct downloads with PDF conversion
const generateDocument = async (input: IFormValues): Promise<void> => {
    try {
        // Use the generateAndSavePdf function from cloudConvertService
        // This will generate a DOCX blob, convert it to PDF, and save it
        await generateAndSavePdf(input, input.branch, generateDocumentAsBlob);
    } catch (error: unknown) {
        console.error('Error generating document:', error);
        
        // Determine the type of error for more specific messaging
        let errorType = DocumentErrorType.UNKNOWN_ERROR;
        let errorMessage = 'Failed to generate document. Please try again.';
        
        // Convert error to a type with message property if it exists
        const errorWithMessage = error as { message?: string; name?: string };
        
        if (errorWithMessage.message?.includes('template') || errorWithMessage.message?.includes('Template')) {
            errorType = DocumentErrorType.TEMPLATE_NOT_FOUND;
            errorMessage = 'Template file not found. Please check the template configuration.';
        } else if (errorWithMessage.message?.includes('convert') || errorWithMessage.message?.includes('CloudConvert')) {
            errorType = DocumentErrorType.CONVERSION_FAILED;
            errorMessage = 'PDF conversion failed. Please try again or contact support if the issue persists.';
        } else if (errorWithMessage.message?.includes('network') || errorWithMessage.name === 'NetworkError') {
            errorType = DocumentErrorType.NETWORK_ERROR;
            errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (errorWithMessage.message?.includes('API') || errorWithMessage.message?.includes('api')) {
            errorType = DocumentErrorType.API_ERROR;
            errorMessage = 'API error. Please try again later or contact support.';
        }
        
        // Create a custom error with more details
        const documentError = new DocumentGenerationError(
            errorMessage,
            errorType,
            { originalError: errorWithMessage, input }
        );
        
        alert(errorMessage);
        throw documentError;
    }
}

export default generateDocument;
