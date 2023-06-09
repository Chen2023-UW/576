//lab assignment 1 begins
//define global variables which accessiable from every functions
var map;
var dataStats = {};
var names = {
    1: "Frozen Fish",
    2: "Fresh Fish",
    3: "Fish Fillet",
    4: "Machinery and Mechanical Appliances",
    5: "Electrical Machinery and Electrics",
    6: "Machines",
    7: "Organic Chemicals",
    8: "Chemicals",
    9: "Metal",
    10: "Textiles"
};


layername = {"export" : "export.geojson", "import" : "import.geojson"}

  
function createMap() {
  //create the map
  map = L.map("map", {
    center: [30, 0],
    zoom: 2.4,
  });

  //add OSM base tilelayer
  //cited from leafelt provider demo, thanks to provider cartoDB
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

  //call getData function
  getData(map);
}

function calcStats(data) {
  //create empty array to store all data values
  var allValues = [];
  //loop through each country
  for (var Country of data.features) {
    //loop through each year
    for (var year = 1; year <= 10; year += 1) {
      //get immigrant value for current year
      var value = Country.properties["val_" + year];
      //add value to array
      allValues.push(value);
    }
  }

  //get min, max, mean stats for our array
  dataStats.min = Math.min(...allValues);
  dataStats.max = Math.max(...allValues);
  //calculate meanValue
  var sum = allValues.reduce(function (a, b) {
    return a + b;
  });
  dataStats.mean = sum / allValues.length;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
  //constant factor adjusts symbol sizes evenly
  var minRadius = 4;
  //Flannery Apperance Compensation formula
  var radius = 1.00 * Math.pow(attValue / dataStats.min, 0.2) * minRadius;
  return radius;
}

//function to convert markers to circle markers and add popups
function pointToLayer(feature, latlng, attributes) {
  //Determine which attribute to visualize with proportional symbols
  var attribute = attributes[0];

  //create marker options
  var options = {
    fillColor: "#D1A841",
    color: "#000",
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.6,
  };
  //For each feature, determine its value for the selected attribute
  var attValue = Number(feature.properties[attribute]);
  //Give each feature's circle marker a radius based on its attribute value
  options.radius = calcPropRadius(attValue);
  //create circle marker layer
  var layer = L.circleMarker(latlng, options);
  //build popup content string start with country name
  var popupContent = "<p><b>Country Name:</b> " + feature.properties.Country + "</p>";
  //add formatted attribute to popup content string
  var year = attribute.split("_")[1];

  popupContent +=
    "<p> <b> Trade value with the US of " +
    names[year] +
    ":</b> " +
    feature.properties[attribute] +
    "million $</p>";
  //bind the popup to the circle marker
  layer.bindPopup(popupContent, {
    offset: new L.Point(0, -options.radius),
  });
  //return the circle marker to the L.geoJson pointToLayer option
  return layer;
}

function createPropSymbols(data, attributes) {
  //create a Leaflet GeoJSON layer and add it to the map
  L.geoJson(data, {
    pointToLayer: function (feature, latlng) {
      return pointToLayer(feature, latlng, attributes);
    },
  }).addTo(map);
}

function getCircleValues(attribute) {
  //set the data range to infinite for following calcuation
  var min = 99999,
    max = -99999;

  map.eachLayer(function (layer) {
    //get the attribute value
    if (layer.feature) {
      var attributeValue = Number(layer.feature.properties[attribute]);

      //test for min
      if (attributeValue < min) {
        min = attributeValue;
      }

      //test for max
      if (attributeValue > max) {
        max = attributeValue;
      }
    }
  });
  //set mean
  var mean = (max + min) / 2;
  //return values as an object
  return {
    max: max,
    mean: mean,
    min: min,
  };
}

function updateLegend(attribute) {
  //create content for legend
  var year = attribute.split("_")[1];

  //replace legend content
  document.querySelector("span.year").innerHTML = year;

  //get the max, mean, and min values as an object
  var circleValues = getCircleValues(attribute);

  for (var key in circleValues) {
    //get the radius
    var radius = calcPropRadius(circleValues[key]);

    document.querySelector("#" + key).setAttribute("cy", 60 - radius);
    document.querySelector("#" + key).setAttribute("r", radius)
    document.querySelector("#" + key + "-text").textContent = circleValues[key];

  }
}

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute) {
  map.eachLayer(function (layer) {
    if (layer.feature && layer.feature.properties[attribute]) {
      //access feature properties
      var props = layer.feature.properties;

      //update each feature's radius based on new attribute values
      var radius = calcPropRadius(props[attribute]);
      layer.setRadius(radius);

      //add city to popup content string
      var popupContent = "<p><b>Country Name:</b> " + props.Country + "</p>";

      //add formatted attribute to panel content string
      var year = attribute.split("_")[1];

      popupContent +=
        "<p><b>Trade Value with the US of " +
        names[year] +
        ":</b> " +
        props[attribute] +
        "million $.</p>";

      //update popup with new content
      popup = layer.getPopup();
      popup.setContent(popupContent).update();
    }
  });
  updateLegend(attribute);
}

function processData(data) {
  //empty array to hold attributes
  var attributes = [];

  //properties of the first feature in the dataset
  var properties = data.features[0].properties;

  //push each attribute name into attributes array
  for (var attribute in properties) {
    //only take attributes with population values
    if (attribute.indexOf("val") > -1) {
      attributes.push(attribute);
    }
  }
  return attributes;
}

//Create new sequence controls
function createSequenceControls(attributes){       
  var SequenceControl = L.Control.extend({
      options: {
          position: 'bottomleft'
      },

      onAdd: function () {
          // create the control container div with a particular class name
          var container = L.DomUtil.create('div', 'sequence-control-container');
          //create range input element (slider)
          container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')
          //add skip buttons
          container.insertAdjacentHTML('beforeend', '<button class="step" id="backward" title="Backward"><img src="img/backward.png"></button>'); 
          container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/forward.png"></button>'); 
          //disable any mouse event listeners for the container
          L.DomEvent.disableClickPropagation(container);
          return container;

      }
  });

  map.addControl(new SequenceControl());

  //set slider attributes
  document.querySelector(".range-slider").max = 9;
  document.querySelector(".range-slider").min = 0;
  document.querySelector(".range-slider").value = 0;
  document.querySelector(".range-slider").step = 1;

  var steps = document.querySelectorAll('.step');
  steps.forEach(function(step){
      step.addEventListener("click", function(){
          var index = document.querySelector('.range-slider').value;
          //Step 6: increment or decrement depending on button clicked
          if (step.id == 'forward'){
              index++;
              //Step 7: if past the last attribute, wrap around to first attribute
              index = index > 9 ? 0 : index;
          } else if (step.id == 'backward'){
              index--;
              //Step 7: if past the first attribute, wrap around to last attribute
              index = index < 0 ? 9 : index;
          };
          //Step 8: update slider
          document.querySelector('.range-slider').value = index;
          //Step 9: pass new attribute to update symbols
          updatePropSymbols(attributes[index]);
      })
  })
  //Step 5: input listener for slider
  document.querySelector('.range-slider').addEventListener('input', function(){
      //Step 6: get the new index value
      var index = this.value;

      //Step 9: pass new attribute to update symbols
      updatePropSymbols(attributes[index]);
  });

};

function createLegend(attributes) {
  var LegendControl = L.Control.extend({
    options: {
      position: "bottomright",
    },
    onAdd: function () {
      // create the control container with a particular class name
      var container = L.DomUtil.create("div", "legend-control-container");
      container.innerHTML = '<p class="temporalLegend">Trade value with the US: <span class="year">1</span></p>';
      //Step 1: start attribute legend svg string
      var svg = '<svg id="attribute-legend" width="200px" height="300px">';
      //array of circle names to base loop on
      var circles = ["max", "mean", "min"];
      //Step 2: loop to add each circle and text to svg string
      for (var i = 0; i < circles.length; i++) {
        //calculate r and cy
        var radius = calcPropRadius(dataStats[circles[i]]);
        //console.log(radius);
        var cy = 60 - radius;
        //console.log(cy);
        //circle string
        svg +=
          '<circle class="legend-circle" id="' +
          circles[i] +
          '" r="' +
          radius +
          '"cy="' +
          cy +
          '" fill="#ecebe6" fill-opacity="0.6" stroke="#000000" cx="50"/>';
        //evenly space out labels
        var textY = i * 25 + 20;
        //text string
        svg +=
          '<text id="' +
          circles[i] +
          '-text" x="90" y="' +
          textY +
          '">' +
          dataStats[circles[i]]+
          "</text>";
      }
      //close svg string
      svg += "</svg>";
      //add attribute legend svg to container
      container.insertAdjacentHTML('beforeend',svg);
      return container;
    },
  });
  map.addControl(new LegendControl());
}

//add a title
function createtitle(){
  var titletext = L.Control.extend({
    options: {
      position: 'bottomleft'
    },
    onAdd: function(){
      var maptitle = L.DomUtil.create('div', 'titletext')
      maptitle.innerHTML = 'Primary Trade Partners of the United States in 2018';
      return maptitle;
    },
  });

  map.addControl(new titletext());
};

function createtext(){
  var infotext = L.Control.extend({
    options: {
      //position: 'topleft'
    },
    onAdd: function(){
      var producttext = L.DomUtil.create('div', 'infotext')
      producttext.innerHTML = 'Switch Products Here: ';
      return producttext;
    },
  });

  map.addControl(new infotext());
};


function getData(map){
  //load the data
  fetch("data/export.geojson")
      .then(function(response){
          return response.json();
      })
      .then(function(json){
          var attributes = processData(json);
          calcStats(json)
          //call function to create proportional symbols
          createPropSymbols(json, attributes);
          createSequenceControls(attributes);
          //createLegend(attributes);  
          createtitle();
          createtext();
      })  
      .then(function(){
        var attrName = document.getElementsByClassName('switch');
        console.log(attrName)
        for(let i = 0; i < attrName.length; i++){
          attrName[i].addEventListener('click', function (){
            var id = this.getAttribute("id");
            for(const key of Object.keys(layername)){
              if (id === key){
                updateMap(layername[id], id);
                console.log(layername[id]);
              }
            }
          });
        }
      })       
};

function updateMap(file, mapName){
  fetch("data/"+file)
  .then(function(response){
    return response.json();
  })
  .then(function(json){
    var attributes = processData(json); //create an attributes array
    minValue = calcStats(json);
    deleteElement()
    createPropSymbols(json, attributes);
    createSequenceControls(attributes, mapName);
    //createLegend(attributes, mapName);
  })
}

function deleteElement(){
  var sequence = document.getElementsByClassName("sequence-control-container");
  //var legend = document.getElementsByClassName("legend-control-container");
  var symbol = document.getElementsByClassName("leaflet-interactive");
  
  sequence[0].remove();
  //legend[0].remove();

  let size = symbol.length;

  for (let i = 0; i < size; i++){
    symbol[0].remove();
 
  }

};

document.addEventListener('DOMContentLoaded',createMap);

document.addEventListener("DOMContentLoaded", function() {
  const buttons = document.querySelectorAll("button.switch");
  buttons.forEach(function(button) {
    button.addEventListener("click", function() {
      buttons.forEach(function(button) {
        button.classList.remove("clicked");
      });
      this.classList.add("clicked");
      // Add code here to show the corresponding dataset on the map
    });
  });
});
