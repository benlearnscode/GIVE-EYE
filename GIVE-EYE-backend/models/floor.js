const mongoose = require("mongoose");

const FloorSchema = new mongoose.Schema({
  Floorname: { 
    type: String, 
    required: true,
    unique: true
 },

  adjacencyMatrix: { 
    type: Map,
    of: [Number], 
    required: true 
    
},

nodes: [{
     type: mongoose.Schema.Types.ObjectId,
     ref: "NodePosition" 
    }],

  startNodeId: { 
    type: Number, 
    required: true 
  },

  endNodeId: { 
    type: Number, 
    required: true 
  },

  image: { 
    type: String,
    default: "default.png" 
  },

  path:{
    type:[Number],
    required:false
  }
});

module.exports = mongoose.model("Floor", FloorSchema);
