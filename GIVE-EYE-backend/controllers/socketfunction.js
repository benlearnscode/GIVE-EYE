
const {wss} = require('../config/webconn');
const WebSocket = require("ws");


const sendInstructionsinSocket = (instruction) => {
    if (!wss) {
        console.error(" WebSocket server not initialized!");
        return;
    }

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ instruction }));
            console.log(" Sent to WebSocket:", instruction);
        }
    });
};

module.exports = { sendInstructionsinSocket };

