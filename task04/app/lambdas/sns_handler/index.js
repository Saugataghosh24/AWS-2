exports.handler = async (event) => {
    console.log("SNS Message Received:", JSON.stringify(event, null, 2));
    for (const record of event.Records) {
        console.log("Message Body:", record.body);
    }
    return { statusCode: 200, body: "Notification processed" };
};

