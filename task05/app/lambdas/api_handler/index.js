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

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TARGET_TABLE || "Events"; // Ensure TARGET_TABLE environment variable is properly set.

exports.handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    let requestBody;
    try {
        requestBody = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        console.log("Parsed request body:", JSON.stringify(requestBody, null, 2));
    } catch (err) {
        console.error("Invalid JSON format:", err);
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Invalid JSON format" })
        };
    }

    if (!requestBody || !requestBody.principalId || !requestBody.content || typeof requestBody.principalId !== "number") {
        console.error("Missing required fields: principalId (number) and content (object) are required");
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Missing required fields: principalId (number) and content (object) are required" })
        };
    }

    const newEvent = {
        id: uuidv4(),
        principalId: requestBody.principalId,
        createdAt: new Date().toISOString(),
        body: requestBody.content
    };

    console.log("New event to save:", JSON.stringify(newEvent, null, 2));

    try {
        await dynamoDB.put({
            TableName: TABLE_NAME,
            Item: newEvent
        }).promise();

        console.log("Event successfully saved to DynamoDB");

        return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: newEvent })
        };

    } catch (error) {
        console.error("Error saving to DynamoDB:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Failed to save event", error: error.message })
        };
    }
};