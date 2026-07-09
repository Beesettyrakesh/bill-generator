import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Module-level singleton. On Vercel a warm serverless instance reuses this
// across requests, keeping the underlying HTTPS/TLS connection alive instead
// of paying a fresh handshake on every API call.
let docClient: DynamoDBDocumentClient | null = null;

const createDynamoDBClient = (): DynamoDBDocumentClient => {
  if (docClient) return docClient;

  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
  docClient = DynamoDBDocumentClient.from(client);
  return docClient;
};


const BILLS_TABLE_NAME = process.env.DYNAMODB_BILLS_TABLE as string;
const DEMO_BILLS_TABLE_NAME = process.env.DYNAMODB_DEMO_BILLS_TABLE as string;
const BRANCH_CONFIG_TABLE_NAME = process.env.DYNAMODB_BRANCH_CONFIG_TABLE as string;
const COMPANY_CONFIG_TABLE_NAME = process.env.DYNAMODB_COMPANY_CONFIG_TABLE as string;

const calculateTTL = (): number => {
  const now = new Date();
  const expirationDate = new Date(now);
  expirationDate.setMonth(now.getMonth() + 12);
  return Math.floor(expirationDate.getTime() / 1000);
};

/*
Format month from date (YYYY-MM-DD) to YYYYMM of the previous month.
This is because bills are generated for the previous month's usage.
Example: A bill generated on 2025-07-15 is for June 2025, so month should be 202506
*/
const formatMonth = (dateString: string): string => {
  const date = new Date(dateString);
  const prevMonthDate = new Date(date);
  prevMonthDate.setMonth(date.getMonth() - 1);
  const year = prevMonthDate.getFullYear();
  const month = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
};

const generateBillId = (month: string): string => {
  return `${month}-${Date.now()}`;
};

export {
  createDynamoDBClient,
  BILLS_TABLE_NAME,
  DEMO_BILLS_TABLE_NAME,
  BRANCH_CONFIG_TABLE_NAME,
  COMPANY_CONFIG_TABLE_NAME,
  calculateTTL,
  formatMonth,
  generateBillId,
};
