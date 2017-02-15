//Make Backgrounddata available
var background = chrome.extension.getBackgroundPage();
var data = background.data;

//Datenbank für Browserhistory uvm.
var dbName = "StudyTimeDB";
var storeName = "BrowserHistory";
var db;
var req = indexedDB.open(dbName, 10);
req.onsuccess = function (evt) {
    db = req.result;
showStatistics();
};
req.onerror = function (evt) {
    alert(evt.target.errorCode);
};
req.onupgradeneeded = function (evt) {
    var db = evt.target.result;
    if (db.objectStoreNames.contains(storeName)) {
      db.deleteObjectStore(storeName);
    }
    var store = db.createObjectStore(
        storeName, { keyPath: "date", autoIncrement: true });
};


//Menüclickevents und Seitenwechsel
$(".menu > div").click(function(){
    var id = $(this).attr("id");
    $(".tab").hide();
    $("#"+id+"-tab").show();
	$(".menu > div").removeClass("active");
	$(this).addClass("active");
});
//Auswahl der richtigen Startseite bei Hash in URL
if(location.hash != ""){
    $(".tab").hide();
    $("#"+location.hash.replace("#","")+"-tab").show();
	$("#"+location.hash.replace("#","")).addClass("active");
} else{
	$("#settings-tab").show();
	$("#settings").addClass("active");
}


showBlacklist();
showWhitelist();
showTimerOptions();
/*
setInterval(function(){
    showStatistics();
},30000);
*/
function showTimerOptions(){
    $(".timer-options").html("");
    data.timelines.forEach(function(elm,index){
        var active = "";
        if(JSON.stringify(elm) == JSON.stringify(data.workTimeline)){
            active = "timerElementActive";
        }
        var element = "<div name='"+index+"' class='timerElement "+active+"'><h3>"+elm.name+"<i  class='fa fa-times timerElementDelete' aria-hidden='true'></i></h3>";
        element += "<div><span>";
        element += elm.timeline.join("</span><i class='fa fa-angle-double-right' aria-hidden='true'></i><span>");
        element += "</span></div>";
        element += "<p>"+elm.description+"</p></div>"
        $(".timer-options").append(element);
    });
    $(".timerElement").click(function(){
        var index = $(this).attr("name");
        var changes = {workTimeline:data.timelines[parseInt(index)]};
        updateData(changes);
        updateStorage(changes);
        showTimerOptions();
    });
    $(".timerElementDelete").click(function(e){
        e.stopPropagation();
        var index = $(this).parent().parent().attr("name");
        var newTimelines = data.timelines;
        newTimelines.splice(index,1);
        var changes = {workTimeline:newTimelines};
        updateData(changes);
        updateStorage(changes);
        showTimerOptions();
    });
    generateTimeForm();
}
function generateTimeForm(){
    var element = "<div class='timerElement newTimeOption'>";
    element += "<h3>Eigenes Zeitprofil erstellen</h3>"
    element += "<input placeholder='Name' class='newTimeOptionName'></input><br><div>";
    for(var i=0;i<4;i++){
        element += "<span><input class='newTimeOptionTime' placeholder='--'></input></span>";
        if(i<=2){
            element += "<i class='fa fa-angle-double-right' aria-hidden='true'></i>";
        }
    }
    element += "</div><h4 class='newTimeOptionSave'><i class='fa fa-floppy-o' aria-hidden='true'></i></h4></div>";
    $(".timer-options").append(element);
    $(".newTimeOptionSave").click(function(){
        var timeline = {};
        timeline.name = $(".newTimeOptionName").val();
        if(timeline.name == ""){
            timeline.name = "Neue Zeitprofil";
        }
        timeline.timeline = [];
        $(".newTimeOptionTime").each(function(elm){
            timeline.timeline.push(parsePosIntInput($(this).val()));
        });
        timeline.description = "";
        var newTimelines = data.timelines;
        newTimelines.push(timeline);
        var changes = {timelines:newTimelines,workTimeline:newTimelines};
        updateData(changes);
        updateStorage(changes);
        showTimerOptions();
    });
}
//Blacklist und Whitelist haben identischen Aufbau, bis auf Namen der Klassen
function showBlacklist(){
    $(".blacklist-box").html("");
    for(var i=0;i<data.blacklist.length;i++){
        $(".blacklist-box").append("<div class='col-md-3 col-xs-6 col-lg-2'><div class='blacklist-element'>"+data.blacklist[i]+"<i  class='fa fa-times' aria-hidden='true'></i></div></div>");
    }
    $(".blacklist-element > i").click(function(){
        if(!confirm("Willst du diesen Filtereintrag wirklich loeschen?")){
            return;
        }
        var filtertext = $(this).parent().html();
        var blacklist = data.blacklist.filter(function(val){
            return filtertext.search(val) == -1;
        });
        var changes = {blacklist:blacklist};
        updateStorage(changes);
        updateData(changes);
        showBlacklist();
    });
    $(".blacklist-box").append("<div class='col-md-3 col-xs-6 col-lg-2'><div class=''><input id='blacklist-input' type='text'></input><i class='fa blacklist-add fa-check' aria-hidden='true'></i></div></div>");
    $(".blacklist-add").click(function(){
        var filtertext = $("#blacklist-input").val();
        if(filtertext.length < 3){
            return;
        }
        var blacklist = data.blacklist;
        blacklist.push(filtertext);
        var changes = {blacklist: blacklist};
        updateStorage(changes);
        updateData(changes);
        showBlacklist();
    });
}
function showWhitelist(){
    $(".whitelist-box").html("");
    for(var i=0;i<data.whitelist.length;i++){
        $(".whitelist-box").append("<div class='col-md-3 col-xs-6 col-lg-2'><div class='whitelist-element'>"+data.whitelist[i]+"<i class='fa fa-times' aria-hidden='true'></i></div></div>");
    }
    $(".whitelist-element > i").click(function(){
        if(!confirm("Willst du diesen Filtereintrag wirklich loeschen?")){
            return;
        }
        var filtertext = $(this).parent().html();
        var whitelist = data.whitelist.filter(function(val){
            return filtertext.search(val) == -1;
        });
        var changes = {whitelist:whitelist};
        updateStorage(changes);
        updateData(changes);
        showWhitelist();
    });
    $(".whitelist-box").append("<div class='col-md-3 col-xs-6 col-lg-2'><div class=''><input id='whitelist-input' type='text'></input><i class='fa whitelist-add fa-check' aria-hidden='true'></i></div></div>");
    $(".whitelist-add").click(function(){
        var filtertext = $("#whitelist-input").val();
        if(filtertext.length < 3){
            return;
        }
        var whitelist = data.whitelist;
        whitelist.push(filtertext);
        var changes = {whitelist: whitelist};
        updateStorage(changes);
        updateData(changes);
        showWhitelist();
    });
}
function parsePosIntInput(str){
    if(isNaN(parseInt(str))){
        return 0;
    }
    else if(parseInt(str) < 0){
        return 0;
    }
    else{
        return parseInt(str);
    }
}
function milliSecToTime(val){
    var sec = Math.floor((val)/1000);
    var min = Math.floor(sec/60);
    var hours = Math.floor(min/60);
    var minutes = Math.floor((min)%60);
    //var seconds = Math.floor(((59-sec-60)%60));
    return hours+"h "+minutes+"m";
}
function showStatistics(mode){
    if(mode = "today"){
        var d = new Date();
        d.setHours(0);
        d.setMinutes(0);
        d.setSeconds(0);
        d.setMilliseconds(0);
        var lowerBoundKeyRange = IDBKeyRange.lowerBound(d.getTime());
    }
    
    $(".domain-statistic").html("");
    var transaction = db.transaction("BrowserHistory", "readwrite");
    var store = transaction.objectStore("BrowserHistory");
    var records = [];
    store.openCursor(lowerBoundKeyRange).onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
            records.push(cursor.value);
            cursor.continue();
        }
        else {
            console.log(records);
            //Alle Einträge sind geladen: Auswertung und Darstellung
            var sum = 0;
            records.forEach(function(elem){
                sum += elem.duration;
            });
            records = records.sort(function(a, b){
                return b.duration - a.duration;
            });
            console.log(records);
            var elements = "";
            records.forEach(function(elem){
                if(elem.duration < 60){
                    return;
                }
                var width = 100*elem.duration/sum;
                elements += "<div class='statistic-element'><div style='width:"+width+"%'></div>"+elem.domain+"<span>"+milliSecToTime(elem.duration*1000)+"</span></div>";
            });
            $(".domain-statistic").append(elements);
        }
    };
}

//Main functions
function updateStorage(obj){
    chrome.storage.sync.get(["extension_data"], function(items){
        var data = items.extension_data;
        Object.keys(obj).forEach(function (key) {
           data[key] = obj[key]; 
        });
        chrome.storage.sync.set({'extension_data': data});
    });
}
function updateData(obj){
    Object.keys(obj).forEach(function (key) {
        data[key] = obj[key]; 
    });
}