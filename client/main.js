L.Icon.Default.imagePath = '/packages/bevanhunt_leaflet/images';

Session.setDefault('count', 0);
Session.setDefault('bbox', []);

var query = [
    { type: 'node',
      filter: {
       amenity:'shelter'
      }
    },
    { type: 'node',
      filter: {
       tourism:'alpine_hut'
      }
    },
    { type: 'way',
      filter: {
       highway:'path',
       sac_scale:'hiking'
      }
    }
];
layer = undefined;

GeoCache = new Mongo.Collection('geo-cache');


Template.map.rendered = function(){
  var map = L.map('map',{
   scrollWheelZoom:false,
   touchZoom:false,
   minZoom: 12
 }).setView([45.980741,11.181335], 12);

  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
   attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
   maxZoom: 18
  }).addTo(map);

  var bounds = map.getBounds();
  var bbox = [ bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()];
  Session.set('bbox', bbox);

  layer = L.geoJson([],{
    onEachFeature: onEachFeature
  }).addTo(map);

  map.on('moveend', function(e){
    var bounds = map.getBounds();
    var bbox = [ bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()];
    Session.set('bbox', bbox);
  });
}

function onEachFeature(feature, layer) {
  if (feature.properties && feature.properties.tags) {
      layer.bindPopup(JSON.stringify(feature.properties.tags));
  }
}

Tracker.autorun( function(){
  var bbox = Session.get('bbox');
  Meteor.subscribe('overpass', query, bbox);
});

Tracker.autorun( function(){
  var features = GeoCache.find().fetch();
  if ( layer ){
    layer.clearLayers();
    Session.set('count', features.length);
    _.each(features, function(feature){
      layer.addData( feature );
    });
  }
});

Template.stats.helpers({
  'count': function(){
    return Session.get('count');
  },
  'bbox': function(){
    return Session.get('bbox').join(',');
  },
  'latest': function(){
    return GeoCache.find({}, {
      sort:[ ['updatedAt', 'desc'] ],
      limit:10
    });
  }
});
