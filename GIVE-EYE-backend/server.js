const express= require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require("cors");
const dbConn = require('./config/dbconn');

const http = require('http'); 
const app = express();
const server = http.createServer(app); 
// app.use(express.json());
dbConn();
const PORT =3000;
app.use(cors());
app.use(bodyParser.json());


const mapsDir = path.join(__dirname, 'maps');
if(!fs.existsSync(mapsDir)){
    fs.mkdirSync(mapsDir);
}

app.use("/api",require("./routes/routes"));

app.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`);
})

