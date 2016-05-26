/**
 * MicroAJAX: Tiny AJAX library (841Bytes Minified!)
 * @param  {string}   B   URL String
 * @param  {function} A   Callback function
 * See: https://code.google.com/archive/p/microajax/
 */
function microAjax(B,A){this.bindFunction=function(E,D){return function(){return E.apply(D,[D])}};this.stateChange=function(D){if(this.request.readyState==4){this.callbackFunction(this.request.responseText)}};this.getRequest=function(){if(window.ActiveXObject){return new ActiveXObject("Microsoft.XMLHTTP")}else{if(window.XMLHttpRequest){return new XMLHttpRequest()}}return false};this.postBody=(arguments[2]||"");this.callbackFunction=A;this.url=B;this.request=this.getRequest();if(this.request){var C=this.request;C.onreadystatechange=this.bindFunction(this.stateChange,this);if(this.postBody!==""){C.open("POST",B,true);C.setRequestHeader("X-Requested-With","XMLHttpRequest");C.setRequestHeader("Content-type","application/x-www-form-urlencoded");C.setRequestHeader("Connection","close")}else{C.open("GET",B,true)}C.send(this.postBody)}};

/**
 *  AjaxGeoJSONLayers
 */
L.Control.AjaxGeoJSONLayers = L.Control.extend({
	options: {
		collapsed: true,
		position: 'topright'
	},

	initialize: function (overlays, options) {
		L.setOptions(this, options);

		var overlaysLength = overlays.length;

		this._layers = {};
		this._handlingClick = false;

		for (i = 0; i < overlaysLength; i++) {
			this._addLayer(overlays[i]);
		}
	},

	onAdd: function (map) {
		this._initLayout();
		this._update();

		map
		    .on('layeradd', this._onLayerChange, this)
		    .on('layerremove', this._onLayerChange, this);

		return this._container;
	},

	onRemove: function (map) {
		map
		    .off('layeradd', this._onLayerChange, this)
		    .off('layerremove', this._onLayerChange, this);
	},

	_initLayout: function () {
		var className = 'leaflet-control-layers',
		    container = this._container = L.DomUtil.create('div', className);

		//Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
		container.setAttribute('aria-haspopup', true);

		if (!L.Browser.touch) {
			L.DomEvent
				.disableClickPropagation(container)
				.disableScrollPropagation(container);
		} else {
			L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
		}

		var form = this._form = L.DomUtil.create('form', className + '-list');

		if (this.options.collapsed) {
			if (!L.Browser.android) {
				L.DomEvent
				    .on(container, 'mouseover', this._expand, this)
				    .on(container, 'mouseout', this._collapse, this);
			}
			var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
			link.href = '#';
			link.title = 'Layers';

			if (L.Browser.touch) {
				L.DomEvent
				    .on(link, 'click', L.DomEvent.stop)
				    .on(link, 'click', this._expand, this);
			}
			else {
				L.DomEvent.on(link, 'focus', this._expand, this);
			}
			//Work around for Firefox android issue https://github.com/Leaflet/Leaflet/issues/2033
			L.DomEvent.on(form, 'click', function () {
				setTimeout(L.bind(this._onInputClick, this), 0);
			}, this);

			this._map.on('click', this._collapse, this);
			// TODO keyboard accessibility
		} else {
			this._expand();
		}

		this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);

		container.appendChild(form);
	},

	_addLayer: function (overlay) {
		var id = L.stamp(overlay);

		this._layers[id] = {
			url: overlay.url,
			label: overlay.label,
			callback: overlay.callback,
			layer: null,
			legend: null,
			showLegend: overlay.showLegend,
			legendHTML: overlay.legendHTML,
			legendClass: overlay.legendClass,
			legendPosition: overlay.legendPosition,
			id: id 
		};
	},

	_update: function () {
		if (!this._container) {
			return;
		}

		this._overlaysList.innerHTML = '';

		var obj, i;

		for (i in this._layers) {
			obj = this._layers[i];
			this._addItem(obj);
		}
	},

	_onLayerChange: function (e) {
		var obj = this._layers[L.stamp(e.layer)];

		if (!obj) { return; }

		if (!this._handlingClick) {
			this._update();
		}

		var type = (e.type === 'layeradd' ? 'overlayadd' : 'overlayremove');

		if (type) {
			this._map.fire(type, obj);
		}
	},

	_addItem: function (obj) {

		var label = document.createElement('label'),
			input = document.createElement('input'),
			layerSelect = document.createElement('div'),
			loadingIndicator = document.createElement('span'),
			name = document.createElement('span');

		layerSelect.className = 'layer-select';
		loadingIndicator.className = 'loading';
		input.type = 'checkbox';
		input.className = 'leaflet-control-layers-selector';

		input.layerId = obj.id;

		L.DomEvent.on(input, 'click', this._onInputClick, this);

		name.innerHTML = ' <span class="loading-inline.grey"></span>' + obj.label;

		layerSelect.appendChild(input);
		layerSelect.appendChild(loadingIndicator);

		label.appendChild(layerSelect);
		label.appendChild(name);

		var container = this._overlaysList;
		container.appendChild(label);

		return label;
	},

	_onInputClick: function (e) {
		//L.DomEvent.stopPropagation(e);
		if (!e.target) return;
		var input = e.target,
			loading = input.nextSibling,
			layerId = input.layerId,
			obj = this._layers[layerId],
			that = this;

		this._handlingClick = true;

		if (input.checked) {
			
			if (!obj.layer) {
				map = this._map;
				loading.style.display = 'inline-block';
				input.style.display = 'none';

				microAjax(obj.url, function(res) {
					res = JSON.decode(res);
					obj.layer = obj.callback(res);
					map.addLayer(obj.layer);
					that._showOverlayLegend(obj);
					input.style.display = 'inline-block';
					loading.style.display = 'none';
				});
			} else if (!this._map.hasLayer(obj.layer)) {
				map.addLayer(obj.layer);
				this._showOverlayLegend(obj);
			}
		} else if (this._map.hasLayer(obj.layer)){
			this._map.removeLayer(obj.layer);
			this._removeOverlayLegend(obj);
		}

		this._handlingClick = false;

		this._refocusOnMap();
	},

	_showOverlayLegend: function(obj) {
		if (!obj.showLegend) return;
		
		if (obj.legendHTML) {
			obj.legend = L.control({position: obj.legendPosition});
			obj.legend.onAdd = function() {
				var container = L.DomUtil.create('div', obj.legendClass);
				container.innerHTML = obj.legendHTML;

			    return container;
			}
			obj.legend.addTo(this._map);
		}
	},

	_removeOverlayLegend: function(obj) {
		if (!obj.legend) return;
		this._map.removeControl(obj.legend);
	},

	_expand: function () {
		L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
	},

	_collapse: function () {
		this._container.className = this._container.className.replace(' leaflet-control-layers-expanded', '');
	}
});

L.control.AjaxGeoJSONlayers = function (overlays, options) {
	return new L.Control.AjaxGeoJSONLayers(overlays, options);
};