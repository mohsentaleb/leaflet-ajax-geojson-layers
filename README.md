# Leaflet AJAX GeoJSON Layer
A Leaflet Layer that dynamically loads GeoJSON data from Ajax, with caching.
It uses [MicroAJAX](https://code.google.com/archive/p/microajax/), a tiny AJAX library (841Bytes Minified!) for its AJAX funtionalities.
It's heavily inspired by [stefanocudini/leaflet-layerJSON](https://github.com/stefanocudini/leaflet-layerjson).

Tested with Leaflet 0.7.7.

## How to use
You can have unlimited number of GeoJSON layers provided as an array of objects following the pattern below:

```javascript
var overlays = [
				{
					url: '/path/to/geojsonfile',
					name: 'uniqueLayerID',
					label: 'The coolest layer ever', // Label to be shown in layers control
					showLegend: true, // or false
					legendHTML: "<div>Some HTML to be used as layer legend when its enabled</div>",
					legendPosition: 'bottomleft', // or other combinations used in leaflet for positioning
					legendClass:'leaflet-legend', // a CSS class to be added to legend control
					callback: function(res) {
						return L.geoJson(res, {
							style: function (feature) {
								return {
									color: feature.properties.color,
									stroke: true,
									clickable: false,
									fill: true,
									dashArray: '10'
								};
							},
							onEachFeature: function(feature, layer) {
								if (feature.geometry.type == 'Point') {
									// ...
								}
							},
							pointToLayer: function (feature, latlng) {
								// ...
							}
						});
					}
				}
			};

			var map = new L.Map(container, options);
			map.addControl(new L.Control.AjaxGeoJSONLayers(overlays, {position: 'topleft', collapsed: false}));

```

## Overlays Options
- **url** (String): /path/to/geojsonfile. Could be a relative or an absolute URL.
- **name** (String): This is used as an identifier in `_layers` array in module itself and is never shown to users.
- **label** (String): Label to be shown in layers control. It's shown to users.
- **showLegend** (Boolean). Specifies whether this layer has also a legend which should be displayed upon layer load.
- **legendHTML** (String). Some HTML to be used as layer legend when its enabled. (See above option)
- **legendPosition** (String). A Leaflet control position. Possible values: `topleft`/`topright`/`bottomleft`/`bottomright`
- **legendClass** (String). A CSS class to be added to legend control
- **callback** (function). Callback function when the layer is loaded. The `response` object is passed to the callback function.





## Showcase
This module is initially built for [kikojas.com](http://www.kikojas.com) and can be seen at [kikojas.com/explore](http://www.kikojas.com/explore).

## License
This project is licensed under the MIT license, Copyright (c) 2016 Mohsen Taleb. For more information see `LICENSE.md`.

[![forthebadge](http://forthebadge.com/images/badges/built-with-love.svg)](http://forthebadge.com)