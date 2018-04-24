var express = require('express');
var router = express.Router();
var parseString = require('xml2js').parseString;
var rp = require('request-promise');
var JsonTransform = require('../lib/jsontransform.js');


var processTheBody = (obj, updates, deletes, callback,errors)=>{

	  new JsonTransform(obj,updates,deletes,errors).then((output)=>{
	  	callback(output);
	  })

}

/* GET home page. */
router.post('/json', function(req, res, next) {
  res.setHeader('Content-Type','application/json');
  	var obj = {json:{firstName:"Dude", lastName:"Williams","transformer.updates":{},"transformer.deletes":[]}};
	  var updates = {};
	  var deletes = [];
	  var errors = [];
	  var config = "";
	if(req.body.json){

			console.log("Up in HERE JSON")

	  		obj = req.body.json;

	  		if(obj["transformer.updates"]){
	  			updates = obj["transformer.updates"];
	  		}

	  		if(obj["transformer.deletes"]){
	  			deletes = obj["transformer.deletes"];
	  		}

	  		if(obj.config){
	  			console.log(`Getting Config ../public/${obj.config}`)
	  			jsonDef = require(`../public/${obj.config}`);
	  			console.log(config)
	  			deletes = jsonDef["transformer.deletes"];
	  			updates = jsonDef["transformer.updates"];
	  		}

  			try {

	  			for(key in updates){
	  				updates[key] = eval(updates[key]);
	  			}

  			}catch(e){
  				errors.push({error:`Transformation for ${key} failed with message ${e.message}`,lineNumber:e.lineNumber})
  			}
	  		
	  		


	}

	console.log("req.query.service is " + req.query.service)
	//
	if(req.query.service != undefined){
		var url = decodeURI(req.query.service);	  	
		rp(req.query.service)
		    .then((obj) =>{ 
		    	obj = JSON.parse(obj)
			    processTheBody(obj,updates,deletes,(output)=>{
				  	res.end(JSON.stringify(output));
				});
		    }) // Process html...
		    .catch((err) => console.log(err));
	 } else {
	 	 processTheBody(obj,updates,deletes,(output)=>{
				  	res.end(JSON.stringify(output));
				},errors);
	 }


 

  
});

router.post('/xml',xmlparser({trim: false, normalize:false,normalizeTags:false, explicitArray: false}),(req,res,next)=>{

	var content = {xml:{sample:"Please provide a sample xml doc in body"},updates:{},deletes:[]};
	var obj = content.xml;
	var updates = content.updates;
	var deletes = content.deletes;
	var errors = [];
	if(req.body.xml){

		console.log("Saw XML " + JSON.stringify(req.body.xml))
		obj = req.body.xml;
		updates = {};
		if(obj["transformer.updates"]){
	  			var updateArray = obj["transformer.updates"] instanceof Array ? obj["transformer.updates"] : [obj["transformer.updates"]];
	  			console.log("Next Line")
	  			console.log(updateArray)
	  			
	  			for(var i=0;i<updateArray.length;i++){
	  				try {
	  					updates[updateArray[i].path] = eval(updateArray[i].code);
	  				}catch(e){
	  					updates[updateArray[i].path] = (updateArray[i].code);
	  					errors.push({error:`Transformation for ${updateArray[i].path} failed with message ${e.message}`,lineNumber:e.lineNumber})
	  				}
	  			}
	  			console.log("Saw updates")
	  			console.log(updates)
	  			delete obj["transformer.updates"];
	  			deletes.push("transformer.updates");
	  	}

	  	if(obj["transformer.deletes"]){
	  			deletes = obj["transformer.deletes"] instanceof Array ? obj["transformer.deletes"] : [obj["transformer.deletes"]];
	  			//delete obj["transformer.deletes"];
	  			//deletes.push("transformer.deletes");
	  	}
  	}

  	console.log("req.query.service is " + req.query.service)
	//
	if(req.query.service != undefined){
	  	rp(req.query.service)
		    .then((xml) =>{ 
		    	parseString(xml, {explicitArray:false,mergeAttrs:true,explicitChildren:true}, function (err, result) {
						obj = result;
				});

		    	//obj = JSON.stringify(obj);

			    processTheBody(obj,updates,deletes,(output)=>{
				  	res.end(JSON.stringify(output));
				},errors);
		    }) // Process html...
		    .catch((err) => console.log(err));
	 } else {
	 	 processTheBody(obj,updates,deletes,(output)=>{
				  	res.end(JSON.stringify(output));
				},errors);
	 }

  	

})

module.exports = router;
