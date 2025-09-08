import AWS from 'aws-sdk';

const configureAWS = () => {
  if (AWS.config.region) return;

  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  });
};

const createDynamoDBClient = () => {
  configureAWS();
  return new AWS.DynamoDB.DocumentClient();
};

const BILLS_TABLE_NAME = process.env.DYNAMODB_BILLS_TABLE

const calculateTTL = () => {
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
const formatMonth = (dateString) => {
  const date = new Date(dateString);
  const prevMonthDate = new Date(date);
  prevMonthDate.setMonth(date.getMonth() - 1);
  const year = prevMonthDate.getFullYear();
  const month = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
};

const generateBillId = (month) => {
  return `${month}-${Date.now()}`;
};

export {
  configureAWS,
  createDynamoDBClient,
  BILLS_TABLE_NAME,
  calculateTTL,
  formatMonth,
  generateBillId
};
