import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "Events";

export const handler = async (event) => {
    try {
        console.log("Received event:", JSON.stringify(event, null, 2));

        // Parse the input event body
        let inputEvent;
        try {
            inputEvent = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        } catch (parseError) {
            console.error("Error parsing event body:", parseError);
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Invalid JSON format in request body" })
            };
        }

        // Validate required fields
        if (!inputEvent?.principalId || inputEvent?.content === undefined) {
            console.error("Validation failed: Missing required fields", inputEvent);
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Invalid input: principalId and content are required" })
            };
        }

        const eventId = uuidv4();
        const createdAt = new Date().toISOString();

        // Create the event item
        const eventItem = {
            id: eventId,
            principalId: Number(inputEvent.principalId),
            createdAt: createdAt,
            body: inputEvent.content  // Store content directly as required
        };

        console.log("Saving to DynamoDB:", JSON.stringify(eventItem, null, 2));

        // Save to DynamoDB
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: eventItem
        }));

        console.log("Saved successfully");

        // Return response with explicit statusCode: 201
        return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                id: eventId,
                principalId: Number(inputEvent.principalId),
                createdAt: createdAt,
                body: inputEvent.content
            })
        };

    } catch (error) {
        console.error("Error processing request:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Internal server error", error: error.message })
        };
    }
};