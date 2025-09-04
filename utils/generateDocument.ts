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

// Define a variable for PizZipUtils
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PizZipUtils: any = null;

if (typeof window !== 'undefined') {
    import('pizzip/utils/index.js').then(function (r) {
        PizZipUtils = r;
    });
}

// Improved loadFile function with better error handling
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
            // Create more specific error based on the nature of the failure
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

// Function that returns a blob instead of downloading
export const generateDocumentAsBlob = (input: IFormValues): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
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
        const formattedHours = formatHours(input.hours, template)

        // Get session to determine if user is in demo mode
        let isDemo = false;
        try {
            const session = await getSession();
            isDemo = session?.user?.role === "demo";
        } catch (error) {
            console.error("Error getting session:", error);
        }
        
        // Use demo templates for demo users, regular templates for others
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
                // Cast content to appropriate type for PizZip
                const zip = new PizZip(content as string | ArrayBuffer);
                const doc = new Docxtemplater(zip, {
                    linebreaks: true,
                    paragraphLoop: true,
                });

                // Format meter readings to always show two decimal places
                const formattedStartReading = input.startReading ? Number(input.startReading).toFixed(2) : '';
                const formattedEndReading = input.endReading ? Number(input.endReading).toFixed(2) : '';
                
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
                        start: formattedStartReading,
                        end: formattedEndReading,
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

// Error types for more specific error handling
export enum DocumentErrorType {
    TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
    TEMPLATE_LOADING_ERROR = 'TEMPLATE_LOADING_ERROR',
    CONVERSION_FAILED = 'CONVERSION_FAILED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    API_ERROR = 'API_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Custom error class for document generation
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
        
        // Show a more specific alert message to the user
        alert(errorMessage);
        
        // Re-throw the custom error so it can be caught by the caller
        throw documentError;
    }
}

export default generateDocument;
