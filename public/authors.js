var jsonDef = {

	"transformer.updates":{
		"data":decorate
	},
	"transformer.deletes":["jsonapi,links,updates,deletes,included,includeMap,data.meta,data.type,data.burst.meta,data.burst.type"]
};

/*
* The transformer.update is for a field named data which happens to be a array
* jsontransformer passes entire array in d[k] argument and the v argument.  You can use either
* to iterate and modify underlying values
*
* If this was complex type (ie. object), d argument would equal the entire document and v would equal
* the value of the currently accessed complex type on the document. k is the 'key' otherwise known as
* the name of the field.
*
*/
function decorate(k,v,d,src){

	var includeMap = getIncludedChildren(src.included);

	//d.includeMap = includeMap;

	console.log("convenienceMap");
	console.log(includeMap)

	var rootName = "";

	for(var rootIndex =0; rootIndex < d[k].length; rootIndex++){

		
		rootName = d[k][rootIndex].type;

		rootName = rootName.substring(rootName.lastIndexOf("-")+1) + "s";
		

		for(child in d[k][rootIndex].relationships){

			if(d[k][rootIndex].relationships[child].data instanceof Array){
				var resultObject = {};
				resultObject[child] = [];
				//Burst data is array 
				for(idx in d[k][rootIndex].relationships[child].data){
					var arrChild = d[k][rootIndex].relationships[child].data[idx];
					arrChild = appendAttributesTo2(arrChild,includeMap)
					resultObject[child].push(arrChild);
					
				}
				
				d[k][rootIndex].attributes = Object.assign(d[k][rootIndex].attributes,resultObject);

			} else if(d[k][rootIndex].relationships[child].data != null){
				d[k][rootIndex].attributes[child] = appendAttributesTo2(d[k][rootIndex].relationships[child].data,includeMap)
				//d[k][rootIndex].attributes[child] = d[k][rootIndex].relationships[child].data.attributes;
			} else {
				d[k][rootIndex].attributes[child] = {}
			}

			

			
		}

		d[k][rootIndex] = d[k][rootIndex].attributes;
		
	}

	d.setKeyName(rootName);

	
	
}

function getIncludedChildren(includeArray){

	var convenienceMap = {};

	var srcMap = {};

	for(idx in includeArray){

		srcMap[includeArray[idx].id] = includeArray[idx];
	}

	delete includeArray;

	for(includeIdx in srcMap){
		var theChild = srcMap[includeIdx];
		
		console.log("Working on the child " + theChild.id);
		console.log(theChild.relationships)

		if(!convenienceMap[theChild.id]){
			convenienceMap[theChild.id] = theChild.attributes;
		}
		
		//See if children have relationships are next
		var y = 0;
		for(var key in theChild.relationships){

			var uncle = srcMap[theChild.relationships[key].data.id]
			if(uncle){
				console.log("Uncle is " + uncle.id)
				console.log(`Compare ${uncle.id} = ${theChild.relationships[key].data.id}`)
			}
			//for paragraphs, look for attributes on next sibling of our parent (uncle)
			if(uncle && theChild.relationships[key].data.id == uncle.id){
				console.log(`Copied object is now: ${uncle.id}`)
				convenienceMap[theChild.id] = Object.assign(uncle.attributes,theChild.attributes)
				console.log(`Assigned attributes to includedMap[${theChild.id}]`)
				console.log(convenienceMap[theChild.id])
				
			}
		}
		
		
	}
	return convenienceMap;

}

function appendAttributesTo2(thisObject,includeMap){

	console.log("appendAttributes2 Looking for " + thisObject.id)

	if(includeMap.hasOwnProperty(thisObject.id)){
		console.log("Found " + thisObject.id)
		thisObject = Object.assign(includeMap[thisObject.id],thisObject);
	} else {
		console.log("appendAttributes2 Could not find " + thisObject.id)
	}

	return thisObject;
	

}



function appendAttributesTo(thisObject, fromObjectWithAtts){

	var type = fromObjectWithAtts.type;

	type = type.substring(type.lastIndexOf("-")+1);

	if(!thisObject[type]){
		thisObject[type] = {id:fromObjectWithAtts.id}
	}


	for(key in fromObjectWithAtts.attributes){

		thisObject[type][key] = fromObjectWithAtts.attributes[key];
		
	}/*
	for( e in fromObjectWithAtts.relationships){
		appendAttributesTo()
	}*/

}



module.exports = jsonDef;
