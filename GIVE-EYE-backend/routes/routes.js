const express = require('express');
const router= express.Router();
const {functiond, getDD}=require("../controllers/controfun")

router.route("/").get(  functiond);

router.route("/location").post(getDD);

module.exports=router;