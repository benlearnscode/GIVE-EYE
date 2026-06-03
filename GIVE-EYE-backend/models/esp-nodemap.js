const mongoose = require('mongoose');
const mapSchema = mongoose.Schema({
    node:{
        type : Number,
        required : true,
        unique : true,
    },
    espNumber:{
        type : String,
        required : true,
    },
    locationOfNode:{
        type : String,
        required:[true,'Please add a location atleast as numbers'],
    },
});

module.exports = mongoose.model('nodemap',mapSchema);