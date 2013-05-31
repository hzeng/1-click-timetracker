function changeHour(projectID, hour) {
	var project = {};
	var projectName = $("#project-container").find("[data-id='" + projectID + "']").find(".project-title").html();
	var color = $("#project-container").find("[data-id='" + projectID + "']").find(".project-main-window").css("backgroundColor");
	var order = $("#project-container").find("[data-id='" + projectID + "']").attr("data-order");
	console.log("projectName: " +projectName);
	console.log("projectID: " +projectID);
	console.log("hour: " +hour);
	console.log("color: " +color);
	hour = hour.toFixed(2);
	if (hour.slice(-3)==".00") {hour = hour.substring(0, hour.length - 3);}
	else if (hour.slice(-1)=="0") {hour = hour.substring(0, hour.length - 1);}
	project['project-'+projectID] = {"id": projectID, "name": projectName, "hour": hour, "color": color, "order": order};
	chrome.storage.sync.set(project, function(){
		$(".project-wrapper").find("[data-id='" + projectID + "']").find(".hour").html(hour);
		//initiatePage();
	});
	writeLog("hourLogging");
}

function changeColor(projectID, color) {
	var project = {};
	var projectName = $(".project-wrapper").find("[data-id='" + projectID + "']").find(".project-title").html();
	var hour = $(".project-wrapper").find("[data-id='" + projectID + "']").find(".hour").html();
	var order = $("#project-container").find("[data-id='" + projectID + "']").attr("data-order");
	
	project['project-'+projectID] = {"id": projectID, "name": projectName, "hour": hour, "color": color, "order": order};
	chrome.storage.sync.set(project, function(){
		$("#project-container").find("[data-id='" + projectID + "']").find(".project-main-window").css("background-color", color);
		//initiatePage();
	});
}

function updateOrder(){
	var projects = $("#project-container .project-wrapper");
	projects.each(function(){
		// apply order data to this project
		$(this).attr("data-order", $(this).index());
		$(this).find("*").attr("data-order", $(this).index());
		
		// prepare chrome data write
		var project = {};
		var projectID = $(this).attr("data-id");
		var projectName = $(this).find(".project-title").html();
		var color = $(this).find(".project-main-window").css("backgroundColor");
		var hour = $(this).find(".hour").html();
		var order = $(this).attr("data-order");
		project['project-'+projectID] = {"id": projectID, "name": projectName, "hour": hour, "color": color, "order": order};
		
		chrome.storage.sync.set(project, function(){
			//$("#project-container").find("[data-id='" + projectID + "']").find(".project-main-window").css("background-color", color);
			//initiatePage();
	});

	});
	
}

function writeLog(action, timeStamp){
	if (action == "hourLogging"){
		var timeStamp = Math.round(new Date().getTime() / 1000);
		chrome.storage.sync.set({"hourLogging": timeStamp}, function(){
			getLastHourLogging();
		});
	}
}

function getLastHourLogging(){
	chrome.storage.sync.get("hourLogging", function(data){
		$("#last-update-time").attr("data", data.hourLogging);
		updateLastHourLogging();
	});
}

function updateLastHourLogging(){
	var timeAgo = Math.round(new Date().getTime() / 1000) - parseInt($("#last-update-time").attr("data"));
	$("#last-update-time").html(timeAgo.toHumanTime());
	//console.log("updated hour logging");
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
	var project = {};
	var projectName = $(".project-wrapper").find("[data-id='" + projectID + "']").find(".project-title").html();
	var hour = $(".project-wrapper").find("[data-id='" + projectID + "']").find(".hour").html();
	var color = $("#project-container").find("[data-id='" + projectID + "']").find(".project-main-window").css("backgroundColor");
	var order = $("#project-container").find("[data-id='" + projectID + "']").attr("data-order");
	console.log("projectName: " +projectName);
	console.log("projectID: " +projectID);
	console.log("color: " +color);

	project['project-'+projectID] = {"id": projectID, "name": projectName, "hour": hour, "color": color, "order": order};
	console.log("project: " + project);
	chrome.storage.sync.remove("project-"+projectID, function(){
		initiatePage();
	});

}

function createProject(){
	var projectName = $("#new-project-name").val();  // get project name
	var projectID = new Date().getTime();  // use timestamp as unique id
	var project = {};
	var order = $("#project-container .project-wrapper").length + 1;
	project['project-'+projectID] = {"id": projectID, "name": projectName, "hour": "0", "color": "#7f8c8d", "order": order};
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
		var hour = parseFloat($(this).html()) + parseFloat($(".project-wrapper").find("[data-id='" + projectID + "']").find(".hour").html());
		changeHour(projectID, hour);
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
