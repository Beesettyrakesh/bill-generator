import type { NextApiRequest, NextApiResponse } from 'next';
import { createDynamoDBClient, COMPANY_CONFIG_TABLE_NAME } from '@/lib/aws-config';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
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

  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Missing required query parameter: name' });
  }

  try {
    const dynamoDB = createDynamoDBClient();

    const result = await dynamoDB.send(new GetCommand({
      TableName: COMPANY_CONFIG_TABLE_NAME,
      Key: { companyName: name },
    }));

    if (!result.Item) {
      return res.status(404).json({ error: `Company "${name}" not found` });
    }

    const companyConfig = { ...result.Item };
    delete companyConfig.companyName;

    return res.status(200).json(companyConfig);
  } catch (error) {
    console.error('Error fetching company from DynamoDB:', error);
    return res.status(500).json({ error: 'Failed to fetch company' });
  }
}
