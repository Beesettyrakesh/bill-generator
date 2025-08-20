/**
 * Test script for PDF conversion API
 * 
 * This script tests the PDF conversion API by sending a DOCX file to the API endpoint
 * and saving the converted PDF file.
 * 
 * Usage:
 * 1. Make sure the development server is running (npm run dev)
 * 2. Run this script with Node.js: node --experimental-modules test-pdf-conversion.js
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to a test DOCX file
const docxFilePath = path.join(__dirname, '..', 'public', 'res', 'Hours_Template.docx');
// Output path for the converted PDF
const pdfOutputPath = path.join(__dirname, 'test-output.pdf');

async function testPdfConversion() {
  try {
    console.log('Starting PDF conversion test...');
    
    // Check if the DOCX file exists
    if (!fs.existsSync(docxFilePath)) {
      console.error(`DOCX file not found: ${docxFilePath}`);
      return;
    }
    
    // Create form data with the DOCX file
    const form = new FormData();
    form.append('file', fs.createReadStream(docxFilePath), 'test.docx');
    
    console.log('Sending DOCX file to conversion API...');
    
    // Send the file to the API endpoint
    const response = await fetch('http://localhost:3000/api/convert-to-pdf', {
      method: 'POST',
      body: form
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Conversion failed: ${response.statusText}`);
      console.error('Error details:', errorData);
      return;
    }
    
    console.log('Conversion successful! Saving PDF file...');
    
    // Get the PDF blob from the response
    const pdfBuffer = await response.buffer();
    
    // Save the PDF file
    fs.writeFileSync(pdfOutputPath, pdfBuffer);
    
    console.log(`PDF file saved to: ${pdfOutputPath}`);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testPdfConversion();
