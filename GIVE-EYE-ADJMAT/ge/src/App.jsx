import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [mode, setMode] = useState("none");
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);
  const draggingNodeId = useRef(null);

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
    setNodes((prevNodes) => [...prevNodes, { id: prevNodes.length, x, y }]);
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
  };

  const handleContainerMouseUp = () => {
    draggingNodeId.current = null;
    updateAdjacencyMatrix();
  };

  const handleNodeClick = (e, nodeId) => {
    e.stopPropagation();
    if (mode !== "connect") return;
    if (selectedNode === null) {
      setSelectedNode(nodeId);
    } else if (selectedNode !== nodeId) {
      setConnections((prev) => [...prev, { from: selectedNode, to: nodeId }]);
      setSelectedNode(null);
      updateAdjacencyMatrix();
    }
  };

  const handleLineDoubleClick = (index, e) => {
    e.stopPropagation();
    setConnections((prev) => prev.filter((_, i) => i !== index));
    updateAdjacencyMatrix();
  };

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
      const response = await fetch("http://192.168.43.207:3000/api/save-matrix", {
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
  
  

  return (
    <div className="app">
      <div className="zoom-controls">
        <button onClick={zoomOut}>–</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={zoomIn}>+</button>
      </div>

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
            className={`node ${mode === "connect" && selectedNode === node.id ? "selected" : ""}`}
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
        </svg>

        <div className="control-panel">
          <button onClick={() => document.getElementById("bg-upload").click()}>Add Image</button>
          <button onClick={() => setMode("addNode")}>Add Node</button>
          <button onClick={() => setMode("connect")}>Connect Nodes</button>
          <button onClick={resetAdjacencyMatrix}>Reset Matrix</button>
          <button onClick={sendAdjacencyMatrix}>Send Matrix</button>


        </div>
      </div>

      <input id="bg-upload" type="file" onChange={handleBackgroundUpload} style={{ display: "none" }} />
    </div>
  );
}

export default App;
