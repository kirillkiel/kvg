var cbs = document.getElementsByClassName("settingsCb");
var nrs = document.getElementsByClassName("settingsNr");

for(var i = 0; i < cbs.length; i++){
	cbs[i].addEventListener("change", cbOnChange);
	cbs[i].checked = settings.get(cbs[i].getAttribute("setting")) || false;
}

for(var i = 0; i < nrs.length; i++)
	{
		nrs[i].addEventListener("change", nrOnChange);
		nrs[i].value = settings.get(nrs[i].getAttribute("setting")) || "1";
	}



function cbOnChange(e){
	var sender = e.target;
	settings.set(sender.getAttribute("setting"), sender.checked);
	
}

function nrOnChange(e){
	var sender = e.target;
	settings.set(sender.getAttribute("setting"), sender.value);
	
}