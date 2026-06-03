const nodepos=require('../models/node-position');
const con = require("../controllers/controfun");
const {sendInstructionsinSocket}=require('./socketfunction');


const nodepossave = async (req, res) => {
    const {nodeId,x,y}= req.body;

    try{
        const updatedNode = await nodepos.findOneAndUpdate(
            {nodeId},
            {x,y},
            {new:true,upsert:true}
        );
        res.status(200).json({success:true,node: updatedNode});
    }catch(error){
        res.status(500).json({message:error.message});
    }
};

var facingDirection = "NORTH"; // Default facing direction
const directionFaceing= (req,res)=>{
    const {direction , azimuth} = req.body;
    console.log("Direction:",direction);
    console.log("Azimuth:",azimuth);

    if(direction && azimuth !== undefined){
        console.log(`Received direction: ${direction}, azimuth: ${azimuth}`);

        res.status(200).json({status:'success',message:"Direction data received"});
    }else{
        res.status(400).json({status:'error',message:"Invalid data"});
    }
    facingDirection= direction;
    return {direction,azimuth};
}



// const destinationfromuser = async (req,res)=>{
//     const {index,name }=req.body;
//     console.log(req.body);
//     return  res.status(200).json({"message" : "sucess"});

// }

const nodeset = async (nodeIds) => {
    try {
        const nodes = await nodepos.find({ nodeId: { $in: nodeIds } });


        // Convert nodes into a structured map
        const nodeMap = nodes.reduce((acc, node) => {
            acc[node.nodeId] = { nodeId: node.nodeId, x: node.x, y: node.y };
            return acc;
        }, {});

        // Order nodes based on received path and filter out any missing nodes
        const orderedNodes = nodeIds.map((id) => nodeMap[id]).filter(Boolean);
        console.log("Ordered Nodes:", orderedNodes);
        return orderedNodes;
    } catch (error) {
        console.error("Error fetching nodes:", error);
        return [];
    }
};


// const sendpath = async (req, res) => {
//     const { path } = req.body;

    

//     if (!path || !Array.isArray(path)) {
//         return res.status(400).json({ error: "Invalid path format" });
//     }
//     const cleanedPath = path.map(node => Number(node));
//     console.log("Received path from react:", cleanedPath);
//     storedOrderedNodes = await nodeset(path);
//     console.log("Stored Ordered Nodes in Express:", storedOrderedNodes);
//     res.json({ status: "Path processed", storedOrderedNodes });


// }
const RSSI_THRESHOLD = -40;
const processPathAndInstructions = async (req, res) => {
    try {
        const { path } = req.body;
        if (!path || !Array.isArray(path)) {
            return res.status(400).json({ error: "Invalid path format" });
        }
        
        const cleanedPath = path.map(node => Number(node));
        console.log("Received path from React:", cleanedPath);

        storedOrderedNodes = await nodeset(cleanedPath);
        console.log("Stored Ordered Nodes in Express:", storedOrderedNodes);

        instructionQueue = [];
        for (let i = 0; i < cleanedPath.length - 1; i++) {
            const step = determineNextStep(cleanedPath.slice(i, i + 2), storedOrderedNodes,facingDirection);
            if (step) instructionQueue.push(step);
        }

        console.log("Generated Instruction Queue:", instructionQueue);
        
        if (instructionQueue.length > 0) {
            currentInstruction = instructionQueue.shift();
            console.log("First instruction:", currentInstruction);
            sendInstructionToESP(currentInstruction); // 🔥 Send to ESP

        }

     

        const response = await fetch("http://192.168.11.146:3000/api/closest-node");
        if (!response.ok) throw new Error("Failed to fetch closest node");

        const data = await response.json();
        const closestNode = Number(data.nodeId);
        const rssi = Number(data.noderssi);
        const des =cleanedPath[cleanedPath.length-1];

        const logData = { closestNode, expectedNode: currentInstruction?.nodeId, rssi, destination: des };
        console.log(`Closest Node: ${closestNode}, Expected Node: ${currentInstruction?.nodeId}, RSSI: ${rssi}, Des: ${des}`);
        if (rssi >= RSSI_THRESHOLD) {
            console.log(`You are near node:${closestNode}`);
            logData.message = `You are near node: ${closestNode}`;
            const  msg = `You are near ${closestNode}`;
            sendInstructionToESP(JSON.stringify({message: msg}));
        } else{
            const  msg = `You are not near ${closestNode} follow previous instruction`;
            sendInstructionToESP(currentInstruction); // 🔥 Send to ESP

        }

        if (closestNode === des ) {
            console.log("🎯 Destination Reached!");

            sendInstructionToESP(currentInstruction); // 🔥 Send to ESP
            const  msg = `You have Reached the Destination ${closestNode}`;
            sendInstructionToESP(JSON.stringify({message: msg}));
            
            return res.json({
                status: "Destination Reached",
                storedOrderedNodes,
                instructions: [],
                confirmedNode: closestNode,
                nextInstruction: null
            });
        }
        if ( closestNode === currentInstruction.nodeId && rssi >= RSSI_THRESHOLD) {
            console.log(`Confirmed Node ${closestNode}, moving to next instruction.`);

            if (instructionQueue.length > 0) {
                currentInstruction = instructionQueue.shift();
                console.log("Next instruction:", currentInstruction);
                sendInstructionToESP(currentInstruction); // 🔥 Send to ESP

            } else {
                currentInstruction = null;
                console.log("All instructions completed,Destination Reached ");
                sendInstructionToESP({ status: "Destination Reached" });            }
        } else {
            console.log("Node not confirmed yet, waiting...");
        }

        res.json({
            status: "Path processed",
            storedOrderedNodes,
            instructions: instructionQueue,
            confirmedNode: closestNode === currentInstruction?.nodeId ? closestNode : null,
            nextInstruction: currentInstruction
        });

    } catch (error) {
        console.error("Error processing path and instructions:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


const sendInstructionToESP = async (instruction) => {
    try {
        // const espUrl = "http://192.168.137.113/instruction"; // Change this to ESP32's IP address
        
        const espUrl = "http://192.168.137.88/instruction"; 
        sendInstructionsinSocket(instruction);
        const response = await fetch(espUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ instruction }),
        });

        if (!response.ok) {
            throw new Error(`Failed to send instruction to ESP, Status: ${response.status}`);
        }

        console.log(`✅ Sent instruction to ESP: ${instruction}`);
        const data = await response.json();
        console.log("ESP Response:", data);
    } catch (error) {
        console.error("❌❌❌ Error sending instruction to ESP:", error);
    }
};


let instructionQueue = [];  // Store step-by-step instructions
let currentInstruction = null; // Track the current instruction
let storedOrderedNodes = []; // Store ordered nodes

const THRESHOLD = 5; // 

const DIRECTION_ANGLES = {
    "EAST": 0,
    "NORTHEAST": 45,
    "NORTH": 90,
    "NORTHWEST": 135,
    "WEST": 180,
    "SOUTHWEST": 225,
    "SOUTH": 270,
    "SOUTHEAST": 315
}

// Function to determine next step
// const determineNextStep = (path, nodes) => {
//     if (path.length < 2) return null;
//     const prev = nodes.find(n => n.nodeId === path[0]);
//     const current = nodes.find(n => n.nodeId === path[1]);
//     if (!prev || !current) return null;

//     const dx = current.x - prev.x;
//     const dy = current.y - prev.y;
//     let direction = "";

//     if (Math.abs(dx) <= THRESHOLD && Math.abs(dy) <= THRESHOLD) {
//         return null; // Ignore small movements
//     }

//     if (dx > THRESHOLD && Math.abs(dy) <= THRESHOLD) direction = "Move EAST";
//     else if (dx < -THRESHOLD && Math.abs(dy) <= THRESHOLD) direction = "Move WEST";
//     else if (dy > THRESHOLD && Math.abs(dx) <= THRESHOLD) direction = "Move SOUTH";
//     else if (dy < -THRESHOLD && Math.abs(dx) <= THRESHOLD) direction = "Move NORTH";
//     else if (dx > THRESHOLD && dy > THRESHOLD) direction = "Move SOUTHEAST";
//     else if (dx > THRESHOLD && dy < -THRESHOLD) direction = "Move NORTHEAST";
//     else if (dx < -THRESHOLD && dy > THRESHOLD) direction = "Move SOUTHWEST";
//     else if (dx < -THRESHOLD && dy < -THRESHOLD) direction = "Move NORTHWEST";
//     else direction = "Stay in place";

//     return { action: direction, nxt_nodeId: current.nodeId };
// };




const determineNextStep = (path, nodes, facingDirection ) => {
    if (path.length < 2) return null;
   console.log(facingDirection);
    const prev = nodes.find(n => n.nodeId === path[0]);
    const current = nodes.find(n => n.nodeId === path[1]);
    if (!prev || !current) return null;

    const dx = current.x - prev.x;
    const dy = current.y - prev.y;
    let absoluteDirection = "";
    let relativeInstruction = "";

    if (Math.abs(dx) <= THRESHOLD && Math.abs(dy) <= THRESHOLD) {
        return null; // Ignore small movements
    }

    // Determine absolute movement direction
    if (dx > THRESHOLD && Math.abs(dy) <= THRESHOLD) absoluteDirection = "EAST";
    else if (dx < -THRESHOLD && Math.abs(dy) <= THRESHOLD) absoluteDirection = "WEST";
    else if (dy > THRESHOLD && Math.abs(dx) <= THRESHOLD) absoluteDirection = "SOUTH";
    else if (dy < -THRESHOLD && Math.abs(dx) <= THRESHOLD) absoluteDirection = "NORTH";
    else if (dx > THRESHOLD && dy > THRESHOLD) absoluteDirection = "SOUTHEAST";
    else if (dx > THRESHOLD && dy < -THRESHOLD) absoluteDirection = "NORTHEAST";
    else if (dx < -THRESHOLD && dy > THRESHOLD) absoluteDirection = "SOUTHWEST";
    else if (dx < -THRESHOLD && dy < -THRESHOLD) absoluteDirection = "NORTHWEST";
    else absoluteDirection = "STAY";

    // Define how to translate absolute movement direction into relative commands
    const directionMap = {
        "North":  { "NORTH": "Move FORWARD", "SOUTH": "Move BACKWARD", "EAST": "Move RIGHT", "WEST": "Move LEFT", 
                    "NORTHEAST": "Move FORWARD-RIGHT", "NORTHWEST": "Move FORWARD-LEFT", 
                    "SOUTHEAST": "Move BACKWARD-RIGHT", "SOUTHWEST": "Move BACKWARD-LEFT" },
        
        "South":  { "NORTH": "Move BACKWARD", "SOUTH": "Move FORWARD", "EAST": "Move LEFT", "WEST": "Move RIGHT", 
                    "NORTHEAST": "Move BACKWARD-RIGHT", "NORTHWEST": "Move BACKWARD-LEFT", 
                    "SOUTHEAST": "Move FORWARD-RIGHT", "SOUTHWEST": "Move FORWARD-LEFT" },
        
        "East":   { "NORTH": "Move LEFT", "SOUTH": "Move RIGHT", "EAST": "Move FORWARD", "WEST": "Move BACKWARD", 
                    "NORTHEAST": "Move FORWARD-LEFT", "NORTHWEST": "Move BACKWARD-LEFT", 
                    "SOUTHEAST": "Move FORWARD-RIGHT", "SOUTHWEST": "Move BACKWARD-RIGHT" },
        
        "West":   { "NORTH": "Move RIGHT", "SOUTH": "Move LEFT", "EAST": "Move BACKWARD", "WEST": "Move FORWARD", 
                    "NORTHEAST": "Move BACKWARD-RIGHT", "NORTHWEST": "Move FORWARD-RIGHT", 
                    "SOUTHEAST": "Move BACKWARD-LEFT", "SOUTHWEST": "Move FORWARD-LEFT" }
    };

    relativeInstruction = directionMap[facingDirection][absoluteDirection] || "Stay in place";

    // Update facing direction for next step
    const newFacingDirection = absoluteDirection; // Adjust this if rotation is required
    console.log("Facing Direction:", facingDirection);
console.log("Absolute Direction:", absoluteDirection);

// Ensure facingDirection is valid
if (!directionMap[facingDirection]) {
    console.error(`Invalid facing direction: ${facingDirection}`);
    return null;
}

// Ensure absoluteDirection is valid within facingDirection
if (!directionMap[facingDirection][absoluteDirection]) {
    console.error(`Invalid absolute direction: ${absoluteDirection} for facing direction: ${facingDirection}`);
    return null;
}

relativeInstruction = directionMap[facingDirection][absoluteDirection] || "Stay in place";

    return { action: relativeInstruction, nxt_nodeId: current.nodeId, newFacingDirection };
};








// const determinePathnav =(path,nodes=>{
//     let instruction =[];
//     let facing= "EAST" ;

//     const directionalMap ={
        
//             "NORTH": { "EAST": "RIGHT", "WEST": "LEFT", "SOUTH": "TURN 180°" },
//             "SOUTH": { "EAST": "LEFT", "WEST": "RIGHT", "NORTH": "TURN 180°" },
//             "EAST": { "NORTH": "LEFT", "SOUTH": "RIGHT", "WEST": "TURN 180°" },
//             "WEST": { "NORTH": "RIGHT", "SOUTH": "LEFT", "EAST": "TURN 180°" }
          
//     }
//     for(let i=1;i<path.length-1;i++){
//         const prev = nodes.find(n=>n.nodeId===path[i-1]);
//         const current= nodes.find(n=>n.nodeId===path[i]);

//         if(!prev || !current){
//             continue;
//         }

//         let newDirection=" ";
//         // Determine direction with tolerance for small variations
//     const dx = current.x - prev.x;
//     const dy = current.y - prev.y;
//     const threshold = 5;  // Define small threshold for noise handling

//     if (dx > threshold && Math.abs(dy) <= threshold) newDirection = "EAST";
//     else if (dx < -threshold && Math.abs(dy) <= threshold) newDirection = "WEST";
//     else if (dy > threshold && Math.abs(dx) <= threshold) newDirection = "SOUTH";
//     else if (dy < -threshold && Math.abs(dx) <= threshold) newDirection = "NORTH";
//     else if (dx > 0 && dy > 0) newDirection = "SOUTHEAST";  // Handle diagonal moves
//     else if (dx > 0 && dy < 0) newDirection = "NORTHEAST";
//     else if (dx < 0 && dy > 0) newDirection = "SOUTHWEST";
//     else if (dx < 0 && dy < 0) newDirection = "NORTHWEST";


//     if (newDirection in directionMap[facing]) {
//         let turnInstruction = directionMap[facing][newDirection];
  
//         if (turnInstruction === "TURN 180°") {
//           instructions.push("TURN AROUND");
//         } else {
//           instructions.push(`TURN ${turnInstruction}`);
//         }
//       } else {
//         instructions.push(`MOVE DIAGONALLY to Node ${current.nodeId}`);
//       }
  
//       instructions.push(`Move FORWARD to Node ${current.nodeId}`);
//       facing = newDirection; // Update facing direction
//     }
  
//     return instructions;
// })
module.exports = {nodepossave,processPathAndInstructions,directionFaceing};
