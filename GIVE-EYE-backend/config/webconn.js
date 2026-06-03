const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", (message) => {
        console.log(`Received from client: ${message}`);
        ws.send(JSON.stringify({ message: "Server received: " + message }));
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});
console.log(" WebSocket Server running on port 8080");


module.exports = {wss};
