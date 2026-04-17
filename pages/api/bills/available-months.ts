import type { NextApiRequest, NextApiResponse } from 'next';
import { createDynamoDBClient, BILLS_TABLE_NAME, DEMO_BILLS_TABLE_NAME } from '@/lib/aws-config';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
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
    const dynamoDB = createDynamoDBClient();

    const params = {
      TableName: targetTable,
      ProjectionExpression: '#m',
      ExpressionAttributeNames: {
        '#m': 'month',
      },
    };

    const result = await dynamoDB.send(new ScanCommand(params));

    const monthsSet = new Set<string>();
    if (result.Items && result.Items.length > 0) {
      result.Items.forEach((item) => {
        if (item.month) {
          monthsSet.add(item.month as string);
        }
      });
    }

    let months = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));

    if (months.length > 12) {
      months = months.slice(0, 12);
    }

    return res.status(200).json(months);
  } catch (error) {
    console.error('Error fetching available months:', error);

    const err = error as { name?: string; message?: string };

    if (err.name === 'ResourceNotFoundException') {
      return res.status(500).json({
        error: 'DynamoDB table not found. Please ensure the BillHistory table is created.',
      });
    } else if (err.name === 'AccessDeniedException' || err.name === 'UnrecognizedClientException') {
      return res.status(500).json({
        error: 'AWS authentication failed. Please check your AWS credentials.',
      });
    }

    return res.status(500).json({
      error: 'Failed to fetch available months: ' + err.message,
    });
  }
}
