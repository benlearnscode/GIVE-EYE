const Floor= require('../models/floor');

const getallfloor =(async(req,res)=>{
    try{
        const floors =await Floor.find()
        .populate("nodes") // Populate nodes
        res.json(floors);

    }catch(error){
        res.stats(500).json({error:"Error fetching Floors"})
    }
});

const getSingleFloor =(async(req,res)=>{
    try{
        const floor =await Floor.findById(req.params.id)
        .populate("nodes") // Populate nodes
        

        if(!floor) return res.status(404).json({error:"Floor not found"})
    }catch(error){
        res.status(500).json({error:"Error in fetching the asked floor"})
    }
});

// const postfloor =(async(req,res)=>{
//     try{
        
//         const {Floorname, adjacencyMatrix, nodes, image, startNodeId, endNodeId }=req.body;
//         if (!Floorname || !adjacencyMatrix || !nodes || !startNodeId || !endNodeId) {
//             return res.status(400).json({ error: "All fields are required!" });
//         }
//         const existingFloor = await Floor.findOne({ Floorname });
//         if (existingFloor) {
//             return res.status(400).json({ error: "Floor name must be unique." });
//         }


//         const validNodes = await NodePosition.find({ _id: { $in: nodes } });
//         if (validNodes.length !== nodes.length) {
//             return res.status(400).json({ error: "Some nodes do not exist in NodePosition collection." });
//         }

//         if (typeof adjacencyMatrix !== "object" || Array.isArray(adjacencyMatrix)) {
//             return res.status(400).json({ error: "Invalid adjacencyMatrix format. It must be an object." });
//         }

//         const newFloor = new Floor({ 
//             Floorname,
//             adjacencyMatrix,
//             nodes,
//             startNodeId,
//             endNodeId,
//             image: image || "default.png",});

//         await newFloor.save();
//         res.status(201).json({ success: true, message: "Floor added successfully", floor: newFloor });

//     }catch(error){
//         // console.log(req.body);
//         res.status(500).json({error:"Error adding floors"})
        
//     }
// });

const postfloor = async (req, res) => {
    console.log("Incoming Data:", req.body); // 🔍 Debugging
    console.log("Headers:", req.headers);

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "Request body is empty or undefined!" });
    }

    res.json({ success: true, message: "Received data", data: req.body });
};


 const deleteFloor = (async (req, res) => {
    try {
      await Floor.findByIdAndDelete(req.params.id);
      res.json({ message: "Floor deleted" });
    } catch (err) {
      res.status(500).json({ error: "Error deleting floor" });
    }
  });

  module.exports ={deleteFloor,postfloor,getSingleFloor,getallfloor};