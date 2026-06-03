const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import MapManager from "./map";
import { use } from "react";
// const SERVER_URL = process.env.REACT_APP_SERVER_URL;

function App() { 
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);

  const [mode, setMode] = useState("none");
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  // const [shortestPath, setShortestPath] = useState([]);
  // const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef(null);
  const draggingNodeId = useRef(null);

  const [startNode, setStartNode] = useState(null);
  const [destinationNode, setDestinationNode] = useState(null);

  const [highlightedNode, setHighlightedNode] = useState(null);
  const [highlightedPath, setHighlightedPath] = useState([]);
  const [firstPath,setFirstPath] = useState([]);

  const fileInputRef = useRef(null);


  const [espNumber, setEspNumber] = useState("");
  const [location, setLocation]= useState("");
  const [editingNode, setEditingNode] = useState(null);

  const [serverResponse, setServerResponse] = useState(null);
  const [showNotification, setShowNotification] = useState(false); 

  // const matrix =getAdjacencyMatrix();
  const getAdjacencyMatrix = () => {
    return updateAdjacencyMatrix(); // Call function and return the matrix
  };


  const [stairConnections, setStairConnections] = useState([])

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        containerRef.current.style.width = `${window.innerWidth * 0.8}px`;
        containerRef.current.style.height = `${window.innerHeight * 0.8}px`;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    console.log("Nodes:", nodes);
  }, [nodes]);

  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setBackgroundImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleContainerClick = (e) => {
    if (mode !== "addNode") return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const newNode ={id: nodes.length, x, y }

    setNodes((prevNodes) => [...prevNodes, newNode]);
    saveNodePosition(newNode.id, newNode.x, newNode.y);

    setMode("none");
    
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    draggingNodeId.current = nodeId;
  };

  const handleContainerMouseMove = (e) => {
    if (draggingNodeId.current === null) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === draggingNodeId.current ? { ...node, x, y } : node
      )
    );
    saveNodePosition(draggingNodeId.current, x, y);
  };

  const handleContainerMouseUp = () => {
    draggingNodeId.current = null;
    updateAdjacencyMatrix();
  };

  const handleNodeClick = (e, nodeId) => {
    e.stopPropagation();
    if (mode === "connect") {
      if (selectedNode === null) {
        setSelectedNode(nodeId);
      } else if (selectedNode !== nodeId) {
        setConnections((prev) => [...prev, { from: selectedNode, to: nodeId }]);
        setSelectedNode(null);
        updateAdjacencyMatrix();
      }
    } else if (mode === "setStartNode") {
      setStartNode(nodeId);
      setMode("none"); // Reset the mode after selection
      console.log(`Start Node is set to: ${nodeId}`);
    } else if (mode === "setDestination") {
      setDestinationNode(nodeId);
      setMode("none");
      console.log(`Destination Node is set to: ${nodeId}`);
    }
    else if (mode === "connectFloors") {
      if (selectedNode === null) {
        setSelectedNode(nodeId);
      } else if (selectedNode !== nodeId) {
        setStairConnections((prev) => [...prev, { from: selectedNode, to: nodeId }]);
        setSelectedNode(null);
      }
    }
    else if(mode === "editNode"){
      setEditingNode(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      if(node){
        setEspNumber(node.espNumber || "");
        setLocation(node.location || "");
      }else{
        setSelectedNode(nodeId);
      }
    }
  };

  const handleLineDoubleClick = (index, e) => {
    e.stopPropagation();
    setConnections((prev) => prev.filter((_, i) => i !== index));
    updateAdjacencyMatrix();
  };

  // const handleNodeDoubleClick = (nodeId) => {
  //   setEditingNode(nodeId); // Set the node in edit mode
  //   const node = nodes.find(n => n.id === nodeId);
  //   if (node) {
  //     setEspNumber(node.espNumber || ""); // Pre-fill ESP number if available
  //     setLocation(node.location || ""); // Pre-fill location if available
  //   }
  // };
  

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));

  const updateAdjacencyMatrix = () => {
    const matrix = {};
    nodes.forEach((node) => (matrix[node.id] = []));
    connections.forEach(({ from, to }) => {
      if (!matrix[from].includes(to)) {
        matrix[from].push(to);
      }
      if (!matrix[to].includes(from)) {
        matrix[to].push(from);
      }
    });
    console.log("Adjacency Matrix:", matrix);
    return matrix;
  };

  const resetAdjacencyMatrix = () => {
    setConnections([]); // Clear all connections
    console.log("Adjacency Matrix Reset:", {}); // Print empty matrix
  };



  const sendAdjacencyMatrix = async () => {
    const matrix = {};
    nodes.forEach((node) => (matrix[node.id] = []));
    connections.forEach(({ from, to }) => {
      if (!matrix[from].includes(to)) matrix[from].push(to);
      if (!matrix[to].includes(from)) matrix[to].push(from);
    });
  
    try {
      const response = await fetch(`${API_BASE_URL}/save-matrix`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(matrix),
      });
  
      const data = await response.json();
      console.log("Server Response:", data);
    } catch (error) {
      console.error("Error sending adjacency matrix:", error);
    }
  };

  let shortestPathData = null; // Global variable


  const sendStartAndDestination = async (startNode ,destinationNode) => {
    if (startNode === null || destinationNode === null) {
      alert("Please select both a Start and Destination Node.");
      return;
    }
    sendAdjacencyMatrix(); // Send the adjacency matrix first
    const requestBody = {
      startNode: startNode.toString(),
      targetNode: destinationNode.toString(),
    };

    try {const response = await fetch(`${API_BASE_URL}/shortest-path`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    console.log("Request Body:", requestBody);
    const data = await response.json();
    console.log("Server Response:", data);
    
      // var data =  getShortestPath();
      if (data.status === "success") {
        shortestPathData = data;
        animatePath(data.path);
        alert(`Shortest path found: ${data.path.join(" → ")}`);
        
      } else {
        alert("Failed to find shortest path.");
      }
      return {startNode, destinationNode, shortestPathData};
      
    } catch (error) {
      console.error("Error sending start and destination nodes:", error);
    }
  };

  




  const animatePath = async (path) => {
    console.log("Animating path:", path);
    for (let i = 0; i < path.length; i++) {
      console.log("Highlighting node:", path[i]);
      setHighlightedNode(Number(path[i])); // Convert to number if needed
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setHighlightedNode(null);
  };

  const submitNodeData = async (nodeId) => {
    if (!espNumber || !location) {
      alert("Please fill in both ESP Number and Location.");
      return;
    }
  
    const requestBody = {
      node: nodeId,
      espNumber: espNumber,
      locationOfNode: location,
    };

    console.log("sendind data",requestBody);
  
    try {
      const response = await fetch(`${API_BASE_URL}/add-node-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
       
      });
      
  
      const data = await response.json();
      const data2 = response.status;
      console.log("Server Response:", data);
      if (response.status === 201) {
        alert("Node data saved successfully!");
        setEditingNode(null);
        setEspNumber("");
        setLocation("");
      }
      else if(response.status === 400  && data.message.includes("Node already exists")){
        // const data = await response.json()
        alert("Node data already exists.");

        // if (data.error && data.error.includes("duplicate key")) {
        //   alert("Error: Node already exists! Please use a unique value.");
      } 
       else {
        alert("Error saving node data.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to connect to the server.");
    }
  };
  
  // const API_URL = "http://192.168.43.207:3000/api";

const fetchNodes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/getallnodes`);
    console.log("Response:", response);

    const data = await response.json();
    console.log("Fetched Data:", data); // Debugging output

    setNodes(data);
  } catch (error) {
    console.error("Error fetching nodes:", error);
  }
};


  const deleteNode = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/deletenodedata/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Node deleted successfully!");
        fetchNodes();
      } else {
        alert("Error deleting node.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const deleteAllnodedata = async () => {
    try{  
      const response = await fetch(`${API_BASE_URL}/deleteAllNodes`,{
        method: "DELETE",
      headers:{
        "Content-Type": "application/json",
      }});
      const data = await response.json();
      if(response.ok){
        alert("All nodes deleted successfully!");
      }else{
        alert("Error deleting nodes.");
      }
    }catch(error){
      console.error("Error:", error);
      alert ("Error deleting nodes.");

    }
  }




  // const saveMapToServer = async () => {
  //   const mapData = {
  //     nodes,
  //     connections,
  //     backgroundImage,
  //     zoom,
  //     startNode,
  //     destinationNode,
  //   };

  //   try {
  //     const response = await fetch("http://192.168.1.21:3000/api/save-map", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(mapData),
  //     });

  //     const data = await response.json();
  //     if (data.status === "success") {
  //       alert("Map saved successfully on the server!");
  //     } else {
  //       alert("Error saving map to server!");
  //     }
  //   } catch (error) {
  //     console.error("Error saving map:", error);
  //     alert("Error saving map to server!");
  //   }
  // };

  //  // Load the saved map state from the server
  //  const loadMapFromServer = async () => {
  //   try {
  //     const response = await fetch("http://192.168.1.21:3000/api/save-map");
  //     const data = await response.json();
  //     if (data.status === "success") {
  //       const mapData = data.mapData;
  //       setNodes(mapData.nodes || []);
  //       setConnections(mapData.connections || []);
  //       setBackgroundImage(mapData.backgroundImage || null);
  //       setZoom(mapData.zoom || 1);
  //       setStartNode(mapData.startNode || null);
  //       setDestinationNode(mapData.destinationNode || null);
  //       alert("Map loaded successfully from the server!");
  //     } else {
  //       alert("Error loading map from server!");
  //     }
  //   } catch (error) {
  //     console.error("Error loading map:", error);
  //     alert("Error loading map from server!");
  //   }
  // };
const adaamatrix = getAdjacencyMatrix();
console.log(adaamatrix);

   const saveGraph =async()=>{
    try{
      const response = await fetch(`${API_BASE_URL}/save-graph`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({graphName, adjancylist:adaamatrix,path:shortestPathData.path})
        
      });
      
      const data = await response.json();
      alert(data.message);
      return response.json();

    }catch(e){
      console.error("Error saving graph",e);
    }
  };

    const fetchGraph = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}get-graph/${graphName}`);
            const data = await response.json();
            setGraphData(data);
            return data;
        } catch (error) {
            console.error("Error fetching graph:", error);
        }
    };
// const[nodeId, setNodeId] = useState(null);
const [polling,setPolling] = useState(false);
let intervalRef = useRef(null);
const lastClosestNodeRef = useRef(null); 

const monitor = async () => {
    try{
        const response = await fetch(`${API_BASE_URL}/closest-node`);
        if(!response.ok){
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        console.log("Closest Node:", data);
        const newStartNode= (Number(data.nodeId));

        const destResponse = await fetch(`${API_BASE_URL}/live-destination`);
        if (!destResponse.ok) {
          throw new Error("Failed to fetch destination node data");
        }
        const destData = await destResponse.json();
        const newDestinationNode = (Number(destData.DesNode));
        
        
        if (lastClosestNodeRef.current === null || newStartNode !== lastClosestNodeRef.current) {
          lastClosestNodeRef.current = newStartNode; // Update the last known node
          
          const path = await sendStartAndDestination1(newStartNode, newDestinationNode);
          // const path = await sendStartAndDestination1(newStartNode, destinationNode); 
          if(path){
            sendPathtoServer(path);
          }
        }
        
    }catch(error){
        console.error("Error fetching data:", error);
    }
  }

let currentPath=[];
  const sendStartAndDestination1 = async (startNode ,destinationNode) => {
    if (startNode === null || destinationNode === null) {
      console.log("Please select both a Start and Destination Node.");
      return;
    }
    sendAdjacencyMatrix(); 
    const requestBody = {
      startNode: startNode,
      targetNode: destinationNode,
    };

    try {const response = await fetch(`${API_BASE_URL}/shortest-path`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    console.log("Request Body:", requestBody);
    const data = await response.json();
    console.log("Server Response:", data);
    
      // var data =  getShortestPath();
      if (data.status === "success") {
        shortestPathData = data;
        console.log(`Shortest path found: ${data.path.join(" → ")}`); 
        setHighlightedPath(data.path.map(Number));
        setFirstPath(data.path.length > 0 ? Number(data.path[0]) : null);
        currentPath=data.path;
        return data.path;
        
      } else {
       console.log("Failed to find shortest path.");
      }
      // return {startNode, destinationNode, shortestPathData};
      
    } catch (error) {
      console.error("Error sending start and destination nodes:", error);
    }
  };

  const saveNodePosition = async (nodeId, x, y) => {
    try{

      const requestBody = { nodeId: String(nodeId), x, y }; 
      await fetch(`${API_BASE_URL}/save-node-position`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify(requestBody)
      });
      console.log(requestBody);
    }catch(error){
      console.error("Error saving node position:", error);
    }
  };


const sendPathtoServer= async(path)=>{
  try{
    const response = await fetch(`${API_BASE_URL}/send-path`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
      },
      body: JSON.stringify({ path: path })
    });
    const data = await response.json();
    setServerResponse(data);
    console.log("Server Responsase:", data);
    setShowNotification(true);

    // setTimeout(() => {
    //   setShowNotification(false);
    // }, 10000);
    
  }catch(error){
    console.error("Error sending path to server:", error);
    setServerResponse({ error: "Failed to send path" });
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  }
}


const togglePolling = () => {
  if (polling) {
    clearInterval(intervalRef.current); // Stop polling immediately
    intervalRef.current = null; // Reset ref
    setHighlightedPath([]);
    setFirstPath([]);
    console.log("Polling stopped");
    lastClosestNodeRef.current = null;
  } else {
    monitor(); // Fetch once immediately
    intervalRef.current = setInterval(monitor, 5000);
    console.log("Polling started");
  }
  setPolling(!polling); // Update state AFTER stopping/starting interval
};

useEffect(() => {
  return () => {
    clearInterval(intervalRef.current); // Cleanup on unmount
    intervalRef.current = null;
  };
}, []);

  return (
    <div className="app">
        <div>
        <h2>Send Path to Server</h2>
        {serverResponse && showNotification && (
        <div className="instruction-response">
           <button className="small-button" onClick={() => setShowNotification(false)} >x</button>
          <h3>Next Instruction:</h3>
          <p><strong>Action:</strong> {serverResponse.nextInstruction?.action || "N/A"}</p>
          <p><strong>Next Node ID:</strong> {serverResponse.nextInstruction?.nxt_nodeId ||"N/A"}</p>
          
        </div>
      )}
        </div>

      <div className="zoom-controls">
        <button onClick={zoomOut}>–</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={zoomIn}>+</button>
      </div>
      
      {editingNode !== null && (
      <div className="node-input-form">
        <h4>Update Node {editingNode}</h4>
        <p>Doesn't work for node 0</p>
        <div>
        <input 
        className="m-input"
          type="text" 
          placeholder="ESP Number" 
          value={espNumber} 
          onChange={(e) => setEspNumber(e.target.value)} 
        />
        <input 
        className="m-input"
          type="text" 
          placeholder="Location" 
          value={location} 
          onChange={(e) => setLocation(e.target.value)} 
        />
        <button className="m-button" onClick={() => submitNodeData(editingNode)}>Save</button>
        <button className="m-button" onClick={() => setEditingNode(null)}>Cancel</button>
      </div>

      {/* <ul>
        {nodes.map((n) => (
          <li key={n._id}>
            Node: {n.node} | ESP: {n.espnumber} | Location: {n.locationofnode}
            <button onClick={() => setEditNodeId(n._id)}>Edit</button>
            <button onClick={() => deleteNode(n._id)}>Delete</button>
          </li>
        ))}
      </ul>

      <button onClick={fetchNodes}>Refresh Nodes</button> */}
      <button onClick={() => deleteAllnodedata(editingNode)}>Delete All Node Data </button>

      </div>
    )}
      
      <div
        className="image-container"
        ref={containerRef}
        onClick={handleContainerClick}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        style={{ transform: `scale(${zoom})` }}
      >
        {backgroundImage && <img src={backgroundImage} alt="Background" className="background-image" />}

        {nodes.map((node) => (
          <div
            key={node.id}
            className={`node 

            ${mode === "connect" && selectedNode === node.id ? "selected" : ""}
            ${startNode === node.id ? "start-node" : ""}
            ${destinationNode === node.id ? "destination-node" : ""}
            ${highlightedNode === node.id ? "highlighted" : ""}
            ${highlightedPath.includes(node.id) ? "highlighted" : ""} 
            ${firstPath === node.id ? "closenode" : ""}
            `}
            style={{ left: node.x, top: node.y }}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onClick={(e) => handleNodeClick(e, node.id)}
            
          >
            {node.id}
            
          </div>
        ))}

        

        <svg className="connections-svg">
          {connections.map((conn, index) => {
            const fromNode = nodes.find((n) => n.id === conn.from);
            const toNode = nodes.find((n) => n.id === conn.to);
            if (!fromNode || !toNode) return null;
            return (
              <line
                key={index}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="lime"
                strokeWidth="3"
                onDoubleClick={(e) => handleLineDoubleClick(index, e)}
              />
            );
          })}

            {stairConnections.map((conn, index) => {
            const fromNode = nodes.find((n) => n.id === conn.from);
            const toNode = nodes.find((n) => n.id === conn.to);
            if (!fromNode || !toNode) return null;
            return <line key={index} x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} stroke="blue" strokeWidth="3" strokeDasharray="5,5" />;
          })}
        </svg>
        
        
        
        <div className="control-panel">
          <button onClick={() => document.getElementById("bg-upload").click()}>Add Image</button>
          <button onClick={() => setMode("addNode")}>Add Node</button>
          <button onClick={() => setMode("connect")}>Connect Nodes</button>
          <button onClick={resetAdjacencyMatrix}>Reset Matrix</button>
          {/* <button onClick={sendAdjacencyMatrix}>Send Matrix</button> */}

          <button onClick={() => setMode("setStartNode")}>Select Start Node</button>
          <button onClick={() => setMode("setDestination")}>Select Destination Node</button>
          <button onClick={() => sendStartAndDestination(startNode, destinationNode)}>Find Path</button>
          {/* <button onClick={() => deleteNodeon(node.id)}>Delete Node</button> */}

          {/* <button onClick={getShortestPath}>Find Shortest Path</button> */}

          {/* <button onClick={() => saveMapToServer()}>Save Map</button> */}
          {/* <button onClick={() => loadMapFromServer()}>Load Map</button> */}
          <button onClick={() => setMode("editNode")}>Edit Node</button>
          <button onClick={togglePolling}>
                {polling ? "Stop Live Monitoring" : "Start Live Monitoring"}
            </button>
          
        </div>
        
      </div>
      
      <div >
        <MapManager
         initialadjancymatrix={()=>getAdjacencyMatrix()} 
         start={startNode} 
         destination={destinationNode} 
       />
      </div>
      
      <input  ref={fileInputRef} id="bg-upload" type="file" onChange={handleBackgroundUpload} style={{ display: "none" }} />
    </div>
  );
}

export default App;
