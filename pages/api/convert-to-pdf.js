import { formidable } from 'formidable';
import CloudConvert from 'cloudconvert';
import fs from 'fs';
import { promisify } from 'util';

// Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const readFileAsync = promisify(fs.readFile);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the incoming form data with formidable v3.x
    const form = formidable();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [fields, files] = await form.parse(req);
    
    // In formidable v3.x, files is an object with arrays of files
    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Get the first file
    const file = fileArray[0];
    if (!file) {
      return res.status(400).json({ error: 'File upload failed' });
    }

    // Initialize CloudConvert with API key
    const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);
    
    // Create a job
    const job = await cloudConvert.jobs.create({
      tasks: {
        'import-file': {
          operation: 'import/upload'
        },
        'convert-file': {
          operation: 'convert',
          input: 'import-file',
          output_format: 'pdf',
          engine: 'libreoffice',
          timeout: 120
        },
        'export-file': {
          operation: 'export/url',
          input: 'convert-file'
        }
      }
    });
    
    // Upload the file
    const uploadTask = job.tasks.filter(task => task.name === 'import-file')[0];
    // In formidable v3.x, the file path is in file.filepath
    const inputFile = await readFileAsync(file.filepath);
    // In formidable v3.x, the original filename is in file.originalFilename
    const originalFilename = file.originalFilename || 'document.docx';
    await cloudConvert.tasks.upload(uploadTask, inputFile, originalFilename);
    
    // Wait for the job to finish
    const jobResult = await cloudConvert.jobs.wait(job.id);
    
    // Get the export task
    const exportTask = jobResult.tasks.filter(task => task.name === 'export-file')[0];
    const fileUrl = exportTask.result.files[0].url;
    
    // Download the converted file
    const response = await fetch(fileUrl);
    const pdfBuffer = await response.arrayBuffer();
    
    // Return the PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${originalFilename.replace('.docx', '.pdf')}`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Error in PDF conversion:', error);
    res.status(500).json({ error: 'PDF conversion failed', details: error.message });
  }
}
