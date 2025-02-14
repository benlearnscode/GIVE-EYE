const express = require('express');
const router= express.Router();
const {functiond, getDD,adjmatrix,sendshort}=require("../controllers/controfun")

router.route("/").get(  functiond);

router.route("/location").post(getDD);

router.route("/save-matrix").post(adjmatrix);

router.route("/shortest-path").post(sendshort);

module.exports=router;