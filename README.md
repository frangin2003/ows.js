# ows.js
Ease OGC Web Services (OWS) calls with javascript (and some [JQuery]).

## Version
1.0.0

## Dependencies

All [JQuery] with **$.extend** and **$.ajax** methods.

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

License
----

MIT

[JQuery]:https://jquery.com/
