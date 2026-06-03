const GraphData = require('../models/esp-adjancymatrix');



// **Save Graph to MongoDB**
const saveGraph= async (req, res) => {
    try {
        const { graphName, adjacencyList ,path  } = req.body;

        // Check if graph already exists
        const existingGraph = await Graph.findOne({ graphName });
        if (existingGraph) {
            return res.status(400).json({ message: "Graph with this name already exists" });
        }

        const newGraph = new Graph({ graphName, adjacencyList });
        await newGraph.save();
        res.status(201).json({ message: "Graph saved successfully", graph: newGraph });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// **Retrieve Graph**
const getGraph= async (req, res) => {
    try {
        const { graphName } = req.params;
        const graph = await Graph.findOne({ graphName });

        if (!graph) {
            return res.status(404).json({ message: "Graph not found" });
        }

        res.status(200).json(graph);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

module.exports = {saveGraph, getGraph};
