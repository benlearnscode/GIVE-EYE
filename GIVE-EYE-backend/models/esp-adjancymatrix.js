const mongoose = require('mongoose');
// const floorss = require ("./floor")

const graphSchema= mongoose.Schema({

    mapName:{
        type:String,
        required:true,   
        unique:true,
    },
    adjacencyMatrix: {
        type: Map, // This allows a flexible adjacency list representation
        required: true,
    },
    path: {
        type: [Number],
        required: true,
    },
    NoofFloor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Floor", // Assuming you have a Floor model
        required: false, // Set to true if it's mandatory
    }

});

const GraphData = mongoose.model("Graphdata",graphSchema);
module.exports = GraphData;
