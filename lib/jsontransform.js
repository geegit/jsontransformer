var logger = require('morgan');
/**
 * 	@namespace utils
 * 	@fileOverview JsonTransform Extracts, Transforms between custom Json formats 
 *	and returns the result
 *	Provides simple syntax to add,delete,modify json
 * 	@author <a href="mailto:gregory.jones05@gmail.com">Greg Jones</a>
 * 	@version 1.1.2
 *	@example
 *	new JsonTransform(inputJson)
*		.on("firstname",(key,value,destObj,sourceObj)=>{
*		//Ex. manipulate the firstname value toUpperCase
*			destObj[key] = value.toUpperCase()
*		})
*		//Ex. delete address.
*		.delete("address.streetLine2, address.countryCode")
*		.then((outPutJson)=>{ console.log(outPutJson)})
*/


/*
*	@function Car Creates a Car type with user specified color
*	@param {string} color Any color for the car
*	@return {Car} this
*	@returns {Car} this
*/
function Car(color){
	this.color = color;
	return this;
}

/*	Creates new instance of JsonTransform
*	
*/ 
class JsonTransform {

	/*
	*	@param {object} object The source object to read
	*/
	constructor(object,transformations,deletes){
		console.log(JSON.stringify(deletes))
		 /** The internal holder for the source json object
		 *	@type {object} */
		this.object = object ? object : {};
		/** The internal holder for the transformations. Should never need to access directly
		 *	@type {Array} */
		this.ons = transformations ? transformations : {};
		
		/** The internal holder for the list of deletes needed. Should never need to access directly
		*	User passes list for convenience. Internal representaion is a Map (object)
		 *	@type {object} */
		this.deletes = {};
		if(deletes && deletes instanceof Array){
			for(let idx in deletes){
				this.deletes[deletes[idx]] = true;
			}
		}
		/** The internal holder for the path or pointer to current location is json hierachy
		 *	@type {object} */
		this.base = "this.object.";	
		console.log(JSON.stringify(this.deletes))
		
	}

	load(object){
		this.object = object;
		return this;
	}	
	/*
	*	listen for path event and call your function when the event is triggered
	*	
	* 	your function will be called with (key,value,destinationJson,sourceJson)
	*	@param {string} event The path you want to listen to
	*	@param {function} fptr The function body you want to execute when event is triggered 
	*
	*/
	on(event,fptr){

		let events = event.split(",")
		for(let idx in events){
			this.ons[events[idx].trim()] = fptr;
		}
		
		
		return this;
	}

	andModifyField(event,fptr){
		this.on(event,fptr);
		return this;
	}
	/*
	*	delete paths from the destination json
	*	
	*	@param {string} event The path you want to listen to and delete
	*
	*/
	delete(event){
		let events = event.split(",");
		for(let idx in events){
			this.deletes[events[idx].trim()] = true;
		}
		
		console.log(`Deletes is now ${JSON.stringify(this.deletes)}`);
		return this;
	}

	/*
		@function failure
	*	Internal Failure method is invoked on any type of internal failure.
	*	
	* 	your function will be called with (key,value,destinationJson,sourceJson)
	*	@param {string} error The error encountered
	*	@param {string} onFunc The function 'path' that threw the error
	*
	*/
	failure(error,onFunc){
		console.error(`Failed executing method new JsonTransform(...).on("${onFunc}")`);
		console.error(`Error is ${error.message}`);
		if(error.lineNumber){
			console.error(`Error lineNumber was ${error.lineNumber}`)
		}
		return this;
	}


	/*
	*	Workhorse function reads from source, applies transformations and writes to output
	*	
	* 	your function will be called with (key,value,destinationJson,sourceJson)
	*	@param {string} obj The json source object
	*	@param {string} useThisBase Internally managed ptr to current object path location
	*
	*/
	copyFrom(obj,useThisBase){

		var inform = "";

		var newObject = {};

		var lookupKey = "";

		for(let key in obj){
			console.log(`Reading key ${useThisBase + "." + key } from object as ${obj[key]}`)
			console.log("Testing Key " + key)

			lookupKey = useThisBase.trim().length > 0 ? useThisBase + "." + key : key;


			if(obj[key] instanceof Array){

				console.log(`I see a child Array named ${useThisBase + key}`);

				console.log(`${obj[key]} instanceof Array ${obj[key] instanceof Array}`)

				var copyThisObject = [].concat(obj[key])

				newObject[key] = copyThisObject;

				useThisBase = useThisBase.trim().length > 0 ? useThisBase + "." + key: key;


				//peek to see if this is array of primitives
				//ie.[1,3,4] pass entire array ie animation.frames
				if(obj[key].length > 0 ){
					if(obj[key][0] instanceof Object){

						//Do parent first
						if(this.ons.hasOwnProperty(useThisBase)){
							try {
								//destination.label = destination[key];
								console.log(`${useThisBase} param ${newObject}`)
								newObject.setKeyName = (name)=>{this[name] = this[key]; delete this[key];}
								this.ons[useThisBase](useThisBase,newObject[key],newObject,obj);
							}catch(e){
								this.failure(e,useThisBase)
							}
						}
						
						console.log("I see some objects in this array")
						//Complex Array of Objects
						for(let index = 0; newObject[key] && index < newObject[key].length; index++){

							newObject[key][index] = this.copyFrom(newObject[key][index],useThisBase);
						//[1,3,4] pass entire array ie animation.frames

						}
						useThisBase = "";
					} else {
						//it is a primitive
						//it's a primitive
						console.log(`Primitive Array Looking for ${lookupKey} on ${JSON.stringify(newObject[key])}`)
						if(this.ons.hasOwnProperty(lookupKey)){
							try {
								newObject.setKeyName = (name)=>{this[name] = this[key]; delete this[key];}
								this.ons[lookupKey](key,newObject[key],newObject[key],obj);
							}catch(e){
								this.failure(e,lookupKey)
							}
						}

						//useThisBase = "";
					}
				}

			} else 

			if(obj[key] instanceof Object){
				//create empty object on 'destination object' since we will recursivley 
				//populate a child object
				console.log(`I see a child Object named ${useThisBase + "." + key}`);

				console.log(`${obj[key]} instanceof Array ${obj[key] instanceof Array}`)

				var copyThisObject = obj[key] instanceof Array ? [] : Object.assign({},obj[key])

				newObject[key] = copyThisObject;

				useThisBase = useThisBase.trim().length > 0 ? useThisBase + "." + key: key;

				console.log("useThisBase  is " + useThisBase)

				if(!isNaN(useThisBase)){
					console.log("Found Numbers");
					//reset it
					useThisBase = "";
				//continue;
				}

				var beforeType = typeof newObject[key];

				//Do parent first
				if(this.ons.hasOwnProperty(useThisBase)){
					try {
						//destination.label = destination[key];
						console.log(`${useThisBase} param ${newObject}`)
						this.ons[useThisBase](useThisBase,newObject[key],newObject,obj);
					}catch(e){
						this.failure(e,useThisBase)
					}
				}

				var afterType = typeof newObject[key];
				//Test to make sure user didn't overwrite the value with different type of value
				//Only JS allows this BS but whatever. We all love loosely typed languages,right?
				if(beforeType == afterType){
					newObject[key] = this.copyFrom(newObject[key],useThisBase);
				}

				useThisBase = useThisBase.substr(0,useThisBase.indexOf("."));

			} else {

				//Copy Values
				newObject[key] = obj[key];
				//Call User specified events to override with any changes

				console.log(`Instance Object section: Looking for ${lookupKey} on ${JSON.stringify(newObject[key])}`)
				//console.log(this.ons)
				if(this.ons.hasOwnProperty(lookupKey)){
					
					try {
						newObject.setKeyName = function(name){this[name] = this[key]; delete this[key];}
						console.log(JSON.stringify(newObject.setKeyName))
						console.log(this.ons)
						this.ons[lookupKey](key,newObject[key],newObject,obj);
					}catch(e){
						this.failure(e,lookupKey)
					}
				}

			} 
			
			//Do deletes
			if(this.deletes.hasOwnProperty(lookupKey)){
				console.log("Continuing " + "delete newObject." + key);

				console.log(JSON.stringify(newObject))

				var retCode = eval("delete newObject." + key);

				console.log("Continuing return " + retCode);
				
				//continue;
			}
				
		}

		useThisBase = "";

		return newObject;

	}
	/*
	*	Called at end of processing to signal to user that document is ready.  Your callback will 
	*	receive the following params: (output)
	*	
	* 	
	*	@param {function} callWhenDone The function you want called when source json is ready. 
	*	It will automatically have the output object supplied to it as a parameter. This is where
	*	you would typically print the object or return results from web service
	*	 
	*
	*/
	then(callWhenDone){

		console.log("Time to get it on!")


		
		var newObject = this.copyFrom(this.object,"");

		newObject.updates = this.ons;

		callWhenDone(newObject);
		
	}
}

	
module.exports =  JsonTransform;
