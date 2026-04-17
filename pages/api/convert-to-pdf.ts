import type { NextApiRequest, NextApiResponse } from 'next';
import { formidable, File } from 'formidable';
import CloudConvert from 'cloudconvert';
import fs from 'fs';
import { promisify } from 'util';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

// Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const readFileAsync = promisify(fs.readFile);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Parse the incoming form data with formidable v3.x
    const form = formidable();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_fields, files] = await form.parse(req);

    // In formidable v3.x, files is an object with arrays of files
    const fileArray = files.file as File[] | undefined;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the first file
    const file = fileArray[0];
    if (!file) {
      return res.status(400).json({ error: 'File upload failed' });
    }

    // Initialize CloudConvert with API key
    const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY as string);

    // Create a job
    const job = await cloudConvert.jobs.create({
      tasks: {
        'import-file': {
          operation: 'import/upload',
        },
        'convert-file': {
          operation: 'convert',
          input: 'import-file',
          output_format: 'pdf',
          engine: 'libreoffice',
          timeout: 120,
        },
        'export-file': {
          operation: 'export/url',
          input: 'convert-file',
        },
      },
    });

    // Upload the file
    const uploadTask = job.tasks.filter((task) => task.name === 'import-file')[0];
    // In formidable v3.x, the file path is in file.filepath
    const inputFile = await readFileAsync(file.filepath);
    // In formidable v3.x, the original filename is in file.originalFilename
    const originalFilename = file.originalFilename || 'document.docx';
    await cloudConvert.tasks.upload(uploadTask, inputFile as unknown as Uint8Array, originalFilename);

    // Wait for the job to finish
    const jobResult = await cloudConvert.jobs.wait(job.id);

    // Get the export task
    const exportTask = jobResult.tasks.filter((task) => task.name === 'export-file')[0];
    const fileUrl = (exportTask.result as { files: { url: string }[] }).files[0].url;

    // Download the converted file
    const response = await fetch(fileUrl);
    const pdfBuffer = await response.arrayBuffer();

    // Return the PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${originalFilename.replace('.docx', '.pdf')}`
    );
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Error in PDF conversion:', error);
    const err = error as { message?: string };
    res.status(500).json({ error: 'PDF conversion failed', details: err.message });
  }
}
