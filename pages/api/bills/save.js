import { 
  createDynamoDBClient, 
  BILLS_TABLE_NAME, 
  calculateTTL, 
  formatMonth, 
  generateBillId 
} from '@/lib/aws-config';
import branchesData from '../../../branches.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { formValues, user } = req.body;
    
    if (!formValues || !formValues.branch || !formValues.date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const dynamoDB = createDynamoDBClient();    
    const month = formatMonth(formValues.date);    
    const billId = generateBillId(month);    
    const branchInfo = branchesData.find(branch => branch.name === formValues.branch);
    const templateType = branchInfo ? branchInfo.template : "HOURS"; // Default to HOURS if branch not found
    
    const item = {
      branchId: formValues.branch,  // Partition key
      billId: billId,               // Sort key
      month: month,                 // GSI partition key
      generatedAt: Date.now(),
      expirationTime: calculateTTL(),
      templateType: templateType,
      formValues: formValues,
      ...(user && { 
        generatedBy: {
          id: user.id || user.sub || null,
          name: user.name || null,
          email: user.email || null
        }
      })
    };
    
    await dynamoDB.put({
      TableName: BILLS_TABLE_NAME,
      Item: item
    }).promise();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Bill data saved successfully',
      billId: billId
    });
  } catch (error) {
    console.error('Error saving bill data:', error);    
    if (error.code === 'ResourceNotFoundException') {
      return res.status(500).json({ 
        error: 'DynamoDB table not found. Please ensure the BillHistory table is created.' 
      });
    } else if (error.code === 'AccessDeniedException' || error.code === 'UnrecognizedClientException') {
      return res.status(500).json({ 
        error: 'AWS authentication failed. Please check your AWS credentials.' 
      });
    }
    
    return res.status(500).json({ error: 'Failed to save bill data: ' + error.message });
  }
}
