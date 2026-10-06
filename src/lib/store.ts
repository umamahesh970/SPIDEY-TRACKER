import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

export interface Sighting {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  timestamp: string;
  status: 'rumoured' | 'confirmed';
  votes: number;
  creatorId?: string;
}

// In Next.js on AWS Amplify, credentials are automatically picked up from the IAM role.
// For local testing, you must configure AWS credentials in your .env file or AWS CLI.
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'SpideySightings';

export async function getSightings(): Promise<Sighting[]> {
  try {
    const command = new ScanCommand({ TableName: TABLE_NAME });
    const response = await docClient.send(command);
    const sightings = (response.Items as Sighting[]) || [];
    
    // Filter out sightings older than 24 hours (86400000 ms)
    const now = new Date().getTime();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    
    return sightings.filter(s => {
      return (now - new Date(s.timestamp).getTime()) < ONE_DAY_MS;
    });
  } catch (error) {
    console.error("DynamoDB Error - Make sure your table exists and credentials are valid:", error);
    // Return empty array if failing (e.g. table doesn't exist yet)
    return [];
  }
}

export async function addSighting(sighting: Omit<Sighting, 'id' | 'timestamp' | 'votes'>): Promise<Sighting> {
  const newSighting: Sighting = {
    ...sighting,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    votes: 0
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: newSighting
  });

  await docClient.send(command);
  return newSighting;
}

export async function updateVotes(id: string, action: 'upvote' | 'downvote'): Promise<Sighting | null> {
  // First get current item to calculate threshold logic
  const getCommand = new GetCommand({
    TableName: TABLE_NAME,
    Key: { id }
  });
  
  const current = await docClient.send(getCommand);
  if (!current.Item) return null;
  
  const currentVotes = current.Item.votes || 0;
  const newVotes = action === 'upvote' ? currentVotes + 1 : currentVotes - 1;
  const newStatus = (action === 'upvote' && newVotes >= 5) ? 'confirmed' : current.Item.status;

  const updateCommand = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: "SET votes = :v, #s = :s",
    ExpressionAttributeNames: {
      "#s": "status" // 'status' is a reserved word in DynamoDB
    },
    ExpressionAttributeValues: {
      ":v": newVotes,
      ":s": newStatus
    },
    ReturnValues: "ALL_NEW" // Returns the item as it appears after the update
  });

  const response = await docClient.send(updateCommand);
  return response.Attributes as Sighting;
}
