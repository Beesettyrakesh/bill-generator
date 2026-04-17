# Bill Generator

A Next.js web application for streamlined bill generation for power system companies, enabling automated creation of standardized bills across multiple branches with different templates.

## Overview

The Bill Generator application automates and standardizes the billing process for diesel generator usage across multiple branches of power system companies. It reduces manual effort, ensures calculation accuracy, and maintains consistency in bill generation.

![Bill Generator Screenshot](https://via.placeholder.com/800x450.png?text=Bill+Generator+Screenshot)

## Features

- **Branch-specific Bill Generation**: Generate bills tailored to each branch's specific requirements
- **Multiple Template Support**: Accommodates different billing formats:
  - Hours-based billing
  - Minutes-based billing
  - Start/End meter reading-based billing
- **Automatic Calculations**: Calculates total amounts based on usage and current fuel prices
- **Document Generation**: Creates downloadable DOCX and PDF files with all required billing information
- **Batch Processing**: Select and download multiple bills simultaneously
- **Input Validation**: Ensures all required fields are properly filled before bill generation
- **Fuel Price Caching**: Remembers previously used fuel prices for each branch
- **Visual Feedback**: Loading indicators during document generation
- **Error Handling**: Detailed error messages for troubleshooting

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Document Processing**: Docxtemplater, PizZip, File-saver
- **PDF Conversion**: CloudConvert API
- **State Management**: React Context API
- **Styling**: CSS Modules, Tailwind CSS
- **Testing**: Jest, React Testing Library

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bill-generator.git
   cd bill-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your local environment file by copying the provided example and filling in the values:
   ```bash
   cp .env.example .env.local
   ```
   The example documents every required variable — NextAuth, MongoDB, AWS (DynamoDB), and CloudConvert. `.env.local` is gitignored and must never be committed.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

### Generating a Single Bill

1. Select the branch from the table
2. Fill in the required fields:
   - Date
   - For START_AND_END template: Start reading and End reading
   - For HOURS template: Hours
   - For MINUTES template: Minutes
   - Fuel price
3. The total amount will be calculated automatically
4. Click "Generate" to create and download the bill

### Batch Processing

1. Fill in the details for a branch
2. Click "Add" to add the bill to the queue
3. Repeat for other branches as needed
4. Use the Document List to download all bills at once

## Project Structure

```
bill-generator/
├── app/                    # Next.js app directory
├── components/             # React components
├── config/                 # Configuration files
├── contexts/               # React contexts
├── css/                    # Component-specific CSS
├── interfaces/             # TypeScript interfaces
├── pages/api/              # API routes
├── public/res/             # Document templates
├── utils/                  # Utility functions
└── __tests__/              # Test files
```

## Configuration

### Branch Configuration

Branch-specific settings are stored in `branches.json` and `config/branchConfig.ts`. To add a new branch:

1. Add the branch details to `branches.json`
2. Update the branch configuration in `config/branchConfig.ts`
3. Update company details in `config/companyConfig.ts` if needed

### Document Templates

Document templates are stored in `public/res/` directory:
- `Hours_Template.docx`: For hours-based billing
- `Minutes_Template.docx`: For minutes-based billing
- `StartEnd_Template.docx`: For start/end reading-based billing

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Deployment

The application is deployed on Vercel. To deploy your own instance:

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/) for the React framework
- [Docxtemplater](https://docxtemplater.com/) for document generation
- [CloudConvert](https://cloudconvert.com/) for PDF conversion
- [Tailwind CSS](https://tailwindcss.com/) for styling
