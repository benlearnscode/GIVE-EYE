
const functiond =(req,res)=>{
    console.log("ajj")
};



const getDD = (req,res)=>{
    const locationData = req.body;
    console.log('Received location data:', locationData);
    findClossestNode(locationData);
    res.json({status:'sucess',message:"recieveddd"})
};

function findClossestNode(dataa) {
    let closest=null;
    let high=-Infinity;

    for(const device in dataa){
        if(dataa.hasOwnProperty(device)){
            const signal = dataa[device];
            if(signal>high){
                high=signal;
                closest=device;
            }
        }
    }
    console.log('Closest device:', closest);
    return closest;
    
};



//getting matrix for neighbouring nodes map
let adjacencyMatrix = {};

const adjmatrix=(req,res)=>{
    const matrix = req.body;
    console.log('Received adjacency matrix:', matrix);
    adjacencyMatrix = matrix;
    res.json({status:'success', message:'Received adjacency matrix'});
    
};



function initializeGraph(graph, start) {
    let distances = {};
    let previous = {};
    let pq = new Map();

    for (let node in graph) {
        distances[node] = Infinity;  // Set all distances to Infinity initially
        previous[node] = null;       // No previous nodes at the start

        // Ensure every edge has a default weight of 1 if not explicitly given
        for (let neighbor in graph[node]) {
            if (graph[node][neighbor] === undefined || graph[node][neighbor] === null) {
                graph[node][neighbor] = 1; 
            }
        }
    }

    distances[start] = 0;  // Start node has a distance of 0
    pq.set(start, 0);      // Add start node to priority queue

    return { distances, previous, pq };
}


function extractMinNode(pq) {
    let minNode = null;
    let minDistance = Infinity;

    for (let [node, distance] of pq.entries()) {
        if (distance < minDistance) {
            minDistance = distance;
            minNode = node;
        }
    }

    pq.delete(minNode);  // Remove the node from the priority queue
    return minNode;
}

function dijkstra(graph, start, target) {
    let { distances, previous, pq } = initializeGraph(graph, start);
    let visited = new Set();

    while (pq.size > 0) {
        let currentNode = extractMinNode(pq); // Get the node with the smallest distance

        if (currentNode === target) break;  // Stop if we reach the target node

        visited.add(currentNode);

        for (let neighbor in graph[currentNode]) {
            if (!visited.has(neighbor)) {
                let newDistance = distances[currentNode] + graph[currentNode][neighbor];

                if (newDistance < distances[neighbor]) {
                    distances[neighbor] = newDistance;
                    previous[neighbor] = currentNode;
                    pq.set(neighbor, newDistance);  // Update the priority queue
                }
            }
        }
    }
    return reconstructPath(previous, target, distances[target]);
}

function reconstructPath(previous, target, distance) {
    if (distance === Infinity) {
        return { distance, path: null };  // No path exists
    }
    let path = [];
    let at = target;
    while (at !== null) {
        if (previous[at] === undefined && at !== target) {
            return { distance, path: null };  // Target is unreachable
        }
        path.push(at);
        at = previous[at];
    }

    path.reverse();
    return { distance, path };
}

// create a weighted graph from the adjacency matrix as we didnt take weights
function convertToWeightedGraph(graph) {
    let weightedGraph = {};

    for (let node in graph) {
        weightedGraph[node] = {};  // Initialize the node

        graph[node].forEach((neighbor) => {
            weightedGraph[node][neighbor] = 1; // Assign default weight = 1
        });
    }

    return weightedGraph;
}






//store the neighbouring nodes in the graph
// const graph=adjacencyMatrix;

graph = {
    0: [1],
    1: [0, 3],
    2: [1, 3],
    3: [2, 4],
    4: [3, 5],
    5: [4]
} 
adjacencyMatrix = graph;
// add weights to the graph
// var wgraph=convertToWeightedGraph(graph);


const startNode = 0;
const targetNode = 4;

// const result = dijkstra(wgraph, startNode, targetNode);
// console.log(`Shortest path from ${startNode} to ${targetNode}:`, result.path);
// console.log(`Minimum distance:`, result.distance);

// getting start amd target node from the user
const sendshort = (req, res) => {
    const{startNode, targetNode}=req.body;
    if (adjacencyMatrix[startNode] === undefined || adjacencyMatrix[targetNode] === undefined) {
        return res.status(400).json({ error: "Invalid start or target node" });
    }
    var wgraph = convertToWeightedGraph(adjacencyMatrix);
    const result = dijkstra(wgraph, startNode, targetNode);
    if (!result || !result.path) {
        console.log('Path computation failed');
        return res.status(500).json({ error: "Path computation failed" });
        
    }
    console.log('Path sent successfully');
    res.json({ status: "success", path: result.path, distance: result.distance });
}


module.exports ={ functiond,getDD,adjmatrix,sendshort}