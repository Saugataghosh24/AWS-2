// exports.handler = async (event) => {
//     // TODO implement
//     const response = {
//         statusCode: 200,
//         body: JSON.stringify('Hello from Lambda!'),
//     };
//     return response;
// };

const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

// Initialize DynamoDB DocumentClient
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Get the table name from environment variables
const TABLE_NAME = process.env.TARGET_TABLE || "Events";

exports.handler = async (event) => {
    try {
        console.log("Received event:", JSON.stringify(event, null, 2));

        // Parse event body safely
        let requestBody;
        try {
            requestBody = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        } catch (err) {
            console.error("Invalid JSON:", err);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid JSON format" }),
            };
        }

        // Validate required fields
        if (!requestBody || !requestBody.principalId || !requestBody.content || typeof requestBody.principalId !== "number") {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid request: principalId (number) and content (object) are required" }),
            };
        }

        // Generate event data
        const newEvent = {
            id: uuidv4(),
            principalId: requestBody.principalId,
            createdAt: new Date().toISOString(),
            body: requestBody.content
        };

        console.log("Saving to DynamoDB:", JSON.stringify(newEvent, null, 2));

        // Save event to DynamoDB
        await dynamoDB.put({
            TableName: TABLE_NAME,
            Item: newEvent
        }).promise();

        console.log("Successfully saved event to DynamoDB");

        // Return correct response
        return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: newEvent })
        };

    } catch (error) {
        console.error("Error in Lambda execution:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error", error: error.message })
        };
    }
};
