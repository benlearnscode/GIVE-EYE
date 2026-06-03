const mongoose = require('mongoose');

const nodeposSchema = new mongoose.Schema({
    nodeId : {
        type: Number,
        required: true,
        unique: true
    },
    x: {
        type: Number,
        required: true
    },  
    y : {
        type: Number,
        required: true
    },
});

module.exports = mongoose.model('NodePosition', nodeposSchema);