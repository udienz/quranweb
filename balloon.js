function createRequestObject() {
    var ro;
    var browser = navigator.appName;
    if(browser == "Microsoft Internet Explorer"){
        ro = new ActiveXObject("Microsoft.XMLHTTP");
    }else{
        ro = new XMLHttpRequest();
    }
    return ro;
}

var http = createRequestObject();

/*
preview image of specified theme
*/
function showBalloon(bid) {
        //var themeId = document.getElementById("cboTheme").value;

    http.open("get", "balloon.php?bid="+bid+"&ceker=nci");
    var supid = "sup"+bid;
    //http.onreadystatechange = handleResponse(bid);
    //http.onreadystatechange = handleResponse;
    http.onreadystatechange = function handle(bid) {
    if(http.readyState == 4){
        var response = http.responseText;
        document.getElementById(supid).title = response;
    }
        
    };
    http.send(null);
}

/*
set theme image preview, to the choosen one (halah.. :)
*/
function handleResponse() {
	//var supid = 'sup' + id;
    if(http.readyState == 4){
        var response = http.responseText;
        document.getElementById('sup2').title = response;
    }
}



/* we only need the scrip above, ignore everything below this line*/









/*
MMS related scripts.....   get list of photos from selected album
*/
function getPhotos() {
var albumId = document.getElementById("cboAlbum").value;

http.open("get", "index.php?fuseaction=personal.photos&albumid="+trim(albumId)+"&action=send");
http.onreadystatechange = handleResponseAlbum;
http.send(null);
}

/*
populate image select combo box  (add <options> to select component)
*/
function handleResponseAlbum() {
    if(http.readyState == 4){

var elSel = document.getElementById("cboImage");
  var i;
  for (i = elSel.length - 1; i>0; i--) {
      elSel.remove(i);
  }
        var response = trim(http.responseText);
  	//document.getElementById("cboImage").innerHTML=response;
	var update = new Array();
	if(response.indexOf("|" != -1)) {
		update = response.split("|");
	for (var a=0; a<update.length; a++) {
		option = document.createElement("OPTION");
		option.value =trim(update[a]);
		option.text = trim(update[++a]);
            document.getElementById("cboImage").add(option,null);  //shouldn't use add here
	}
	}

     }
}

/*
get the photo selectd from album
*/
function previewPhoto() {
var imageId = document.getElementById("cboImage").value;

http.open("get", "index.php?fuseaction=personal.preview&imageid="+imageId+"&action=send");
http.onreadystatechange = handleResponseImage;
http.send(null);
}

/*
display selected photo as a preview
photoPath is a hidden field so we can assign the value to php var
*/
function handleResponseImage() {
	var path = document.getElementById("path").value;
	var albumId = document.getElementById("cboAlbum").value;
    
if(http.readyState == 4){
        var response = trim(http.responseText);
	var yy = response.substring(0,2);
	var mm = response.substring(2,4);
	var dd = response.substring(4,6);
	var dir = yy+"/"+mm+"/"+dd+"/";
	
        document.getElementById("fotoUser").src = "content/"+path+"/image/std/"+dir+response+".jpg";
        document.getElementById("photoPath").value = "content/"+path+"/image/std/"+dir+response+".jpg";
    }
}
function trim(input)
{
	var str="";
	str = input.replace(/^\s*|\s*$/g,"");
	return str;
}
