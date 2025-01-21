const express= require('express');
const bodyParser = require('body-parser');
const app= express();

const PORT =3000;
app.use(bodyParser.json());

app.use("/api",require("./routes/routes"));

app.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`);
})

