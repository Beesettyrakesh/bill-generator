# System Patterns: Bill Generator

## System Architecture

The Bill Generator application follows a modern React-based architecture using Next.js framework. The architecture is organized into the following key layers:

### 1. Presentation Layer
- React components for UI rendering
- CSS modules for component-specific styling
- Context API for state management across components

### 2. Business Logic Layer
- Utility functions for calculations and data transformations
- Document generation logic
- Validation rules
- Authentication logic

### 3. Data Layer
- JSON configuration files for branch and company data
- Context-based state management for document queue
- Authentication state management with NextAuth.js

## Key Design Patterns

### 1. Component Pattern
The UI is built using reusable React components that encapsulate specific functionality:
- `Table`: Container component for displaying all branches
- `TableRow`: Component for individual branch data entry and actions
- `DocumentList`: Component for managing selected documents

### 2. Context Provider Pattern
The application uses React Context API to manage state across components:
- `DocumentContext`: Manages the state of selected documents for batch processing

### 3. Template Method Pattern
Document generation follows a template method pattern:
- Base document generation logic with template-specific variations
- Different templates (HOURS, MINUTES, START_AND_END) with shared core functionality

### 4. Strategy Pattern
Calculation strategies vary based on branch configuration:
- Different consumption rates per branch
- Template-specific calculation methods

### 5. Factory Pattern
Document generation uses a factory-like approach:
- `generateDocument` function creates documents based on branch template type
- Template selection based on branch configuration

## Component Relationships

```
App
├── Table
│   └── TableRow (multiple instances)
└── DocumentList
```

- `Table` component renders multiple `TableRow` components based on branch data
- Each `TableRow` handles input, validation, and document generation for a specific branch
- `DocumentList` displays and manages documents added to the batch queue
- `DocumentContext` connects `TableRow` and `DocumentList` for state management

## Data Flow

1. **Configuration Loading**:
   - Branch configurations loaded from `branches.json`
   - Detailed branch settings from `branchConfig.ts`
   - Company details from `companyConfig.ts`

2. **User Input Flow**:
   - User inputs data in `TableRow` component
   - Validation occurs on input change and form submission
   - Calculations update in real-time as inputs change

3. **Document Generation Flow**:
   - User triggers document generation
   - System retrieves branch and company configuration
   - Template selection based on branch type
   - Document generation with data interpolation
   - File download or addition to batch queue

4. **Batch Processing Flow**:
   - Documents added to queue via `DocumentContext`
   - `DocumentList` displays queued documents
   - Batch download processes all queued documents

## Critical Implementation Paths

### 1. Bill Calculation Path
```
User Input → validateField() → calculateTotal() → getBranchDetails() → Update UI
```

### 2. Document Generation Path
```
Generate Button → validateField() → generateDocument() → loadFile() → docxtemplater.render() → saveAs()
```

### 3. Batch Processing Path
```
Add Button → handleAddDocument() → generateDocumentAsBlob() → addDocument() → DocumentContext → DocumentList
```

## State Management

1. **Local Component State**:
   - Form inputs (date, readings, hours, fuel price)
   - Validation errors
   - Calculated totals

2. **Application-wide State**:
   - Selected documents for batch processing (via Context API)

## Validation Strategy

- Field-level validation with specific rules per field type
- Real-time validation feedback
- Form-level validation before document generation
- Required fields vary based on branch template type

## Authentication System

### 1. Authentication Flow
```
Login Page → NextAuth.js → JWT Token → Session → Protected Routes
```

### 2. User Types
- **Regular Users**: Authenticated with username/password
- **Demo Users**: Special access with predefined credentials

### 3. Authentication Components
- `UserNav`: Displays current user and logout button
- `LoginPage`: Handles user authentication
- `Middleware`: Protects routes based on authentication status

### 4. Session Management
- JWT-based authentication with NextAuth.js
- Server-side session validation via middleware
- Client-side session access via useSession hook

## Technical Decisions

1. **Next.js Framework**: Provides server-side rendering capabilities and modern React features
2. **React Context API**: Lightweight state management without additional libraries
3. **Docxtemplater**: Document generation from templates with data binding
4. **File-saver**: Browser-compatible file download functionality
5. **TypeScript**: Type safety and improved developer experience
6. **CSS Modules**: Component-scoped styling to prevent conflicts
7. **NextAuth.js**: Authentication framework for Next.js applications
8. **bcrypt**: Secure password hashing for user credentials
