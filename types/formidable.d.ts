declare module 'formidable' {
  export interface File {
    filepath: string;
    originalFilename: string | null;
    mimetype: string | null;
    size: number;
    newFilename: string;
  }

  export interface Fields {
    [key: string]: string | string[];
  }

  export interface Files {
    [key: string]: File | File[];
  }

  export interface Options {
    encoding?: string;
    uploadDir?: string;
    keepExtensions?: boolean;
    maxFileSize?: number;
    maxFieldsSize?: number;
    maxFields?: number;
    hash?: boolean | string;
    multiples?: boolean;
  }

  export interface IncomingForm {
    parse(req: import('http').IncomingMessage): Promise<[Fields, Files]>;
  }

  export function formidable(options?: Options): IncomingForm;
}
