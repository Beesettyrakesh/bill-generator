# PDF Conversion Implementation

This document provides instructions on how to test the PDF generation functionality using CloudConvert API.

## Setup

1. **CloudConvert API Key**
   - Sign up for a CloudConvert account at [cloudconvert.com](https://cloudconvert.com)
   - Get your API key from the CloudConvert dashboard
   - Add your API key to the `.env.local` file:
     ```
     CLOUDCONVERT_API_KEY=your_api_key_here
     ```

2. **Environment Variables**
   - Make sure the `.env.local` file is in the root directory of the project
   - For production deployment, add the environment variable to your hosting platform

## Testing

1. **Start the Development Server**
   ```
   npm run dev
   ```

2. **Test Individual Document Generation**
   - Fill out the form with the required information
   - Select a branch
   - Click "Generate Document"
   - The application will generate a DOCX file, convert it to PDF, and download it
   - If the PDF conversion fails, it will fall back to downloading the DOCX file

3. **Test Batch Document Generation**
   - Fill out the form for multiple branches
   - Add each document to the list
   - Click "Download PDF Documents"
   - The application will generate PDF files for each document and download them
   - If any PDF conversion fails, it will fall back to downloading the DOCX file for that document

4. **Test API Directly**
   - A test script is provided in the `test-scripts` directory
   - Navigate to the test-scripts directory:
     ```
     cd test-scripts
     ```
   - Install dependencies:
     ```
     npm install
     ```
   - Run the test script:
     ```
     npm test
     ```
   - The script will send a test DOCX file to the API and save the converted PDF

## Testing Different Templates

The application supports three template types:

1. **HOURS Template**
   - Used for branches with hourly billing
   - Test with branches that use the HOURS template

2. **MINUTES Template**
   - Used for branches with minute-based billing
   - Test with branches that use the MINUTES template

3. **START_AND_END Template**
   - Used for branches with start and end readings
   - Test with branches that use the START_AND_END template

## Troubleshooting

If you encounter any issues with PDF conversion:

1. **Check API Key**
   - Verify that your CloudConvert API key is correct
   - Check that the API key is properly set in the `.env.local` file

2. **Check API Limits**
   - CloudConvert has usage limits on their free tier
   - Check your CloudConvert dashboard for usage statistics

3. **Check Network**
   - Ensure your application can make outbound HTTP requests
   - Check browser console for any network errors

4. **Check File Size**
   - Very large DOCX files might take longer to convert
   - The API has a timeout of 120 seconds for conversion

5. **Formidable Import Issues**
   - If you see errors like `formidable__WEBPACK_IMPORTED_MODULE_0__.default.IncomingForm is not a constructor`, check that formidable is imported correctly:
   ```javascript
   // Correct import for formidable v3.x
   import { formidable } from 'formidable';
   
   // Correct usage for formidable v3.x
   const form = formidable();
   const [fields, files] = await form.parse(req);
   ```

## Implementation Details

The PDF conversion functionality is implemented using the following components:

1. **API Route**: `pages/api/convert-to-pdf.js`
   - Handles file uploads using formidable
   - Sends the file to CloudConvert for conversion
   - Returns the converted PDF

2. **Frontend Service**: `utils/cloudConvertService.js`
   - Provides functions for converting DOCX to PDF
   - Handles error fallback to DOCX when conversion fails

3. **Document Generation**: `utils/generateDocument.ts`
   - Generates DOCX documents from templates
   - Uses the cloudConvertService to convert to PDF

4. **Batch Processing**: `components/DocumentList.tsx`
   - Handles batch document generation and conversion
   - Downloads multiple PDF files
