const express = require('express');
const NodeMap= require('../models/esp-nodemap');

const senddestinationdata=async(req,res)=>{
    try {
        const nodes = await NodeMap.find().select('locationOfNode -_id');
        const destination = nodes.map(node =>node.locationOfNode);
        if(destination.length===0){
            return res.status(400).json({ error: "Empty list" });
        }
        res.status(200).json(destination);
    }catch(error){
        res.status(500).json({message:'Error fetching destinations',error})
    }
}

const getallnodes=async(req,res)=>{
    try{
        const nodes =await NodeMap.find();
        res.status(200).json(nodes);

    }catch (error){
        res.status(500).json({message:error.message});
    }
}


const postnodes=async(req,res)=>{
    const {node , espNumber , locationOfNode}=req.body;
    if(!node || !espNumber || !locationOfNode){
        return res.status(400).json({message:"All fields are required"});
    }

    try{
        const newNode = new NodeMap({
            node,
            espNumber,
            locationOfNode,
        });
        await newNode.save();
        console.log(`new node added${newNode}`);
        res.status(201).json(newNode);


    }catch (error){
        if(error.code === 11000){
            return res.status(400).json({message:"Node already exists"});}
        res.status(500).json({message:error.message});
    }
}

const updatenode= async(req,res)=>{
    try{
        const updateNode=await NodeMap.findByIdAndUpdate(req.params.id,req.body,{new:true});
        res.status(200).json(updateNode);
    }catch(error){
        res.status(500).json({message:error.message});
    }
}

const deletenode= async(req,res)=>{
    try {
        const { id } = req.params;
        
        // Check if ID is a valid MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid node ID format" });
        }

        const deletedNode = await NodeMap.findByIdAndDelete(id);

        if (!deletedNode) {
            return res.status(404).json({ message: "Node not found" });
        }

        res.status(200).json({ message: "Node deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

    
}

const deleteAllNodes = async (req, res) => {
    try {
        const result = await NodeMap.deleteMany({}); // Deletes all documents in the collection

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "No nodes found to delete" });
        }

        res.status(200).json({ message: "All nodes deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = {getallnodes,postnodes,updatenode,deletenode,deleteAllNodes,senddestinationdata};