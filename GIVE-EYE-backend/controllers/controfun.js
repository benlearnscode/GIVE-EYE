
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
    
}


module.exports ={ functiond,getDD}