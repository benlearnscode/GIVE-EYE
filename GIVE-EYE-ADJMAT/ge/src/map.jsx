import React, { useState, useEffect } from "react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import "./MapManager.css";
// import {saveGraph,fetchGraph}from "./App"

const MapManager = ({ initialadjancymatrix, start, destination }) => {
  // Floors and current floor
  const [floors, setFloors] = useState(["0"]); // Default first floor
  const [currentFloor, setCurrentFloor] = useState("0");
  const [isCollapsed, setIsCollapsed] = useState(true);

  const [mapData, setMapData] = useState({
    "0": {
      nodes: Object.keys(initialadjancymatrix || {}),
      adjacencyMatrix: initialadjancymatrix || {},
      Floorname: "Floor 1",
      startNodeId: 0,
      endNodeId: null,
      image: "default.png",
    },
  });

  useEffect(() => {
    const fetchFloors = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/floors`);
        const data = await response.json();
        if (Array.isArray(data)) {
          let newMapData = {};
          data.forEach((floor) => {
            newMapData[floor._id] = {
              Floorname: floor.Floorname,
              nodes: floor.nodes,
              adjacencyMatrix: floor.adjacencyMatrix,
              startNodeId: floor.startNodeId,
              endNodeId: floor.endNodeId,
              image: floor.image || "default.png",
            };
          });
          setMapData(newMapData);
          if (Object.keys(newMapData).length > 0) {
            setCurrentFloor(Object.keys(newMapData)[0]); // Default to first floor
          }
        }
      } catch (error) {
        console.error("Error loading floors:", error);
      }
    };

    fetchFloors();
  }, []);


  // Handle floor selection change
  const handleFloorChange = (event) => {
    const newFloor = event.target.value;
    setCurrentFloor(newFloor);
  };

  // Add a new floor
  const addFloor = async () => {
    try {
    const newFloorId = Object.keys(mapData).length.toString();
    const newFloorData = {
      Floorname: `Floor ${newFloorId+1}`,
      nodes: [
        { nodeId: 0, x: 327.768, y: 248.713 },
        { nodeId: 1, x: 528.768, y: 328.713 },
        { nodeId: 2, x: 262.713, y: 262.713 }
      ],
      adjacencyMatrix: {},
      startNodeId: 1,
      endNodeId: 2,
      image: "floor_default.jpg",
    };
   
      const response = await fetch(`${API_BASE_URL}/floors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFloorData),
      });
     
      const result = await response.json();
      console.log(newFloorData)
      if (result.ok) {
        setMapData((prev) => ({
          ...prev,
          [result.floor._id]: result.floor,
        }));
        setCurrentFloor(result.floor._id);
      } else {
        console.error("Error adding floor:", result.message);
      }
    } catch (error) {
      console.error("Failed to add floor:", error);
    }
  };

  // Save map data to backend (saves all floors)

  const saveMapData = async () => {
    try {
      const currentFloorObj = floors.find((floor) => floor._id === currentFloor);
      if (!currentFloorObj) return;
      // Optionally update start and destination from props.
      const updatedFloorData = {
        ...currentFloorObj,
        startNodeId: start?.[currentFloor] ?? currentFloorObj.startNodeId,
        endNodeId: destination?.[currentFloor] ?? currentFloorObj.endNodeId,
        // You might also update adjacencyMatrix and nodes if they changed.
      };

      const response = await fetch(`${API_BASE_URL}/floors/${currentFloor}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFloorData)
      });
      const updatedData = await response.json();
      if (updatedData.floor) {
        setFloors(
          floors.map((floor) =>
            floor._id === currentFloor ? updatedData.floor : floor
          )
        );
      } else {
        console.error("Error saving map data:", updatedData.message);
      }
    } catch (err) {
      console.error("Error saving map data:", err);
    }
  };

  
  // Toggle collapse state for the sidebar
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`map-manager ${isCollapsed ? "collapsed" : ""}`}>
      <div className="collapse-toggle" onClick={toggleCollapse}>
        {isCollapsed ? "<" : ">"}
      </div>
      {!isCollapsed && (
        <>
          <h2>Map Manager</h2>
          {/* Floor Selection */}
          <div className="floor-selection">
            <label>Floor:</label>
            <select  onChange={handleFloorChange} value={currentFloor}>
              {Object.keys(mapData).map((floorId)=> (
                <option key={floorId} value={floorId}>
               
                  {mapData[floorId]?.Floorname || `Floor ${floorId}`}
                </option>
              ))}
            </select>
            <button className="add-floor-btn" onClick={addFloor}>
              + Add Floor
            </button>
          </div>
          <hr />
          {/* Display Map Data for the current floor */}
          <div className="map-data-section">
            <h3>Map Data (Floor {currentFloor})</h3>
            <pre className="map-data-display">
              {JSON.stringify("map data")}
            </pre>
            <button className="buttt" >
              Save Map
            </button>
            <button className="buttt" >
              Load Map
            </button>
          </div>
          <hr />
          {/* Display Adjacency Matrix (if needed) */}
          <div className="adjacency-section">
            <h3>Adjacency Matrix</h3>
            <pre className="adjacency-display">
              {JSON.stringify("floor's adjancy matrix")}
            </pre>
          </div>
          <hr />
          
          <div className="connect-floors-section">
            <button
              className="connect-floors-btn"
              // onClick={}
            >
              Connect Floors (Stairs)
            </button>
          </div>
          <div>
            
          </div>
        </>
      )}
    </div>
  );
};

export default MapManager;