var timeInMin = settings.get(settings.convertTime) || false;

//var gsc = "http://kirill.cf/getSiteContent.php?url=";
var gsc = "https://cors-anywhere.herokuapp.com/";
var infoContainer = document.getElementById("infoContainer");
var stopSearchAutocompleteUL = document.getElementById("autocomplete");
var activeStop = null;
var kvg = {
	stopInfoURL: "https://www.kvg-kiel.de/internetservice/services/stopInfo/stop?stop=",
	queryURL: "https://www.kvg-kiel.de/internetservice/services/lookup/autocomplete?query=",
	routeInfoURL: "https://www.kvg-kiel.de/internetservice/services/routeInfo/route",
	passageInfoURLs: {
		arrival: "https://www.kvg-kiel.de//internetservice/services/passageInfo/stopPassages/stop?mode=arrival&stop=",
		departure: "https://www.kvg-kiel.de//internetservice/services/passageInfo/stopPassages/stop?mode=departure&stop="
	},
	get: {
		stopInfo: function(stop){return contentOf(kvg.routeInfoURL+stop.toString());},
	passageInfo: {
		arrival: function(stop){return contentOf(kvg.passageInfoURLs.arrival+stop.toString());},
		departure: function(stop){return contentOf(kvg.passageInfoURLs.departure+stop.toString());}
	},
	routeInfo: function(){return contentOf(kvg.routeInfoURL)}
	}
};


var stops;
$.ajax({
	url: "stops.json",
	//async: false,
	dataType: "json",
	success: function(res){
		//console.log(res);
		stops = res.sort((a,b) => (a.passengerName > b.passengerName) ? 1 : ((b.passengerName > a.passengerName) ? -1 : 0));
		console.log(stops);
		setNetworkStatus.OK();
		init();
	},
	error: function(e){
		alert("Something went wrong");
		init();
		console.log(e);
		if(!navigator.onLine)
				setNetworkStatus.Err();
			else
				infoContainer.innerHTML = e.statusText;
	}
});


var tags = settings.get(settings.tags);
		console.log(tags);

var locstrg = {
	name: "history",
	count: 10,
	get: function(){
		return JSON.parse(localStorage.getItem(this.name)) || [];
	},
	
	add: function(lmnt){
		var curr = this.get();
		if(curr == null)
			curr = [];
		curr = curr.filter((l) => l.stopNr != lmnt.stopNr);
		curr.push(lmnt);
		/*if(curr.length > this.count)
			{
				curr = curr.reverse();
				curr.length = this.count;
				curr = curr.reverse();
			}*/
		return this.set(curr);
	},
	
	set: function(_Obj){
		return localStorage.setItem(this.name, JSON.stringify(_Obj));
	},
	
	clear: function(){
		return localStorage.setItem(this.name, null);
	}
}

function timeScheduleCheck(){
	if(!localStorage.getItem('timeSchedule'))
		return;
	var ts = JSON.parse(localStorage.getItem('timeSchedule'));
	
	var today = new Date();
	var nowInMin = today.getHours() * 60;
	nowInMin += today.getMinutes();
	
	for(var i = 0; i < ts.length; i++)
		if(toMin(ts[i].start) <= nowInMin && toMin(ts[i].end) >= nowInMin)
			return ts[i].stop;
		
}

function toMin(time){
	return (parseInt(time.split(':')[0]) * 60) + parseInt(time.split(':')[1]);
}

function init(){
	var siteurl = new URL(location.href)
	var urlStop = siteurl.searchParams.get("s");
	if(urlStop){
		activeStop = urlStop;
		userlog();
		var state = {
			url: location.pathname,
			title: document.title.innerHTML
		}
		if(typeof(history))
			if(typeof(history.pushState)){
				history.pushState(state, state.title, state.url);
				$("#uiStop").val(stops.filter((a) => a.stopNr == urlStop)[0].passengerName);
				return;
			}
	}


	var result = timeScheduleCheck();
	if(result && settings.get('timeSchedule')){
			activeStop = result;
			document.getElementById('uiStop').value = stops.filter((a) => a.stopNr == result)[0].passengerName;
			userlog();
		return;
		}
	if(!settings.get(settings.returnToLast)){
		userlog();
		return;
	}
	var hist = locstrg.get();
	if(hist)
		if(hist.length > 0){
			activeStop = hist.reverse()[0].stopNr || -1;
			userlog();
			document.getElementById('uiStop').value = hist[0].passengerName;
		}
	loadInfo();
}
//init();

function contentOf(_url){
//	return $.getJSON(gsc + encodeURIComponent(_url));
	
	return $.ajax({
		url: gsc + /*encodeURIComponent(_url)*/ _url,
		dataType: "json",
		async: false,
		success: function(res){c = res; setNetworkStatus.OK(); return res;},
		error: function(e){console.log(e); 
			if(!navigator.onLine)
				setNetworkStatus.Err();
			//else
			//	infoContainer.innerHTML = infoContainer.innerHTML = e.statusText;
						  }
	}).responseJSON;
	//console.log(c, _url);
//	console.log(c.responseText);
//	return c;
}

//Get stops----------------------------------------------------------


//ui

document.getElementById("autocomplete").onclick = acUlClick;
document.getElementById("autocomplete").onTouchEnd = acUlClick;

document.getElementById("uiStop").addEventListener("input", onUiInput);
document.getElementById("uiStop").addEventListener("focus", onUiInput);

function onUiInput(){
	var val = document.getElementById('uiStop').value;
	var stps = filterStops(val);
	var LIs = generateStopLIs(stps);
	stopSearchAutocompleteUL.innerHTML = null;
	for(var i in LIs)
		stopSearchAutocompleteUL.appendChild(LIs[i]);
	
}


var stopRefresh = setInterval(function(){
	//infoContainer.innerHTML = null;
//	console.log("test");
	if(activeStop == null)
		return;
	loadInfo();
}, 1000);

async function loadInfo(){
	$.get({
		url: "php/infoUlBuilder.php",
		timeout: 10000,
		data: {
			stop: activeStop,
			timeInMin: timeInMin,
			tags: JSON.stringify(tags)
		},
		stop: activeStop,
		success: function(res)
		{
			if(this.stop != activeStop)
				return;
//			console.log(res);
            setNetworkStatus.OK();
			if(res == "-1")
				{	
//					console.log("Test");
					infoContainer.innerHTML = "request error";
//					return;
				}
			else
				infoContainer.innerHTML = res;
		},
		error: function(e){
			console.log(e);
			document.getElementById('lastUpdate').classList.add('outdated');
			document.getElementById('infoUL').classList.add('outdated');
			if(!navigator.onLine)
				setNetworkStatus.Err();
			//else
			//	infoContainer.innerHTML = infoContainer.innerHTML = e.statusText;
		}
	});
}

function generateStopLIs(stps){
	var LIs = [];
	var starts = stps[0];
	var contains = stps[1];
	
	for(var i in starts)
		{
			var lmnt = starts[i];
			var li = document.createElement("li");
			li.innerHTML = lmnt.passengerName;
			li.setAttribute("stopNr", lmnt.stopNr);
			li.setAttribute("stopID", lmnt.id);
			li.setAttribute("lmnt", JSON.stringify(lmnt));
			LIs.push(li);
		}
	
	if(contains != null && contains.length > 0)
		{
			if(starts != null && starts.length > 0)
				LIs.push(document.createElement("hr"));
			for(var i in contains)
			{
				var lmnt = contains[i];
				var li = document.createElement("li");
				li.innerHTML = lmnt.passengerName;
				li.setAttribute("stopNr", lmnt.stopNr);
				li.setAttribute("stopID", lmnt.id);
				li.setAttribute("lmnt", JSON.stringify(lmnt));
				LIs.push(li);
			}
		}
	console.log(stps)
//	console.log(LIs);
	return(LIs);
	
}


function filterStops(filter)
{
	"use strict";
	console.log(filter);
	var inp = document.getElementById('uiStop');
	if(filter == "" || (inp.selectionStart == 0 && inp.selectionEnd == inp.value.length))
		return [locstrg.get().reverse().slice(0, locstrg.count), null] || [];
	
//	console.log(filter);
	
	var a = [];
	var b = [];
	var c = [];
	for(var i = 0; i < stops.length; i++)
		if(stops[i].passengerName.toLowerCase().indexOf(filter.toLowerCase()) == 0)
			a.push(stops[i]);
	
	
	for(var i = 0; i < stops.length; i++)
		if(stops[i].passengerName.toLowerCase().indexOf(filter.toLowerCase()) > 0)
			b.push(stops[i]);
	
	c.push(a.filter(function(x){
		return locstrg.get().filter((y) => y.passengerName == x.passengerName).length > 0;
	}).concat(a.filter(function(x){
		return !(locstrg.get().filter((y) => y.passengerName == x.passengerName).length > 0);
	})));
	c.push(b);
	return c;
}

function acUlClick(e){
	$("#uiStop").val(e.target.innerHTML);
	
//	console.log(kvg.get.passageInfo.arrival("1312"));
	activeStop = e.target.getAttribute("stopnr");
	locstrg.add(JSON.parse(e.target.getAttribute("lmnt")));
	loadInfo();
//	alert("test");
	console.log(locstrg.get());
//	infoContainer.innerHTML = generateInfoUl(kvg.get.passageInfo.departure(activeStop)).outerHTML;
	userlog();
}

function share(){
	/*var url_ = new URL(location.href);
	var txt = document.title;
	if(activeStop != null)
		if(confirm("share with stop?")){
			txt += " | Halltestelle: " + stops.filter((a) => a.stopNr == activeStop)[0].passengerName;
			url_.href += "?s=" + activeStop;
		}
	if(navigator.share){
		
		navigator.share(
			{
				title: document.title,
				url: url_.href,
				text: txt
			}
		);
	}
	else {
		if(confirm("\"share\" is not supported by this browser.\nCopy link to clipboard?"))
			{
				var inp = document.createElement("input");
				inp.value = url_.href;
				document.body.appendChild(inp);
				inp.select()
				document.execCommand("copy");
				document.body.removeChild(inp);
				alert("copied");

			}
	}*/
	
	
	var notcon = document.getElementById('notificationContainer');
	$(notcon).load('sharepopup.html');
	notcon.style.display = "block";
	
}


function viewDataSource(){
	var notcon = document.getElementById('notificationContainer');
	$(notcon).load('dataSourceInfo.html');
	notcon.style.display = "block";
	
}
