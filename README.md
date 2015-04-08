# ows.js
Ease OGC Web Services (OWS) calls with javascript (and some [JQuery]).

## Version
1.0.0

## Dependencies

All [JQuery] versions with **$.extend** and **$.ajax** methods.

## Installation

Include the JS scripts in your html page like this:

```html
<script src="ows.js"></script>
```

## API doc
###getMapImage
Performs a WMS 1.3.0 GetMap request.

Returns a map as binary PNG, could be converted to Base64 for instance.

###getFeature
Performs a WFS 2.0.0 GetFeature request.

Returns the xml response.

###getLegendGraphic
Performs a WMS 1.3.0 GetLegendGraphic request.

Returns a map as binary PNG, could be converted to Base64 for instance.

###getServerNameSpaces
Performs a WFS 2.0.0 DescribeFeatureType request.

Returns as JSON the list of namespaces.

###getNameSpaceInfos
Performs a WFS 2.0.0 GetCapabilities request for a given namespace.

Returns as JSON:
- resource name
- title
- projection as "EPSG:something" string
- bounding box

###getLayerInfos
Performs a WFS 2.0.0 DescribeFeatureType request for a given type name.

Returns as JSON the list of type name attributes with:
- attribute name
- nillable ?
- data type
- is filter ?
- geom type if field is a geometry one

###getFeaturesByPolygon
Performs a WFS 2.0.0 GetFeature request for a given polygon coordinates.

Returns as JSON the features included or intersecting the given polygon geometry.

###getFeaturesByLinestring
Performs a WFS 2.0.0 GetFeature request for a given linestring coordinates.

Returns as JSON the features included or intersecting the given linestring geometry.

###getFeaturesByPoint
Performs a WFS 2.0.0 GetFeature request for a given point coordinates.

Returns as JSON the features intersecting the given point geometry.

##Usage examples
###Using [OpenLayers2] - [DrawFeature] controls
You can combine using **ows.js ** with [OpenLayers2] - [DrawFeature] controls.

Here some javascript code using a DrawFeature control (with a regular polygon handler with 30 sides, in short a **circle**). We also use a function **parseFeatureGeometryFromEvent(...)** that can convert OpenLayers geometry into a string that matches XML WFS request format. We want here to select features of a layer named 'buildings' (with attributes 'id', 'name' and 'height') in the namespace 'yournamespace' :
```javascript
    /**
     * Extract geometry coordinates from an OpenLayers event and returns them as a string whitespace separated:
     * "x1 y1 x2 y2..."
     */
    var parseFeatureGeometryFromEvent = function parseFeatureGeometryFromEvent(map, layer, evt) {
        
            var coordinates = evt.feature.geometry.transform(
            map.projection, 
            layer.projection)
            .toString()
            .replace(/POLYGON/g, "")
            .replace(/LINESTRING/g, "")
            .replace(/POINT/g, "")
            .replace(/\(/g, "")
            .replace(/\)/g, "")
            .split(",");
            
            return coordinates.join(" ");
        };
        
        var map = new OpenLayers.Map( 'map' );

        var layer = new OpenLayers.Layer.WMS( "buildings WMS",
                "http://your_sig_server/wms/",
                {layers: 'yournamespace:buildings'} );
        map.addLayer(layer);

        var control = 
        new OpenLayers.Control.DrawFeature(
            new OpenLayers.Layer.Vector('buildings draw'), 
            OpenLayers.Handler.RegularPolygon, 
            {
                handlerOptions: {sides: 30},
                eventListeners: {
                    featureadded: function(evt) {
                        ows.getFeaturesByPolygon("http://your_sig_server/wms/", 
                        {
                            coords: parseFeatureGeometryFromEvent(map, layer, evt),
                            typeNames: 'namespace:buildings',
                            properties: ['id','name','height'],
                        }, 
                        function(features) {
                            console.log(features);
                        );
                    }
                }
            }
        );
		
		map.addControl(control);
```


License
----

MIT

[JQuery]:https://jquery.com/
[OpenLayers2]:http://openlayers.org/two/
[DrawFeature]:http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/DrawFeature-js.html
