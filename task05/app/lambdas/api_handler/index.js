import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const dynamoDBClient = new DynamoDBClient();
const TABLE_NAME = process.env.TARGET_TABLE || "Events";

export const handler = async (event) => {
    console.log("Incoming request:", JSON.stringify(event, null, 2));

    let requestBody;
    try {
        requestBody = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        console.log("Parsed request body:", JSON.stringify(requestBody, null, 2));
    } catch (error) {
        console.error("Failed to parse request body:", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid request: Malformed JSON." })
        };
    }

    const { principalId, content } = requestBody || {};
    if (!principalId || content === undefined || typeof principalId !== "number") {
        console.error("Validation error: Missing required fields", requestBody);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid request: principalId (number) and content are required." })
        };
    }

    const eventItem = {
        id: uuidv4(),
        principalId,
        createdAt: new Date().toISOString(),
        body: content
    };

    console.log("Storing item in DynamoDB:", JSON.stringify(eventItem, null, 2));

    try {
        await dynamoDBClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: eventItem
        }));

        console.log("DynamoDB write successful.");
        return {
            statusCode: 201,
            body: JSON.stringify({ statusCode: 201, event: eventItem })
        };
    } catch (error) {
        console.error("DynamoDB operation failed:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error", error: error.message })
        };
    }
};
