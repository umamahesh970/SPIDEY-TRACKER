import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

export async function GET() {
  const region = process.env.MY_AWS_REGION || process.env.AWS_REGION || 'us-east-1';
  try {
    const client = new DynamoDBClient({ 
      region,
      credentials: (process.env.MY_AWS_ACCESS_KEY_ID && process.env.MY_AWS_SECRET_ACCESS_KEY) ? {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
      } : undefined
    });
    const docClient = DynamoDBDocumentClient.from(client);
    const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'SpideySightings';
    
    const command = new ScanCommand({ TableName: TABLE_NAME });
    const response = await docClient.send(command);
    
    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful!", 
      regionUsed: region,
      items: response.Items 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      errorName: error.name,
      errorMessage: error.message,
      regionUsed: region,
      hint: "Show this exact error to the AI assistant to fix it!"
    }, { status: 500 });
  }
}
