var express = require('express');
var router = express.Router();
var parser = require('xml2json');
var rp = require('request-promise');
var JsonTransform = require('../lib/jsontransform.js');


var processTheBody = (obj, updates, deletes, callback)=>{

	  new JsonTransform(obj,updates,deletes).then((output)=>{
	  	callback(output);
	  })

}

/* GET home page. */
router.post('/json', function(req, res, next) {
  res.setHeader('Content-Type','application/json');
  	var obj = {json:{firstName:"Dude", lastName:"Williams","transformer.updates":{},"transformer.deletes":[]}};
	  var updates = {};
	  var deletes = [];

	if(req.body.json){

	  		obj = req.body.json;
	  		if(obj["transformer.updates"]){
	  			updates = obj["transformer.updates"];
	  			for(key in updates){
	  				updates[key] = eval(updates[key]);
	  			}
	  		}
	  		if(obj["transformer.deletes"]){
	  			deletes = obj["transformer.deletes"];
	  		}
	}

	console.log("req.query.service is " + req.query.service)
	//
	if(req.query.service != undefined){
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
				});
	 }


 

  
});

router.post('/xml',xmlparser({trim: false, normalize:false,normalizeTags:false, explicitArray: false}),(req,res,next)=>{

	var content = {xml:{sample:"Please provide a sample xml doc in body"},updates:{},deletes:[]};
	var obj = content.xml;
	var updates = content.updates;
	var deletes = content.deletes;

	if(req.body.xml){

		console.log("Saw XML " + JSON.stringify(req.body.xml))
		obj = req.body.xml;
		
		if(obj["transformer.updates"]){
	  			var updateArray = obj["transformer.updates"] instanceof Array ? obj["transformer.updates"] : [obj["transformer.updates"]];
	  			console.log("Next Line")
	  			console.log(updateArray)
	  			updates = {};
	  			for(var i=0;i<updateArray.length;i++){
	  				updates[updateArray[i].key] = eval(updateArray[i].code);
	  				
	  			}
	  			console.log("Saw updates")
	  			console.log(updates)
	  			delete obj["transformer.updates"];
	  			deletes.push("transformer.updates");
	  	}
	  	if(obj["transformer.deletes"]){
	  			deletes = obj["transformer.deletes"] instanceof Array ? obj["transformer.deletes"] : [obj["transformer.deletes"]];
	  			delete obj["transformer.deletes"];
	  			deletes.push("transformer.deletes");
	  	}
  	}

  	processTheBody(obj,updates,deletes,(output)=>{
  		res.end(JSON.stringify(output));
  	});

})

module.exports = router;
