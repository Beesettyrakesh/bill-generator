import { createDynamoDBClient, BILLS_TABLE_NAME } from '@/lib/aws-config';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { month, branchId } = req.query;
    if (!month) {
      return res.status(400).json({ error: 'Month parameter is required' });
    }
    console.log('Fetching bills for month:', month, 'and branch:', branchId || 'all');
    
    const dynamoDB = createDynamoDBClient();
    let bills = [];
    
    if (branchId) {
      const params = {
        TableName: BILLS_TABLE_NAME,
        KeyConditionExpression: 'branchId = :branchId',
        FilterExpression: '#m = :month',
        ExpressionAttributeNames: {
          '#m': 'month'
        },
        ExpressionAttributeValues: {
          ':branchId': branchId,
          ':month': month
        }
      };
      const result = await dynamoDB.query(params).promise();
      bills = result.Items || [];
    } else {
      // If only month is provided, query using the GSI on month
      const params = {
        TableName: BILLS_TABLE_NAME,
        IndexName: 'MonthIndex',
        KeyConditionExpression: '#m = :month',
        ExpressionAttributeNames: {
          '#m': 'month'
        },
        ExpressionAttributeValues: {
          ':month': month
        }
      };
      const result = await dynamoDB.query(params).promise();
      bills = result.Items || [];
    }

    bills.sort((a, b) => b.generatedAt - a.generatedAt);
    return res.status(200).json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    if (error.code === 'ResourceNotFoundException') {
      return res.status(500).json({ 
        error: 'DynamoDB table not found. Please ensure the BillHistory table is created.' 
      });
    } else if (error.code === 'ValidationException' && error.message.includes('IndexName')) {
      return res.status(500).json({ 
        error: 'MonthIndex not found. Please ensure the GSI is created on the month attribute.' 
      });
    } else if (error.code === 'AccessDeniedException' || error.code === 'UnrecognizedClientException') {
      return res.status(500).json({ 
        error: 'AWS authentication failed. Please check your AWS credentials.' 
      });
    }
    
    return res.status(500).json({ error: 'Failed to fetch bills: ' + error.message });
  }
}
