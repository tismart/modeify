var config = require('config');
var mapModule = require('map');
var plugins = require('./leaflet_plugins');
var polyUtil = require('./polyline_encoded.js');
var routeboxer = require('./leaflet_routeboxer.js');
var leaflet_label = require('./leaflet_label/leaflet.label-src.js');
var collision = require('./leaflet_layergroup_collision.js');
var session = require('session');

var center = config.geocode().center.split(',').map(parseFloat)
if (config.map_provider && config.map_provider() !== 'AmigoCloud') {
  L.mapbox.accessToken = config.mapbox_access_token();
}


module.exports = function(el) {
  var map, realtime, southWest, northEast, blurLayer;
  localStorage.removeItem('dataplan');
  if (config.map_provider && config.map_provider() === 'AmigoCloud') {
    southWest = L.latLng(35.946877085397,-123.480610897013);
    northEast = L.latLng(40.763279543715,-118.789317362500);
    map = (new L.amigo.map(el, {
      amigoLogo: 'right',
      loadAmigoLayers: false,
      inertia: false,
      zoomAnimation: $('.hide-map').css('display') !== 'none',
      maxBounds: L.latLngBounds(southWest, northEast),
      minZoom: 8
    })).setView([center[1], center[0]], config.geocode().zoom);

    L.amigo.auth.setToken(config.support_data_token());

    blurLayer = L.tileLayer(
    'https://www.amigocloud.com/api/v1/users/'+
	'23/projects/3019/datasets/23835/tiles/{z}/{x}/{y}.png?' +
	'token=' + config.support_data_token(),
      {
        name: 'Uncovered Area'
      }
    );

    map.addAuthLayer({
      id: config.mapbox_map_id(),
      accessToken: config.mapbox_access_token(),
      name: 'Gray',
      provider: 'mapbox'
    });
    map.addBaseLayer(L.amigo.AmigoGray);
    map.layersControl.addBaseLayer(
      L.bingLayer(
        config.bing_key(),
	{
	  type: 'Road',
	  attribution: 'Bing Maps'
	}
      ),
      'Bing Road'
    );
    map.layersControl.addOverlay(blurLayer);
    blurLayer.addTo(map);

    module.exports.activeMap = map;

    map.realtimeControl = L.control.toggleRealTime().addTo(map);

    realtime = mapModule.realtime();


  } else {

    map = L.mapbox.map(el, config.mapbox_map_id(), {
      attributionControl: false,
      inertia: false,
      zoomAnimation: false
    }).setView([center[1], center[0]], config.geocode().zoom);
  }

  return map;
};

module.exports.getMap = function () {
  return this.activeMap;
};


module.exports.cleanRoute = function() {
    module.exports.activeRoute.removeLayer();
    module.exports.activeRoute = null;
};

module.exports.polyline_creadas = [];
module.exports.marker_creadas = [];
module.exports.makerpoint_creadas = [];
module.exports.collision_group = {};
module.exports.marker_collision_group = [];
module.exports.last_marker_collision_group = [];

module.exports.drawMakerCollision = function () {
    var collision_group = L.layerGroup.collision();
    var marker_collision_group = [];
    for(i in this.marker_collision_group) {
        for (j in this.marker_collision_group[i]){
            marker_collision_group.push(this.marker_collision_group[i][j]);
        }
    }
    collision_group.addLayer(marker_collision_group);
    collision_group.onAdd(this.activeMap);
    this.collision_group =  collision_group;

};


module.exports.drawItinerationMakerCollision = function (i) {
    var collision_group = L.layerGroup.collision();
    var marker_collision_group = [];
    var selection_marker_collision_group = [];

    for (j in this.last_marker_collision_group[i]){
        marker_collision_group.push(this.last_marker_collision_group[i][j]);
        var objmarker = this.last_marker_collision_group[i][j];
        selection_marker_collision_group.push(objmarker);
        console.log("objmarker.getLatLng ->" , objmarker.getLatLng());
    }

    for(j in this.last_marker_collision_group) {
        if (j!=i) {
            var collision = false;
            for (k in this.last_marker_collision_group[j]){
                var objmarker = this.last_marker_collision_group[j][k];
                for(i in  selection_marker_collision_group) {
                    var iobjmarker = selection_marker_collision_group[i];
                    if (objmarker.lat == iobjmarker.lat && objmarker.lng == iobjmarker.lng){
                        collision = true;
                        break;
                    }else {
                        collision = false;
                    }
                }

                if(!collision) {
                    marker_collision_group.push(this.last_marker_collision_group[j][k]);
                }

            }
        }

    }



    console.log("collision marker orden ->", this.last_marker_collision_group);
    console.log("pintar marcadores ->", marker_collision_group);
    collision_group.addLayer(marker_collision_group);
    collision_group.onAdd(this.activeMap);
    this.collision_group =  collision_group;
    console.log("collision_group ->", collision_group);

};

module.exports.getpolyline_creadas = function () {
  return this.polyline_creadas;
};

module.exports.getMarker_creadas = function () {
  return this.marker_creadas;
};

module.exports.cleanPolyline = function() {
    var polyline_creadas = this.getpolyline_creadas();
    var map = this.activeMap;
    for (i in polyline_creadas) {
        try {
                map.removeLayer(polyline_creadas[i]);

            } catch (e) {
                console.log("problema al eliminar " + e);
            }

  }
  this.polyline_creadas = [];

};

module.exports.cleanMarkerCollision = function() {

    for (i in this.marker_collision_group) {
        for(j in this.marker_collision_group[i]) {
            this.collision_group.removeLayer(this.marker_collision_group[i][j]);
        }
    }

    for (i in this.last_marker_collision_group) {
        for(j in this.last_marker_collision_group[i]) {
            this.collision_group.removeLayer(this.last_marker_collision_group[i][j]);
        }
    }

    this.last_marker_collision_group = this.marker_collision_group;

    this.marker_collision_group = [];
};

module.exports.cleanMarker = function() {
    var map = this.activeMap;
    for (i in this.marker_creadas) {
        try {
                map.removeLayer(this.marker_creadas[i]);

            } catch (e) {
                console.log("problema al eliminar " + e);
            }
    }

  this.marker_creadas = [];

};

module.exports.cleanMarkerpoint = function() {
    var map = this.activeMap;
    for (i in this.makerpoint_creadas) {
        try {
                map.removeLayer(this.makerpoint_creadas[i]);

            } catch (e) {
                console.log("problema al eliminar " + e);
            }
    }

  this.makerpoint_creadas = [];

};

module.exports.marker_map = function(from, to){
     var IconStart = L.icon({
        iconUrl: 'assets/images/graphics/start.svg',
        iconSize: [28, 28],
        iconAnchor: [0, 0],
        popupAnchor:  [0, -50]
    });
    var IconEnd = L.icon({
        iconUrl: 'assets/images/graphics/end.svg',
        iconSize: [28, 28],
        iconAnchor: [0, 0],
        popupAnchor:  [0, -50]
    });

    var markerform = new L.marker([from[0],from[1]], {icon: IconStart, draggable: true})
        .addTo(this.activeMap);
    var markerto = new L.marker([to[0],to[1]], {icon: IconEnd, draggable: true})
        .addTo(this.activeMap);
    var _this = this;

    markerform.on('dragend', function(e){
       var marker = e.target;
       var result = marker.getLatLng();
       _this.cleanPolyline();
       _this.cleanMarkerpoint();
       _this.cleanMarkerCollision();
       var plan = session.plan();

            plan.setAddress('from', result.lng + ',' + result.lat, function(err, rees) {
                plan.updateRoutes();
          });
    });

    markerto.on('dragend', function(e){
       var marker = e.target;
       var result = marker.getLatLng();
       _this.cleanPolyline();
       _this.cleanMarkerpoint();
       _this.cleanMarkerCollision();
       var plan = session.plan();
            plan.setAddress('to', result.lng + ',' + result.lat, function(err, rees) {
                plan.updateRoutes();
          });
    });

    this.marker_creadas.push(markerform);
    this.marker_creadas.push(markerto);
};



module.exports.marker_map_point = function(to, map, itineration){

    var name = to[2];
    var class_name = 'leaflet-div-icon1 circle-fade-'+itineration;
    var html = "<span class='leaflet-label'>" + name + "</span>";

    var marker = L.marker({"lat":to[0], "lng": to[1]}, {
				icon: L.divIcon({
                    className: class_name,
                    iconSize: [15, 15],
                    iconAnchor: [0, 0],
                    html:html
				})
				,interactive: false
				,clickable:   false
				});


    if (this.marker_collision_group[itineration] === undefined){
        this.marker_collision_group[itineration] = [];
        this.marker_collision_group[itineration].push(marker);
    }else {
        this.marker_collision_group[itineration].push(marker);
    }
};



module.exports.drawRouteAmigo = function(legs,mode, itineration) {

    var route = legs.legGeometry.points;
    var circle_from = [legs.from.lat, legs.from.lon, legs.from.name];
    var circle_to = [legs.to.lat, legs.to.lon, legs.to.name];
    var color = '#000000';
    var weight = 5;
    var classname = "iteration-"+itineration + " iteration-200";


    var dasharray= '';

        if (mode=="CAR") {
            color = '#9E9E9E';
            dasharray= '6';
            weight = 3;

        }else if(mode=="BICYCLE") {
            color = '#FF0000';
            if(!(legs.routeColor === undefined)) {
                color = "#"+legs.routeColor;
             }
            dasharray= '6';
            weight = 3;

        }else if(mode=="SUBWAY" || mode=="RAIL") {
             if(!(legs.routeColor === undefined)) {
                if (legs.routeColor != "" || legs.routeColor.length == 6) {
                    color = "#"+legs.routeColor;
                }

             }
             weight = 8;
             this.marker_map_point(circle_from, this.activeMap, itineration);
             this.marker_map_point(circle_to, this.activeMap, itineration);

        }
        else if(mode == "WALK") {
            color = '#0BC8F4';
            dasharray= '6';
             weight = 3;
        }

        else if(mode=="BUS") {
            //color = '#FEF0B5';
            if(!(legs.routeColor === undefined)) {
                if (legs.routeColor != "" || legs.routeColor.length == 6) {
                    color = "#"+legs.routeColor;
                }
             }
             weight = 5;
             this.marker_map_point(circle_from, this.activeMap, itineration);
             this.marker_map_point(circle_to, this.activeMap, itineration);
        }


        var color_options;
        color_options = {
            color: color,
            weight: weight,
            opacity:1,
            dashArray: dasharray,
            className: classname
        };



      var argpolyline = L.PolylineUtil.decode(route, 5);
      argpolyline.unshift(circle_from);
      route = new L.Polyline(argpolyline, color_options);
      this.polyline_creadas.push(route);
      var boxes = L.RouteBoxer.box(route, 5);
      var boxpolys = new Array(boxes.length);
      route.addTo(this.activeMap);
};

