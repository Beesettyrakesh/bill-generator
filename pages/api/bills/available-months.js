import { createDynamoDBClient, BILLS_TABLE_NAME } from '@/lib/aws-config';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Fetching available months');
    
    const dynamoDB = createDynamoDBClient();

    const params = {
      TableName: BILLS_TABLE_NAME,
      ProjectionExpression: '#m',
      ExpressionAttributeNames: {
        '#m': 'month'
      }
    };
    
    const result = await dynamoDB.scan(params).promise();
    
    const monthsSet = new Set();
    if (result.Items && result.Items.length > 0) {
      result.Items.forEach(item => {
        if (item.month) {
          monthsSet.add(item.month);
        }
      });
    }
    
    let months = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
    
    if (months.length > 12) {
      months = months.slice(0, 12);
    }
    
    // Return the actual months from the database, even if empty
    return res.status(200).json(months);
  } catch (error) {
    console.error('Error fetching available months:', error);    
    
    // Return appropriate error responses without fallback data
    if (error.code === 'ResourceNotFoundException') {
      return res.status(500).json({ 
        error: 'DynamoDB table not found. Please ensure the BillHistory table is created.' 
      });
    } else if (error.code === 'AccessDeniedException' || error.code === 'UnrecognizedClientException') {
      return res.status(500).json({ 
        error: 'AWS authentication failed. Please check your AWS credentials.' 
      });
    }
    
    // General error response
    return res.status(500).json({
      error: 'Failed to fetch available months: ' + error.message
    });
  }
}
