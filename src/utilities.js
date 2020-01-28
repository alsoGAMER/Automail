function safeURL(URL){
	let compo = encodeURIComponent((URL || "").replace(/\s|\/|:|★/g,"-").replace(/(\.|\)|\\|#|!|,|%|’)/g,"").replace(/ä/g,"a"));
	if(useScripts.SFWmode){
		if(badWords.some(
			word => compo.match(word)
		)){
			return ""
		}
	}
	return compo
}

function fuzzyDateCompare(first,second){//returns and INDEX, not to be used for sorting
	if(!first.year || !second.year){
		return -1
	}
	if(first.year > second.year){
		return 0
	}
	else if(first.year < second.year){
		return 1
	}
	if(!first.month || !second.month){
		return -1
	}
	if(first.month > second.month){
		return 0
	}
	else if(first.month < second.month){
		return 1
	}
	if(!first.day || !second.day){
		return -1
	}
	if(first.day > second.day){
		return 0
	}
	else if(first.day < second.day){
		return 1
	}
	return -1
}

function formatTime(diff,type){
	let magRound = function(num){
		if(num < 1){
			return Math.round(num);
		}
		else{
			if(
				Math.log(Math.ceil(num)) < 2*Math.log(num) - Math.log(Math.floor(num))
			){
				return Math.ceil(num)
			}
			else{
				return Math.floor(num)
			}
		}
	};
	let times = [
		{name: "year",short: "y",value: 60*60*24*365},
		{name: "month",short: "m",value: 60*60*24*30},
		{name: "week",short: "w",value: 60*60*24*7},
		{name: "day",short: "d",value: 60*60*24},
		{name: "hour",short: "h",value: 60*60},
		{name: "minute",short: "m",value: 60},
		{name: "second",short: "s",value: 1},
	];
	let timeIndex = 0;
	let significantValue = 0;
	let reminder = 0;
	do{
		significantValue = diff/times[timeIndex].value;
		reminder = (diff - Math.floor(significantValue) * times[timeIndex].value)/times[timeIndex + 1].value;
		timeIndex++;
	}while(!Math.floor(significantValue) && timeIndex < (times.length - 1));
	timeIndex--;
	if(!Math.floor(significantValue)){
		if(type === "short"){
			return magRound(diff) + "s"
		};
		if(magRound(diff) === 1){
			return magRound(diff) + " second"
		};
		return magRound(diff) + " seconds";
	}
	if(Math.floor(significantValue) > 1){
		if(type === "short"){
			return magRound(significantValue) + times[timeIndex].short
		};
		return magRound(significantValue) + " " + times[timeIndex].name + "s";
	}
	if(magRound(reminder) > 1){
		if(type === "short"){
			return "1" + times[timeIndex].short + " " + magRound(reminder) + times[timeIndex + 1].short	
		}
		return "1 " + times[timeIndex].name + " " + magRound(reminder) + " " + times[timeIndex + 1].name + "s";
	}
	if(magRound(reminder) === 1){
		if(type === "short"){
			return "1" + times[timeIndex].short + " 1" + times[timeIndex + 1].short	
		}
		return "1 " + times[timeIndex].name + " 1 " + times[timeIndex + 1].name;
	}
	if(type === "short"){
		return "1" + times[timeIndex].short
	}
	return "1 " + times[timeIndex].name;
}

function nativeTimeElement(timestamp){
	let dateObj = new Date(timestamp*1000);
	let elem = create("time");
	elem.setAttribute("datetime",dateObj);
	elem.title = dateObj.toLocaleDateString() + ", " + dateObj.toLocaleTimeString();
	let calculateTime = function(){
		let now = new Date();
		let diff = Math.round(now.valueOf()/1000) - Math.round(dateObj.valueOf()/1000);
		if(diff === 0){
			elem.innerText = "Just now";
		}
		if(diff === 1){
			elem.innerText = "1 second ago";
		}
		else if(diff < 60){
			elem.innerText = diff + " seconds ago";
		}
		else{
			diff = Math.floor(diff/60);
			if(diff === 1){
				elem.innerText = "1 minute ago";
			}
			else if(diff < 60){
				elem.innerText = diff + " minutes ago";
			}
			else{
				diff = Math.floor(diff/60);
				if(diff === 1){
					elem.innerText = "1 hour ago";
				}
				else if(diff < 24){
					elem.innerText = diff + " hours ago";
				}
				else{
					diff = Math.floor(diff/24);
					if(diff === 1){
						elem.innerText = "1 day ago";
					}
					else if(diff < 7){
						elem.innerText = diff + " days ago";
					}
					else if(diff === 7){
						elem.innerText = "1 week ago";
					}
					else if(diff < 30){
						elem.innerText = Math.floor(diff/7) + " weeks ago";
					}
					else if(diff < 365){
						if(Math.floor(diff/30) === 1){
							elem.innerText = "1 month ago";
						}
						else{
							elem.innerText = Math.floor(diff/30) + " months ago";
						}
					}
					else{
						diff = Math.floor(diff/365);
						if(diff === 1){
							elem.innerText = "1 year ago";
						}
						else{
							elem.innerText = diff + " years ago";
						}
					}
				}
			}
		};
		setTimeout(function(){
			if(!document.body.contains(elem)){
				return
			}
			calculateTime()
		},60*1000)
	};calculateTime();
	return elem;
}

let wilson = function(positiveScore,total){
	if(total === 0){
		return {
			left: 0,
			right: 0
		}
	}
	// phat is the proportion of successes
	// in a Bernoulli trial process
	let phat = positiveScore / total;
	// z is 1-alpha/2 percentile of a standard
	// normal distribution for error alpha=5%
	const z = 1.96;
	// implement the algorithm https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Wilson_score_interval
	let a = phat + z * z / (2 * total);
	let b = z * Math.sqrt((phat * (1 - phat) + z * z / (4 * total)) / total);
	let c = 1 + z * z / total;
	return {
		left: (a - b) / c,
		right: Math.min(1,(a + b) / c)
	};
};

if(!String.prototype.includes){//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
	String.prototype.includes = function(search,start){
		'use strict';
		if(search instanceof RegExp){
			throw TypeError('first argument must not be a RegExp');
		} 
		if(start === undefined){
			start = 0
		}
		return this.indexOf(search,start) !== -1;
	}
}

Number.prototype.roundPlaces = function(places){
	return +(
		Math.round(
			this * Math.pow(10,places)
		) / Math.pow(10,places)
	)
}

function capitalize(string){
	return (string + "").charAt(0).toUpperCase() + (string + "").slice(1)
}

function csvEscape(string){
	return "\"" + (string || "").replace(/"/g,"\"\"") + "\""
}

function entityUnescape(string){
	return string.replace(/&amp;/g,"&")
		.replace(/&lt;/g,"<")
		.replace(/&gt;/g,">")
		.replace(/&quot;/g,"\"")
		.replace(/&#039;/g,"'")
		.replace(/<br\s?\/?>\n?/g,"\n")
		.replace(/&nbsp;/g," ")//not a nbsp, but close enough in most cases. Better than the raw entity at least
}

function hashCode(string){//non-cryptographic hash
	var hash = 0, i, chr;
	if(string.length === 0){
		return hash
	}
	for(i = 0; i < string.length; i++) {
		chr   = string.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash
}

setInterval(function(){
	document.querySelectorAll(`a[rel="noopener noreferrer"]`).forEach(link => {
		let linker = (new URL(link.href)).host;
		if(linker && linker.split(".").length >= 2){
			linker = linker.split(".")[linker.split(".").length - 2];
			if(
				m4_include(data/badDomains.json).includes(hashCode(linker))
			){
				link.href = "https://anilist.co/forum/thread/14";
				link.innerText = "THIS BE BAD LINK, IT'S NOW VEWY DISPOSED OF OwO (click the report button to call the mods on this naughty user)";
			}
		}
	})
	document.querySelectorAll(".sense-wrap").forEach(link => {
		link.remove()
	})
},2000);

const svgns = "http://www.w3.org/2000/svg";
const svgShape = function(shape,target,attributes,children){
	shape = shape || "g";
	let obj = document.createElementNS(svgns,shape);
	Object.keys(attributes || {}).forEach(key => {
		obj.setAttributeNS(null,key,attributes[key])
	});
	if(target){
		target.appendChild(obj)
	}
	(children || []).forEach(
		child => {
			if(child.element){
				svgShape(child.element,obj,child.attributes,child.children)
			}
			else{
				obj.appendChild(child)
			}
		}
	)
	return obj
}
const VALUE = ((a,b) => a - b);//Used for sorting functions
const VALUE_DESC = ((b,a) => a - b);
const TRUTHY = (a => a);//filtering
const ACCUMULATE = (a,b) => (a || 0) + (b || 0);
const ALPHABETICAL = function(valueFunction){
	if(valueFunction){
		return (a,b) => ("" + valueFunction(a)).localeCompare("" + valueFunction(b))
	}
	return (a,b) => ("" + a).localeCompare("" + b)
}
const NOW = () => (new Date()).valueOf();

const Stats = {
	average: function(list){
		return list.reduce((a,b) => (a || 0) + (b || 0))/list.length
	},
	median: function(list){
		let temp = [...list].sort((a,b) => a - b);
		return (
			temp[Math.floor((temp.length - 1)/2)]
			+ temp[Math.ceil((temp.length - 1)/2)]
		)/2;
	},
	mode: function(list){
		return [...list].sort(
			(b,a) => list.filter(
				e => e === a
			).length - list.filter(
				e => e === b
			).length
		)[0];
	}
}

const evalBackslash = function(text){
	let output = "";
	let special = false;
	Array.from(text).forEach(char => {
		if(char === "\\"){
			if(special){
				output += "\\"
			}
			special = !special;
		}
		else{
			output += char;
		}
	});
	return output
}

//this function is for removing duplicates in a sorted list.
//the twist is that it also provides a way to merge the duplicates with a custom function
const removeGroupedDuplicates = function(
	list,
	uniquenessFunction,
	modificationFunction
){//both functions optional
	if(!uniquenessFunction){
		uniquenessFunction = e => e;
	};
	list = list.sort(
		(a,b) => uniquenessFunction(a) - uniquenessFunction(b)
	);
	let returnList = [];
	list.forEach((element,index) => {
		if(index === list.length - 1){
			returnList.push(element);
			return;
		}
		if(uniquenessFunction(element) === uniquenessFunction(list[index + 1])){
			if(modificationFunction){
				modificationFunction(element,list[index + 1]);
			}
		}
		else{
			returnList.push(element);
		}
	});
	return returnList
};

//for the school/workplace methods
let badWords = ["hentai","loli","nsfw","ecchi","sex","gore","porn","violence","lewd","fuck","waifu"];//woooo so bad.
const badTags = ["gore","nudity","ahegao","irrumatio","sex toys","ashikoki","defloration","paizuri","tekoki","nakadashi","large breasts","facial","futanari","public sex","flat chest","voyeur","fellatio","incest","threesome","anal sex","bondage","cunnilingus","harem","masturbation","slavery","gyaru","rape"];
badWords = badWords.concat(badTags);

function create(type,classes,text,appendLocation,cssText){
	let element = document.createElement(type);
	if(Array.isArray(classes)){
		element.classList.add(...classes);
		if(classes.includes("newTab")){
			element.setAttribute("target","_blank")
		}
	}
	else if(classes){
		if(classes[0] === "#"){
			element.id = classes.substring(1)
		}
		else{
			element.classList.add(classes);
			if(classes === "newTab"){
				element.setAttribute("target","_blank")
			}
		}
	};
	if(text || text === 0){
		element.innerText = text;
	};
	if(appendLocation && appendLocation.appendChild){
		appendLocation.appendChild(element)
	};
	if(cssText){
		element.style.cssText = cssText
	};
	return element;
};

function createCheckbox(target,id,checked){//target[,id]
	let hohCheckbox = create("label",["hohCheckbox","el-checkbox__input"],false,target);		
	let checkbox = create("input",false,false,hohCheckbox);
	if(id){
		checkbox.id = id
	}
	checkbox.type = "checkbox";
	checkbox.checked = !!checked;
	create("span","el-checkbox__inner",false,hohCheckbox);
	return checkbox;
}

m4_include(utilities/displayBox.js)

function removeChildren(node){
	if(node){
		while(node.childElementCount){
			node.lastChild.remove()
		}
	}
}

const svgAssets = {
	envelope : "✉",
	cross : "✕",
	like : "♥"
};

const svgAssets2 = {};
m4_include(data/inlineSVG.json).forEach(inlineSVG => {
	svgAssets2[inlineSVG.name] = svgShape(inlineSVG.shape.element,false,inlineSVG.shape.attributes,inlineSVG.shape.children)
})

const distributionColours = {
	"COMPLETED" : "rgb(104, 214,  57)",
	"CURRENT"   : "rgb(  2, 169, 255)",
	"PAUSED"    : "rgb(247, 121, 164)",
	"DROPPED"   : "rgb(232,  93, 117)",
	"PLANNING"  : "rgb(247, 154,  99)",
	"REPEATING" : "violet"
};

const distributionFormats = {
	"TV" : "TV",
	"TV_SHORT" : "TV Short",
	"MOVIE" : "Movie",
	"SPECIAL" : "Special",
	"OVA" : "OVA",
	"ONA" : "ONA",
	"MUSIC" : "Music",
	"MANGA" : "Manga",
	"NOVEL" : "Light Novel",
	"ONE_SHOT" : "One Shot"
};

const distributionStatus = {
	"FINISHED" : "Finished",
	"RELEASING" : "Releasing",
	"NOT_YET_RELEASED" : "Not Yet Released",
	"CANCELLED" : "Cancelled"
};

const categoryColours = new Map([
	[1,"rgb(0, 170, 255)"],
	[2,"rgb(76, 175, 80)"],
	[3,"rgb(75, 179, 185)"],
	[4,"rgb(75, 179, 185)"],
	[5,"rgb(103, 58, 183)"],
	[7,"rgb(78, 163, 230)"],
	[8,"rgb(0, 150, 136)"],
	[9,"rgb(96, 125, 139)"],
	[10,"rgb(36, 36, 169)"],
	[11,"rgb(251, 71, 30)"],
	[12,"rgb(239, 48, 81)"],
	[13,"rgb(233, 30, 99)"],
	[15,"rgb(184, 90, 199)"],
	[16,"rgb(255, 152, 0)"],
	[17,"rgb(121, 85, 72)"],
	[18,"rgb(43, 76, 105)"]
]);

if(useScripts.mangaBrowse){
	let navLinks = document.querySelector(`#nav .links .link[href="/search/anime"]`);
	if(navLinks){
		navLinks.href = "/search/manga";
		/*must remove the existing evenlistener for clicks.
		the reason for this is that it fires before the link, making the href useless
		this unfortunately turns it into a regular link, which reloads the page, so it's slower than the default behaviour.
		but since user interactions is even slower, this still saves time for those who only are interested in manga
		*/
		let mangaBrowseLink = navLinks.cloneNode(true);//copying and pasting the node should remove all event references to it
		navLinks.parentNode.replaceChild(mangaBrowseLink,navLinks);
	};
};

m4_include(utilities/colourPicker.js)

function scoreFormatter(score,format){
	let scoreElement = create("span");
	if(format === "POINT_100"){
		scoreElement.innerText = score + "/100"
	}
	else if(
		format === "POINT_10_DECIMAL"
		|| format === "POINT_10"
	){
		scoreElement.innerText = score + "/10"
	}
	else if(format === "POINT_3"){
		if(score === 3){
			scoreElement.appendChild(svgAssets2.smile.cloneNode(true));
		}
		else if(score === 2){
			scoreElement.appendChild(svgAssets2.meh.cloneNode(true));
		}
		else if(score === 1){
			scoreElement.appendChild(svgAssets2.frown.cloneNode(true));
		}
	}
	else if(format === "POINT_5"){
		scoreElement.innerText = score;
		scoreElement.appendChild(svgAssets2.star.cloneNode(true));
	}
	else{//future types. Just gambling that they look okay in plain text
		scoreElement.innerText = score
	}
	return scoreElement;
}

function convertScore(score,format){
	if(format === "POINT_100"){
		return score
	}
	else if(
		format === "POINT_10_DECIMAL" ||
		format === "POINT_10"
	){
		return score*10
	}
	else if(format === "POINT_3"){
		if(score === 3){
			return 85
		}
		else if(score === 2){
			return 60
		}
		else if(score === 1){
			return 45
		}
		return 0
	}
	else if(format === "POINT_5"){
		if(score === 0){
			return 0
		};
		return score*20 - 10
	}
}

m4_include(utilities/saveAs.js)

m4_include(utilities/levDist.js)

function returnList(list,skipProcessing){
	if(!list){
		return null
	};
	let retl = [];
	list.data.MediaListCollection.lists.forEach(mediaList => {
		mediaList.entries.forEach(entry => {
			if(!skipProcessing){
				entry.isCustomList = mediaList.isCustomList;
				if(entry.isCustomList){
					entry.listLocations = [mediaList.name]
				}
				else{
					entry.listLocations = []
				};
				entry.scoreRaw = Math.min(entry.scoreRaw,100);
				if(!entry.media.episodes && entry.media.nextAiringEpisode){
					entry.media.episodes = entry.media.nextAiringEpisode.episode - 1
				}
				if(entry.notes){
					entry.listJSON = parseListJSON(entry.notes)
				};
				if(entry.media.a){
					entry.media.staff = removeGroupedDuplicates(
						entry.media.a.nodes.concat(
							entry.media.b.nodes
						),
						e => e.id
					);
					delete entry.media.a;
					delete entry.media.b;
				}
				if(entry.repeat > 10000){//counting eps as repeat, 10x One Piece as the plausibility baseline
					entry.repeat = 0
				}
				if(entry.status === "REPEATING" && entry.repeat === 0){
					entry.repeat = 1
				}
			};
			retl.push(entry);
		})
	})
	return removeGroupedDuplicates(
		retl,
		e => e.mediaId,
		(oldElement,newElement) => {
			if(!skipProcessing){
				newElement.listLocations = newElement.listLocations.concat(oldElement.listLocations);
				newElement.isCustomList = oldElement.isCustomList || newElement.isCustomList;
			}
		}
	)
};

m4_include(utilities/parseListJSON.js)

function formatCompat(compatData,targetLocation){
	let differenceSpan = create("span",false,compatData.difference.roundPlaces(3));
	if(compatData.difference < 0.9){
		differenceSpan.style.color = "green"
	}
	else if(compatData.difference > 1.1){
		differenceSpan.style.color = "red"
	};
	targetLocation.innerText = "";
	targetLocation.appendChild(differenceSpan);
	let countSpan = create("span",false," based on " + compatData.shared + " shared entries. Lower is better. 0.8 - 1.1 is common",targetLocation);
	let canvas = create("canvas",false,false,targetLocation,"display:block;");
	canvas.width = 200;
	canvas.height = 100;
	let r1 = Math.sqrt(compatData.list1/(compatData.list1 + compatData.list2));
	let r2 = Math.sqrt(compatData.list2/(compatData.list1 + compatData.list2));
	let distance;
	if(compatData.shared === compatData.list1 || compatData.shared === compatData.list2){
		distance = Math.abs(r1 - r2)
	}
	else if(compatData.shared === 0){
		distance = r1 + r2
	}
	else{
		let areaOfIntersection = function(d,r0,r1){
			let rr0 = r0 * r0;
			let rr1 = r1 * r1;
			let phi = (Math.acos((rr0 + (d * d) - rr1) / (2 * r0 * d))) * 2;
			let theta = (Math.acos((rr1 + (d * d) - rr0) / (2 * r1 * d))) * 2;
			let area1 = (theta * rr1 - rr1 * Math.sin(theta))/2;
			let area2 = (phi * rr0 - rr0 * Math.sin(phi))/2;
			return area1 + area2;
		};
		let overlapArea = Math.PI*compatData.shared/(compatData.list1 + compatData.list2);
		let pivot0 = Math.abs(r1 - r2);
		let pivot1 = r1 + r2;
		while(pivot1 - pivot0 > (r1 + r2)/100){
			distance = (pivot0 + pivot1)/2;
			if(areaOfIntersection(distance,r1,r2) > overlapArea){
				pivot0 = distance
			}
			else{
				pivot1 = distance
			}
		}
	}
	let ctx = canvas.getContext("2d");
	ctx.beginPath();
	ctx.fillStyle = "rgb(61,180,242)";
	ctx.arc(50,50,50*r1,0,2*Math.PI);
	ctx.fill();
	ctx.beginPath();
	ctx.fillStyle = "rgb(250,122,122)";
	ctx.arc(50 + 50*distance,50,50*r2,0,2*Math.PI);
	ctx.fill();
	ctx.beginPath();
	ctx.fillStyle = "rgb(61,180,242,0.5)";
	ctx.arc(50,50,50*r1,0,2*Math.PI);
	ctx.fill();
}

function compatCheck(list,name,type,callback){
	const variables = {
		name: name,
		listType: type
	};
	generalAPIcall(queryMediaListCompat,variables,function(data){
		list.sort((a,b) => a.mediaId - b.mediaId);
		let list2 = returnList(data).filter(element => element.scoreRaw);
		let list3 = [];
		let indeks1 = 0;
		let indeks2 = 0;
		while(indeks1 < list.length && indeks2 < list2.length){
			if(list2[indeks2].mediaId > list[indeks1].mediaId){
				indeks1++;
				continue
			};
			if(list2[indeks2].mediaId < list[indeks1].mediaId){
				indeks2++;
				continue
			};
			if(list2[indeks2].mediaId === list[indeks1].mediaId){
				list3.push({
					mediaId: list[indeks1].mediaId,
					score1: list[indeks1].scoreRaw,
					score2: list2[indeks2].scoreRaw
				});
				indeks1++;
				indeks2++
			}
		};
		let average1 = 0;
		let average2 = 0;
		list3.forEach(item => {
			average1 += item.score1;
			average2 += item.score2;
			item.sdiff = item.score1 - item.score2
		});
		average1 = average1/list3.length;
		average2 = average2/list3.length;
		let standev1 = 0;
		let standev2 = 0;
		list3.forEach(item => {
			standev1 += Math.pow(item.score1 - average1,2);
			standev2 += Math.pow(item.score2 - average2,2)
		});
		standev1 = Math.sqrt(standev1/(list3.length - 1));
		standev2 = Math.sqrt(standev2/(list3.length - 1));
		let difference = 0;
		list3.forEach(item => {
			difference += Math.abs(
				(item.score1 - average1)/standev1
				- (item.score2 - average2)/standev2
			)
		});
		difference = difference/list3.length;
		callback({
			difference: difference,
			shared: list3.length,
			list1: list.length,
			list2: list2.length,
			user: name
		})
	})
}

m4_include(data/commonUnfinishedManga.js)

function uniqueBy(a,key){
	let seen = new Set();
	return a.filter(item => {
		let k = key(item);
		return seen.has(k) ? false : seen.add(k)
	})
}

let urlChangedDependence = false;//???
