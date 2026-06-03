const express = require('express');
const router= express.Router();
const {functiond, getDD,adjmatrix,sendshort,saveMap,loadMap, sendnode,destinationfromuser,senddes}=require("../controllers/controfun")
const {getallnodes, postnodes,updatenode,deletenode,deleteAllNodes,senddestinationdata}=require("../controllers/dbconnection")
const {saveGraph,getGraph}=require("../controllers/esp-graph")
const {nodepossave,processPathAndInstructions,directionFaceing} =require("../controllers/nodepos")
const {postfloor,getSingleFloor,getallfloor,deleteFloor}=require("../controllers/floors-db")
router.route("/").get(  functiond);

router.route("/location").post(getDD);

router.route("/save-matrix").post(adjmatrix);

router.route("/shortest-path").post(sendshort);

router.route("/save-map").post(saveMap);
router.route("/load-map").post(loadMap);


router.route('/getallnodes').get(getallnodes);
router.route('/add-node-data').post(postnodes);
// router.route('/:id').put(updatenode);
router.route('/deletenodedata/:id').delete(deletenode);
router.route('/deleteAllNodes').delete(deleteAllNodes);


router.route('/save-graph').post(saveGraph);
router.route('/get-graph/:id').get(getGraph);

router.route("/closest-node").get(sendnode);
router.route("/live-destination").get(senddes);

router.route("/save-node-position").post(nodepossave);

router.route("/send-path").post(processPathAndInstructions);

router.route('/destinationslist').get(senddestinationdata);
router.route('/selecteddestination').post(destinationfromuser);


router.route('/floors').get(getallfloor);
router.route('/floors/:id').get(getSingleFloor);
router.route('/floors').post(postfloor);
router.route('/floors/:id').delete(deleteFloor);

router.route('/direction').post(directionFaceing);

module.exports=router;