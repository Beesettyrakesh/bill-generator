# Technical Context: Bill Generator

## Technology Stack

### Frontend Framework
- **Next.js**: React framework for server-side rendering and static site generation
- **React**: UI component library for building the user interface
- **TypeScript**: Typed superset of JavaScript for improved developer experience and code quality

### Authentication
- **NextAuth.js**: Authentication framework for Next.js applications
- **bcrypt**: Library for secure password hashing
- **JWT**: JSON Web Tokens for secure authentication
- **Middleware**: Next.js middleware for route protection

### Styling
- **CSS Modules**: Component-scoped CSS to prevent style conflicts
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

### Document Processing
- **Docxtemplater**: Library for generating DOCX documents from templates
- **PizZip**: Library for working with ZIP files (used by Docxtemplater)
- **File-saver**: Library for saving files on the client-side
- **CloudConvert API**: Third-party service for converting DOCX to PDF (server-side only)
- **Formidable**: Node.js module for parsing form data, used in API routes

### State Management
- **React Context API**: Built-in React state management for sharing state between components

### Server-side Processing
- **Next.js API Routes**: Serverless functions for handling API requests
- **CloudConvert SDK**: Official SDK for interacting with CloudConvert API

### Testing
- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing utilities for React components

## Key Dependencies

```json
{
  "dependencies": {
    "bcrypt": "^5.x.x",
    "cloudconvert": "^3.0.0",
    "docxtemplater": "^3.x.x",
    "file-saver": "^2.x.x",
    "formidable": "^3.5.4",
    "next": "^14.x.x",
    "next-auth": "^4.x.x",
    "pizzip": "^3.x.x",
    "react": "^18.x.x",
    "react-dom": "^18.x.x"
  },
  "devDependencies": {
    "@types/jest": "^29.x.x",
    "@types/node": "^18.x.x",
    "@types/react": "^18.x.x",
    "autoprefixer": "^10.x.x",
    "eslint": "^8.x.x",
    "jest": "^29.x.x",
    "postcss": "^8.x.x",
    "tailwindcss": "^3.x.x",
    "typescript": "^5.x.x"
  }
}
```

## Development Environment

### Required Tools
- **Node.js**: JavaScript runtime
- **npm/yarn**: Package managers for JavaScript
- **Git**: Version control system

### Development Workflow
1. Local development using `npm run dev`
2. Type checking with TypeScript
3. Linting with ESLint
4. Testing with Jest
5. Building for production with `npm run build`

## File Structure

```
bill-generator/
├── app/                    # Next.js app directory
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout component
│   ├── page.tsx            # Main page component
│   ├── providers.tsx       # Auth providers wrapper
│   └── login/              # Login page directory
│       └── page.tsx        # Login page component
├── components/             # React components
│   ├── DocumentList.tsx    # Component for managing selected documents
│   ├── DemoModeIndicator.tsx # Component for showing demo mode banner
│   ├── Table.tsx           # Table container component
│   ├── TableRow.tsx        # Component for individual branch rows
│   └── UserNav.tsx         # Component for user info and logout button
├── config/                 # Configuration files
│   ├── branchConfig.ts     # Branch-specific configurations
│   └── companyConfig.ts    # Company-specific configurations
├── contexts/               # React contexts
│   └── DocumentContext.tsx # Context for managing selected documents
├── css/                    # Component-specific CSS
│   ├── DocumentList.css    # Styles for DocumentList component
│   ├── Table.css           # Styles for Table component
│   └── TableRow.css        # Styles for TableRow component
├── interfaces/             # TypeScript interfaces
│   ├── IBankBranch.ts      # Interface for branch data
│   ├── IBranchConfig.ts    # Interface for branch configuration
│   ├── ICompanyConfig.ts   # Interface for company configuration
│   └── IFormValues.ts      # Interface for form values
├── pages/                  # Next.js pages directory
│   └── api/                # API routes
│       ├── convert-to-pdf.js # PDF conversion API route
│       └── auth/           # Authentication API routes
│           └── [...nextauth].js # NextAuth.js configuration
├── public/                 # Static assets
│   └── res/                # Document templates
│       ├── Hours_Template.docx
│       ├── Minutes_Template.docx
│       └── StartEnd_Template.docx
├── utils/                  # Utility functions
│   ├── calculateTotal.ts   # Calculate bill total
│   ├── convertDate.ts      # Date conversion utilities
│   ├── convertToWords.ts   # Convert numbers to words
│   ├── cloudConvertService.js # Service for PDF conversion using CloudConvert API
│   ├── downloadDocx.ts     # Download DOCX files
│   ├── formatCpm.ts        # Format consumption per minute with 3 decimal places
│   ├── formatHours.ts      # Format hours display
│   ├── generateDocument.ts # Generate document from template
│   ├── getBranchDetails.ts # Get branch configuration
│   ├── getCompanyDetails.ts# Get company configuration
│   ├── getPreviousMonth.ts # Get previous month name
│   ├── mergeDocx.ts        # Merge multiple DOCX files
│   └── roundOffTotal.ts    # Round off total amount
├── __tests__/              # Test files
│   ├── calculateTotalTest.ts
│   └── convertToWordsTest.ts
├── auth-config.js          # Authentication user configuration
├── branches.json           # Branch data
├── jest.config.ts          # Jest configuration
├── jest.setup.ts           # Jest setup
├── middleware.ts           # Next.js middleware for route protection
├── next.config.mjs         # Next.js configuration
├── package.json            # Project dependencies
├── postcss.config.mjs      # PostCSS configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Technical Constraints

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- No support required for Internet Explorer

### Performance Considerations
- Document generation happens client-side
- Template loading may require optimization for larger templates
- Batch processing limited by browser memory constraints
- PDF conversion happens server-side via CloudConvert API
- CloudConvert API has usage limits (10 free credits per day)
- LibreOffice engine uses 1 credit per conversion (optimized from Office engine's 2 credits)

### Security Considerations
- Document generation happens client-side
- PDF conversion happens server-side via CloudConvert API
- API key stored securely in environment variables
- No persistent server-side storage of generated documents
- Temporary file storage during conversion process
- No sensitive data transmission beyond document content
- Authentication using secure JWT tokens
- Password hashing with bcrypt for secure credential storage
- Protected routes via Next.js middleware
- Session management via NextAuth.js
- Demo mode with limited access for recruiters

## Data Flow Architecture

### Authentication Flow
1. User enters credentials on login page or clicks "Access Demo"
2. Credentials sent to NextAuth.js API route
3. NextAuth.js verifies credentials against auth-config.js
4. JWT token generated and stored in cookies
5. User redirected to home page
6. Protected routes check authentication via middleware
7. User session maintained via NextAuth.js session management
8. Logout clears session and redirects to login page

### Configuration Data Flow
1. Branch data loaded from `branches.json`
2. Detailed branch configurations from `branchConfig.ts`
3. Company details from `companyConfig.ts`

### Document Generation Flow
1. User inputs captured in component state
2. Data validated using field-specific validation rules
3. Total calculated based on branch-specific consumption rates
4. Document template selected based on branch template type
5. Template loaded and populated with data
6. DOCX document generated client-side
7. For PDF output:
   a. DOCX sent to server-side API route
   b. API route sends DOCX to CloudConvert for conversion using the CloudConvert API
   c. Converted PDF returned to client
   d. Fallback to DOCX if conversion fails
8. Generated document saved or added to batch queue

## Build and Deployment

### Build Process
```
npm run build
```
- TypeScript compilation
- Next.js optimization
- Static asset copying

### Deployment Options
- Vercel deployment for serverless functions (recommended for API routes)
- Other serverless platforms supporting Next.js API routes
- Docker containerization for custom hosting
- Environment variables required for CloudConvert API key

## Technical Debt and Considerations

1. **Type Safety**: Some areas use `@ts-expect-error` which could be improved
2. **Error Handling**: Error handling could be enhanced in document generation
3. **Testing Coverage**: Increase test coverage for critical utility functions
4. **Responsive Design**: Ensure full mobile compatibility
5. **Accessibility**: Improve accessibility compliance
6. **PDF Conversion Optimization**: 
   - Explore batch conversion to reduce API credit usage
   - Implement caching for frequently generated documents
   - Consider alternative conversion engines based on document complexity
7. **API Error Handling**: Improve error handling for CloudConvert API failures
8. **Authentication Enhancements**:
   - User registration functionality
   - Password reset capabilities
   - More granular role-based permissions
   - Enhanced session management
   - User preferences storage
9. **React Hydration**:
   - Continue monitoring for hydration errors during authentication state changes
   - Ensure proper separation of server and client components
   - Implement consistent conditional rendering patterns
