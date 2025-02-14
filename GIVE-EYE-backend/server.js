const express= require('express');
const bodyParser = require('body-parser');
const cors = require("cors");
const app= express();

const PORT =3000;
app.use(cors());
app.use(bodyParser.json());



app.use("/api",require("./routes/routes"));

app.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`);
})

