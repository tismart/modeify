var config = require('config');
var mapModule = require('map');
var plugins = require('./leaflet_plugins');
var polyUtil = require('./polyline_encoded.js');
var routeboxer = require('./leaflet_routeboxer.js');


var center = config.geocode().center.split(',').map(parseFloat)
if (config.map_provider && config.map_provider() !== 'AmigoCloud') {
  L.mapbox.accessToken = config.mapbox_access_token();
}

module.exports = function(el) {
  var map, realtime, southWest, northEast, blurLayer;

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
    console.log("entre amigo", map)

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

module.exports.drawRouteAmigo = function(route, mode) {
        var color = '#000';
        var weight = 5;
        var dasharray= '';

        if (mode=="CAR") {
            color = '#FF0000';
            dasharray= '6';
            weight = 3;

        }else if(mode=="BIKE") {
            color = '#9E9E9E';
            dasharray= '6';
            weight = 3;

        }else if(mode=="SUBWAY" || mode=="RAIL") {
            weight = 10;
            color = '#FF0000';

        }

       var color_options = {
            color: color,
            opacity: 1,
<<<<<<< HEAD
            weight: weight,
            dashArray: dasharray
=======
            weight: 3,
            fillColor: '#000',
            fillOpacity: 0.6,
            dashArray: '3'
>>>>>>> parent of 54bf337... filas puntiadas 6
        };

       route = new L.Polyline(L.PolylineUtil.decode(route, 5), color_options);
      var boxes = L.RouteBoxer.box(route, 5);
      var bounds = new L.LatLngBounds([]);
      var boxpolys = new Array(boxes.length);

      for (var i = 0; i < boxes.length; i++) {
        bounds.extend(boxes[i]);
      }
      route.addTo(this.activeMap);
      this.activeMap.fitBounds(bounds);
};

