const mongoose = require('mongoose');

const dbConn = async () => {
    try {
        const connect = await mongoose.connect(`mongodb+srv://bennybsamson:Bojc@cluster0.2wv3pzd.mongodb.net/Give_eye?retryWrites=true&w=majority&appName=Cluster0` );
        console.log(`MongoDB connected: ${connect.connection.host,connect.connection.name}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

module.exports = dbConn;