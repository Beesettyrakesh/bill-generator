import type { NextApiRequest, NextApiResponse } from 'next';
import { createDynamoDBClient, BILLS_TABLE_NAME, DEMO_BILLS_TABLE_NAME } from '@/lib/aws-config';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isDemo = session.user?.role === 'demo';
  const targetTable = isDemo ? DEMO_BILLS_TABLE_NAME : BILLS_TABLE_NAME;

  try {
    const { month, branchId } = req.query;
    if (!month) {
      return res.status(400).json({ error: 'Month parameter is required' });
    }

    const dynamoDB = createDynamoDBClient();
    let bills: Record<string, unknown>[] = [];

    if (branchId) {
      const params = {
        TableName: targetTable,
        KeyConditionExpression: 'branchId = :branchId',
        FilterExpression: '#m = :month',
        ExpressionAttributeNames: { '#m': 'month' },
        ExpressionAttributeValues: {
          ':branchId': branchId,
          ':month': month,
        },
      };
      const result = await dynamoDB.send(new QueryCommand(params));
      bills = (result.Items || []) as Record<string, unknown>[];
    } else {
      // Query using the GSI on month
      const params = {
        TableName: targetTable,
        IndexName: 'MonthIndex',
        KeyConditionExpression: '#m = :month',
        ExpressionAttributeNames: { '#m': 'month' },
        ExpressionAttributeValues: { ':month': month },
      };
      const result = await dynamoDB.send(new QueryCommand(params));
      bills = (result.Items || []) as Record<string, unknown>[];
    }

    bills.sort((a, b) => (b.generatedAt as number) - (a.generatedAt as number));
    return res.status(200).json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);

    const err = error as { name?: string; message?: string };

    if (err.name === 'ResourceNotFoundException') {
      return res.status(500).json({
        error: 'DynamoDB table not found. Please ensure the BillHistory table is created.',
      });
    } else if (err.name === 'ValidationException' && err.message?.includes('IndexName')) {
      return res.status(500).json({
        error: 'MonthIndex not found. Please ensure the GSI is created on the month attribute.',
      });
    } else if (err.name === 'AccessDeniedException' || err.name === 'UnrecognizedClientException') {
      return res.status(500).json({
        error: 'AWS authentication failed. Please check your AWS credentials.',
      });
    }

    return res.status(500).json({ error: 'Failed to fetch bills: ' + err.message });
  }
}
