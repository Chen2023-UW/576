var map = L.map('map').setView([-3, -60], 2)

//create leafelt map
//function to instantiate the Leaflet map
function createMap(){
    //add OSM base tilelayer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

getData(map);
}

//apply oneachfeature to AJAX data
function onEachFeature(feature, layer) {
    //no property named popupContent; instead, create html string with all properties
    var popupContent = "<p><b>Country Name:</b> " + feature.properties.Country + "</p>";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + " millon $</p>";
        }
        layer.bindPopup(popupContent);
    };
};


// step 2: Import geoJSON data
//function to retrieve the data and place it on the map
function getData(map){
    fetch("data/export.geojson")
		.then(function(response){
			return response.json();
		})
		.then(function(json){
            //createPropSymbols(json);

            //Step 3. Add circle markers for point features to the map
            var geojsonMarkerOptions = {
                radius: 12,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };

            //create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(json, {
                onEachFeature: onEachFeature
                //pointToLayer: function (feature, latlng){
                    //return L.circleMarker(latlng, geojsonMarkerOptions);
                //}
            }).addTo(map);
        })
};

document.addEventListener('DOMContentLoaded',createMap)