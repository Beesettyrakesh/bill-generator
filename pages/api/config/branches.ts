import type { NextApiRequest, NextApiResponse } from 'next';
import { createDynamoDBClient, BRANCH_CONFIG_TABLE_NAME } from '@/lib/aws-config';
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

  try {
    const dynamoDB = createDynamoDBClient();

    const result = await dynamoDB.send(new ScanCommand({
      TableName: BRANCH_CONFIG_TABLE_NAME,
      ProjectionExpression: 'branchName, company, template',
    }));

    const branches = (result.Items || [])
      .sort((a, b) => (a.branchName as string).localeCompare(b.branchName as string))
      .map((item, index) => ({
        id: index + 1,
        name: item.branchName,
        template: item.template,
        company: item.company,
      }));

    return res.status(200).json(branches);
  } catch (error) {
    console.error('Error fetching branches from DynamoDB:', error);
    return res.status(500).json({ error: 'Failed to fetch branches' });
  }
}
