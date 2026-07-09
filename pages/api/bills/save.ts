import type { NextApiRequest, NextApiResponse } from 'next';
import {
  createDynamoDBClient,
  BILLS_TABLE_NAME,
  DEMO_BILLS_TABLE_NAME,
  BRANCH_CONFIG_TABLE_NAME,
  calculateTTL,
  formatMonth,
  generateBillId,
} from '@/lib/aws-config';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

interface FormValues {
  branch: string;
  date: string;
  [key: string]: unknown;
}

interface SaveRequestBody {
  formValues: FormValues;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isDemo = session.user?.role === 'demo';

  try {
    const { formValues } = req.body as SaveRequestBody;
    // Resolve the user from the server-side session (no client round-trip).
    const user = session.user as
      | { id?: string; sub?: string; name?: string; email?: string }
      | undefined;

    if (!formValues || !formValues.branch || !formValues.date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const dynamoDB = createDynamoDBClient();
    const month = formatMonth(formValues.date);
    const billId = generateBillId(month);

    // Determine which table to write to
    const targetTable = isDemo ? DEMO_BILLS_TABLE_NAME : BILLS_TABLE_NAME;

    // Fetch template type — only for real users (demo branches aren't in real DynamoDB)
    let templateType = 'HOURS';
    if (!isDemo) {
      try {
        const branchResult = await dynamoDB.send(
          new GetCommand({
            TableName: BRANCH_CONFIG_TABLE_NAME,
            Key: { branchName: formValues.branch },
            ProjectionExpression: 'template',
          })
        );
        if (branchResult.Item?.template) {
          templateType = branchResult.Item.template as string;
        }
      } catch (branchError) {
        console.error('Failed to fetch branch template, using default:', branchError);
      }
    }

    const item = {
      branchId: formValues.branch,
      billId: billId,
      month: month,
      generatedAt: Date.now(),
      expirationTime: calculateTTL(),
      templateType: templateType,
      formValues: formValues,
      ...(user && {
        generatedBy: {
          id: user.id || user.sub || null,
          name: user.name || null,
          email: user.email || null,
        },
      }),
    };

    await dynamoDB.send(
      new PutCommand({
        TableName: targetTable,
        Item: item,
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Bill data saved successfully',
      billId: billId,
    });
  } catch (error) {
    console.error('Error saving bill data:', error);

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

    return res.status(500).json({ error: 'Failed to save bill data: ' + err.message });
  }
}
