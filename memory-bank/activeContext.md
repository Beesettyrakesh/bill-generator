# Active Context: Bill Generator

## Current Work Focus

The Bill Generator application is currently in a functional state with core features implemented. The application allows users to:

1. Generate bills for multiple branches across different companies
2. Calculate billing amounts based on branch-specific consumption rates
3. Support different billing templates (hours, minutes, start/end readings)
4. Queue multiple bills for batch download
5. Validate user inputs before bill generation

The current focus is on:

- Ensuring all branch configurations are correctly implemented
- Improving the user interface for better usability
- Enhancing document generation capabilities
- Implementing comprehensive error handling
- Improving project documentation

## Recent Changes

1. **Authentication Navigation Improvements**:
   - Fixed browser history navigation issues with authentication
   - Added cache control headers to middleware redirects to prevent caching
   - Updated login page to use router.replace() instead of router.push()
   - Added client-side authentication checks to redirect authenticated users from login page
   - Fixed browser back/forward button navigation issues for authenticated users

2. **Calculation and Formatting Improvements**:
   - Enhanced formatHours.ts to handle START_AND_END template differently
   - For START_AND_END template: converts decimal hours to hours.minutes format (5.5 -> 05.30)
   - For other templates: keeps decimal format (5.5 -> 05.50)
   - Verified calculation logic in calculateTotal.ts is working correctly
   - Updated generateDocument.ts to handle formatted hours correctly

3. **User Authentication Implementation and Improvements**:
   - Implemented user authentication with NextAuth.js
   - Added demo mode for recruiters to access the application without credentials
   - Created login page with regular and demo login options
   - Added logout functionality with user display in the header
   - Fixed hydration errors during logout by:
     - Splitting the layout into server and client components
     - Conditionally rendering the UserNav component only when not on the login page
     - Implementing proper separation of server and client-side code

2. **Removed Client-side PDF Generation**:
   - Removed `utils/docxToPdf.ts` file that contained client-side PDF generation using pdf-lib
   - Removed `utils/pdfUtils.ts` file that contained similar functionality
   - Removed the pdf-lib dependency from package.json
   - Now exclusively using server-side PDF generation through CloudConvert API

2. **README.md Overhaul**:
   - Completely rewrote the project README to provide comprehensive documentation
   - Added detailed sections on features, installation, usage, and project structure
   - Included configuration instructions and development guidelines
   - Added contributing guidelines and acknowledgements

2. **Enhanced Error Handling**:
   - Created custom DocumentGenerationError class with specific error types
   - Implemented intelligent error detection and specific error messages
   - Updated both document generation functions to use the new error handling system
   - Fixed ESLint errors by replacing 'any' types with proper TypeScript types

3. **UI Improvements**:
   - Changed font family to Arial (sans-serif) for the whole website
   - Added visual feedback during document generation with "Generating..." button text
   - Improved form validation feedback

4. **PDF Conversion Implementation**:
   - Added PDF generation functionality using CloudConvert API
   - Fixed formidable import issue in API route (`import { formidable } from 'formidable'`)
   - Optimized credit usage by switching from 'office' engine (2 credits) to 'libreoffice' engine (1 credit)
   - Implemented proper error handling with fallback to DOCX when PDF conversion fails
   - Created test HTML page for direct testing of the PDF conversion API

5. **Input Validation**: Added comprehensive validation for all input fields
6. **Batch Processing**: Implemented the ability to queue and download multiple bills
7. **Hours Formatting**: Added formatting for hours display in generated documents
8. **MINUTES Template Enhancements**:
   - Fixed consumption value display in MINUTES template documents
   - Added formatCpm utility to ensure cpm values always display with 3 decimal places
   - Standardized document generation between direct download and batch processing
   - Updated input placeholder to show "Minutes" instead of "Hours" for MINUTES template branches

9. **Meter Reading Formatting**:
   - Implemented formatting for meter readings to always show two decimal places
   - Added null checks to handle empty input values

## Next Steps

### Short-term Tasks

1. **Implement Bill History Feature**:
   - Install AWS SDK for DynamoDB
   - Create DynamoDB table for bill history with TTL for 12-month retention
   - Implement backend API endpoints for saving and retrieving bills
   - Create history page UI with month and branch filtering
   - Integrate with existing document generation flow
   - Add navigation to the history page

2. **Further Enhance Error Handling**:
   - Add UI components for displaying error states
   - Implement better error recovery mechanisms

3. **Improve Responsive Design**:
   - Ensure the application works well on mobile devices
   - Optimize table layout for smaller screens

4. **Enhance PDF Support**:
   - Add preview functionality for generated PDF documents
   - Implement caching for frequently generated documents
   - Explore batch PDF merging to further optimize credit usage

### Medium-term Goals

1. **User Authentication**:
   - Add basic authentication for user access
   - Implement role-based permissions

2. **Data Persistence**:
   - Add option to save frequently used values
   - Implement history of generated bills

3. **Enhanced Batch Processing**:
   - Add option to merge multiple bills into a single document
   - Implement ZIP download for multiple documents

### Long-term Vision

1. **Integration Capabilities**:
   - API for integration with other systems
   - Export/import functionality for configurations

2. **Advanced Reporting**:
   - Generate reports based on billing history
   - Visualization of billing trends

3. **Multi-tenant Support**:
   - Support for multiple organizations
   - Custom branding per organization

## Active Decisions and Considerations

### Technical Decisions

1. **Client-side Processing**:
   - Decision: Keep all processing client-side
   - Consideration: Simplifies deployment but limits some capabilities
   - Status: Maintained for current version

2. **Document Template Approach**:
   - Decision: Use DOCX templates with placeholders
   - Consideration: Evaluating more dynamic template options
   - Status: Working well but considering enhancements

3. **State Management**:
   - Decision: Use React Context API for state management
   - Consideration: May need more robust solution as app grows
   - Status: Sufficient for current needs

4. **Error Handling Approach**:
   - Decision: Use custom error types with specific error messages
   - Consideration: Balancing detailed error information with user-friendly messages
   - Status: Recently implemented, monitoring effectiveness

### UX Decisions

1. **Table-based Interface**:
   - Decision: Use table layout for branch data entry
   - Consideration: May become unwieldy with many branches
   - Status: Works well for current number of branches

2. **Validation Approach**:
   - Decision: Immediate feedback on field-level validation
   - Consideration: Balance between immediate feedback and intrusiveness
   - Status: Current approach working well

3. **Batch Processing UI**:
   - Decision: Separate list for queued documents
   - Consideration: Exploring more integrated approaches
   - Status: Functional but could be improved

4. **Typography and Styling**:
   - Decision: Changed to Arial (sans-serif) font family
   - Consideration: Improved readability and modern appearance
   - Status: Recently implemented, monitoring user feedback

## Important Patterns and Preferences

### Code Organization

- Component-based architecture with clear separation of concerns
- Utility functions for reusable logic
- TypeScript interfaces for type safety
- CSS modules for component-specific styling
- Custom error types for better error handling

### Naming Conventions

- PascalCase for React components and interfaces
- camelCase for variables, functions, and file names
- Descriptive names that clearly indicate purpose

### Development Practices

- Type safety with TypeScript
- Component-level testing
- Utility function unit testing
- Clear error handling patterns
- Comprehensive documentation

## Learnings and Project Insights

### What's Working Well

1. **Template-based Document Generation**:
   - Docxtemplater provides flexible and reliable document generation
   - Template approach allows for easy customization

2. **React Context for State Management**:
   - Simple but effective for current needs
   - Easy to understand and maintain

3. **TypeScript Integration**:
   - Improves code quality and developer experience
   - Catches potential issues early

4. **Custom Error Handling**:
   - Provides more specific error messages
   - Improves debugging and user experience

### Challenges and Solutions

1. **Challenge**: Different billing templates for different branches
   - **Solution**: Template factory pattern with branch-specific configurations

2. **Challenge**: Complex calculations based on branch-specific rates
   - **Solution**: Centralized calculation logic with branch parameters

3. **Challenge**: Client-side document generation limitations
   - **Solution**: Optimized template loading and processing

4. **Challenge**: Inconsistent formatting in generated documents
   - **Solution**: Created specialized formatting utilities (formatHours, formatCpm) to ensure consistent display

5. **Challenge**: Generic error messages
   - **Solution**: Implemented custom error types with specific error messages

### Future Considerations

1. **Scalability**:
   - How to handle a growing number of branches and companies
   - Potential for configuration management UI

2. **Performance**:
   - Optimizing document generation for larger batches
   - Improving loading times for template resources

3. **Feature Expansion**:
   - Potential for additional document types
   - Integration with accounting or ERP systems

4. **Documentation**:
   - Keeping documentation up-to-date with new features
   - Creating user guides and developer documentation
