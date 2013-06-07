function changeHour(projectID, hour, hourIncrement) {
	
	hour = hour.toFixed(2);
	if (hour.slice(-3)==".00") {hour = hour.substring(0, hour.length - 3);}
	else if (hour.slice(-1)=="0") {hour = hour.substring(0, hour.length - 1);}
	var timeStamp = Math.round(new Date().getTime() / 1000); 
	
	chrome.storage.sync.get('project-' + projectID, function(project){	
		project['project-' + projectID].hour = hour;
		if (project['project-' + projectID].history == null){
			var history = [];
			project['project-' + projectID]['history'] = history;
		}
		project['project-' + projectID].history.push({"hourIncrement": hourIncrement, "timeStamp": timeStamp});
		
		chrome.storage.sync.set(project, function(){
			$(".project-wrapper").find("[data-id='" + projectID + "']").find(".hour").html(hour);
			getHourSummary("today");
			getHourSummary("this week");
		});
	});

	writeLog("hourLogging");
}

function changeColor(projectID, color) {
	chrome.storage.sync.get('project-' + projectID, function(project){	
		project['project-' + projectID].color = color;
		chrome.storage.sync.set(project, function(){
			$("#project-container").find("[data-id='" + projectID + "']").find(".project-main-window").css("background-color", color);
		});
	});
}

function updateOrder(){
	var projects = $("#project-container .project-wrapper");
	projects.each(function(){
		
		// apply order data to this project
		$(this).attr("data-order", $(this).index());
		$(this).find("*").attr("data-order", $(this).index());
		
		var order = $(this).attr("data-order");
		var projectID = $(this).attr("data-id");
		
		// write to chrome
		chrome.storage.sync.get('project-' + projectID, function(project){	
			project['project-' + projectID].order = order;
			chrome.storage.sync.set(project, function(){
		
			});
		});
	
	});
	
}

function writeLog(action){
	if (action == "hourLogging"){
		var timeStamp = Math.round(new Date().getTime() / 1000);
		chrome.storage.sync.set({"hourLogging": timeStamp}, function(){
			getLastHourLogging();
		});
	}
}

function getLastHourLogging(){
	chrome.storage.sync.get("hourLogging", function(data){
		if(data.hourLogging){
			$("#last-update-time").attr("data", data.hourLogging);
			$(".last-update").show();
			updateLastHourLogging();
		}
		else{
			$(".last-update").hide();
		}
	});
}

function updateLastHourLogging(){
	var timeAgo = Math.round(new Date().getTime() / 1000) - parseInt($("#last-update-time").attr("data"));
	$("#last-update-time").html(timeAgo.toHumanTime());
}

function getHourSummary(date){

	if (date == "today"){
		var startTime = Math.round(new Date().setHours(0,0,0,0) / 1000);
		var endTime = startTime + 24 * 60 * 60;
		
		chrome.storage.sync.get(null, function(data){
			var dailyTotal = 0;
			jQuery.each(data, function(i, val) {
				if(val.id && val.history){// if project
					jQuery.each(val.history, function(n, log){
						if (log.timeStamp >= startTime && log.timeStamp < endTime){
							dailyTotal = parseInt(dailyTotal) + (log.hourIncrement * 60 * 60);
							console.log(dailyTotal);
						}
					});
				}
			});
			$("#daily-hour-summary").html(dailyTotal.toHumanTime());				
		});
	}
	
	if (date == "this week"){
		
		var monday = Math.round(Date.monday().getTime()/ 1000);
		var sunday = monday + 60*60*24*7;
		
		chrome.storage.sync.get(null, function(data){
			var weeklyTotal = 0;
			jQuery.each(data, function(i, val) {
				if(val.id && val.history){// if project
					jQuery.each(val.history, function(n, log){
						if (log.timeStamp >= monday && log.timeStamp < sunday){
							weeklyTotal = parseInt(weeklyTotal) + (log.hourIncrement * 60 * 60);
							console.log("w" + weeklyTotal);
						}
					});
				}
			});
			$("#weekly-hour-summary").html(weeklyTotal.toHumanTime());				
		});
	}
	
}

Number.prototype.toHumanTime = function () {
    var secNum = parseInt(this, 10); // don't forget the second parm
    var hours   = Math.floor(secNum / 3600);
    var minutes = Math.floor((secNum - (hours * 3600)) / 60);
    var seconds = secNum - (hours * 3600) - (minutes * 60);
	var time;
    if (hours == 0 && minutes != 0){
    	time = minutes+'m ';
    }
    else if (hours != 0 && minutes != 0){
    	time = hours+'h '+minutes+'m ';
    }
    else if (hours != 0 && minutes == 0){
    	time = hours+'h ';
    }
    else if (hours == 0 && minutes == 0){
    	time = seconds +'s';
    }
    return time;
}

function removeProject(projectID){
	chrome.storage.sync.remove("project-"+projectID, function(){
		initiatePage();
	});

}

function createProject(){
	var projectName = $("#new-project-name").val();  // get project name
	var projectID = new Date().getTime();  // use timestamp as unique id
	var project = {};
	var order = $("#project-container .project-wrapper").length + 1;
	var history = []; 
	project['project-'+projectID] = {"id": projectID, "name": projectName, "hour": "0", "color": "#7f8c8d", "order": order, "history": history};
	chrome.storage.sync.set(project, function (){
		console.log("saved");
	});
}

function initiatePage(){
	$("#project-container").html(""); // clear project list view
	var rawHtmlTemplate = $("#hidden-project-template").html();
	chrome.storage.sync.get(null, function(data){
		//data.sort(function (a, b) {return a.order - b.order}); /* sort raw data for correct order - cannot sort since it's an object */
		
		jQuery.each(data, function(i, val) {
			if(val.id){// if project
				$("#hidden-project-template").find("*").attr("data-id", val.id);
				$("#hidden-project-template").find("*").attr("data-order", val.order);
				$("#hidden-project-template").find(".project-title").html(val.name);
				$("#hidden-project-template").find(".hour").html(val.hour);
				$("#hidden-project-template").find(".project-main-window").css("background-color", val.color);
				$("#project-container").append($("#hidden-project-template").html()); // add project item
				$("#hidden-project-template").html(rawHtmlTemplate); // reset template to default
			}
		});
		
		var projects = $("#project-container").children(".project-wrapper");
		
		//sort and reappend cannot use jQuery
		projects.detach().sort(function (a, b) {return a.getAttribute("data-order") - b.getAttribute("data-order")}); 
		$("#project-container").append(projects);
		
		$("#project-container").sortable({
			handle: '.drag-project',
			cursor: 'move',
			activate: function(event, ui) {
				$(document).off("mouseleave", ".project-main-window");
				$(document).off("mouseenter", ".project-main-window"); // diable hover when dragging
			},
			deactivate: function(event, ui) {
				$(document).hoverIntent({
					over: projectHoverEvent,
					out: projectMouseOutEvent,
					selector: ".project-main-window",
					sensitivity: 4,
					interval: 200
    			});
    			updateOrder();
			}
		});
		$("#project-container").disableSelection();
	});
	getLastHourLogging();
	var updateLastHourLoggingInterval = setInterval(updateLastHourLogging, 1000);
	getHourSummary("today");
	getHourSummary("this week");
}

var projectHoverEvent = function(){
	var currentElement = $(this);
	currentElement.parent().parent().find(".project-main-window").removeClass("active").css("opacity", ".5");
	currentElement.addClass("active").css("opacity", "1");
	currentElement.parent().parent().find(".project-edit-window").fadeOut(0);
	setTimeout(function(){currentElement.find(".project-edit-window").fadeIn(150);},150);
}

var projectMouseOutEvent = function(){
	$(this).parent().parent().find(".project-main-window").removeClass("active").css("opacity", "1");
	$(this).parent().parent().find(".project-edit-window").fadeOut(0);
	$(this).find(".color-picker").hide(0);
}

$(document).ready(function(){
	
	initiatePage();
	
	$("#create-project").on("click", function(){
		createProject();
		console.log("create project");
		$("#new-project-name").val("");
		console.log("clear input");
		initiatePage();
		console.log("refresh");
	});
	
	$(document).hoverIntent({
    	over: projectHoverEvent,
    	out: projectMouseOutEvent,
    	selector: ".project-main-window",
    	sensitivity: 4,
    	interval: 200
    });
	
	/*$(document).on("mouseenter", ".project-main-window", function(event){
		var currentElement = $(this);
			currentElement.parent().parent().find(".project-main-window").removeClass("active").css("opacity", ".6");
			currentElement.addClass("active").css("opacity", "1");
			currentElement.parent().parent().find(".project-edit-window").fadeOut(0);
			currentElement.find(".project-edit-window").fadeIn(300);
	});
	
	$(document).on("mouseleave", ".project-main-window", function(event){
		var currentElement = $(this);
			currentElement.parent().parent().find(".project-main-window").removeClass("active").css("opacity", "1");
			currentElement.parent().parent().find(".project-edit-window").fadeOut(0);
	});*/
	
	$(document).on("click", ".add-hour-column a", function(){
		var projectID = $(this).attr("data-id");
		var hourIncrement = parseFloat($(this).html());
		var hour = parseFloat($(this).html()) + parseFloat($(".project-wrapper").find("[data-id='" + projectID + "']").find(".hour").html());
		changeHour(projectID, hour, hourIncrement);
	});
	
	$(document).on("click", ".change-color", function(){
		$(this).find(".color-picker").fadeToggle(200);
	});
	
	$(document).on("click", ".color-item", function(){
		var projectID = $(this).attr("data-id");
		$(this).parent().removeClass("active");
		changeColor(projectID, $(this).css("background-color"));
	});
	
	
	$(document).on("click", ".remove-project", function(){
		var projectID = $(this).attr("data-id");
		removeProject(projectID);
	});
	
	$(document).on("click", ".clear-hour", function(){
		var projectID = $(this).attr("data-id");
		changeHour(projectID, 0);
	});
	
	$("#new-project-name").keypress(function(event){   	
		if(event.keyCode == 13){
			event.preventDefault();
			$("#create-project").click();
    		console.log("detected enter");
    	}
    });
	
});
