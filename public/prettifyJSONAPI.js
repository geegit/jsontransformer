var jsonDef = {

	"transformer.updates":{
		"data":decorate,
		"data.games.title":elipsis
	},
	"transformer.deletes":["jsonapi,links,includesMap,included"]
};

/**
*	NOTE: d[k] holds the current value for key 'k'.  Best practice, use d[k] when making modifications
* 	that you want to appear in final json.  WHY?  Javascript is call by reference when using objects
*	v = present value of key in the current json path (.ie  {"data.firstName":'bob'} => d is document fragment key is 'data.firstName' and 'v' is "bob")
*
*/
function elipsis(k,v,d){
	d[k] = v.substring(0,20) + "...";
	d.setKeyName("shortTitle");
}

function convertIncludeListToMap(list){
	var map = {};

	for(idx in list){

		map[list[idx].id] = {id:list[idx].id, 
		type:list[idx].type,attributes:list[idx].attributes, relationships:list[idx].relationships};
	}

	return map;

}
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
function decorate(pathKey,pathValue,JSONAPIFragment,fullJSONAPIResponse){

	console.log("Made it here")

	var includesMap = convertIncludeListToMap(fullJSONAPIResponse.included);

	JSONAPIFragment[pathKey].includesMap = includesMap;

	console.log("includesMap is here");
	console.log(includesMap)


	includesMap.root = JSONAPIFragment[pathKey];

	console.log(`Length I pass is ${includesMap.root.length}`)


	var populatedTree = organizeMapIntoTree(JSONAPIFragment[pathKey],includesMap,true);

	JSONAPIFragment[pathKey] = populatedTree;
	
	//d.setKeyName(d[k][0].data.type);
	
}

function organizeMapIntoTree(sNode,map,root){


	var tree = {};

	var node = sNode;

	if(root){
		node = map.root;
	}

	if(node instanceof Array){
		var arrR = [];
		for(idx in node){

			console.log(`Found array node ${node[idx].type} with length ${node.length}`)

			
			tree[node[idx].id] = [];
			var member = map[node[idx].id];
			//root node of list will match this condition
			if(!map[node[idx].id]){
				map[node[idx].id] = node[idx];
				member = map[node[idx].id];
			}

			member = organizeMapIntoTree(member,map,false);	
		
			arrR.push(member);
			console.log(`Number of ${node[idx].type} is ${arrR.length}`)
			console.log(arrR[0])
			tree = arrR;
		}
	} else {
		console.log("Copying basic object");
		console.log(node)
		//console.log(node.attributes);
		tree = Object.assign({},node.attributes);
		
		for(key in node.relationships){
			child = node.relationships[key].data;
			if(child instanceof Array){
				
				tree[key] = organizeMapIntoTree(child,map);
			} else {
				if(map[child.id]){
					tree[key] = organizeMapIntoTree(map[child.id],map);
				}
			}
		}
	}
	
	
	return tree;
}




module.exports = jsonDef;
