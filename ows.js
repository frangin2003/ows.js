"use strict";

/**
 * Perform OGC Web Services calls and parse responses to JSON or PNG.
 */
var ows = {
    
    getMapImage: function(wmsUrl, options, callback) {
        
        var defaultOptions = {
            request: "GetMap",
            service: "WMS",
            version: "1.3.0",
            format: "image/png",
            width: "800",
            height: "600",
            transparent: "true",
            tiled: false,
            styles: ""
        };

        if (options) {
            options = $.extend(true, defaultOptions, options);
        } else {
            options = defaultOptions;
        }
        
        ows.postText(
            wmsUrl, 
            options, 
            callback);
    },
    
    getFeature: function(wfsUrl, options, callback) {
        
        var defaultOptions = {
            request: "GetFeature"
            ,service: "WFS"
            ,version: "2.0.0"
            ,outputFormat: "json"
            //,typeNames: workspaceName + ':' + typeName
            //,count: 3
            //,sortBy: "id"

            // SPECIFIC GEOSERVER
            //,srsName: "EPSG:900913"
            //,cql_filter:''
        };
        
        if (options) {
            options = $.extend(true, defaultOptions, options);
        } else {
            options = defaultOptions;
        }

        ows.postText(
            wfsUrl, 
            options, 
            callback
        );
    },
    
    getLegendGraphic: function(wmsUrl, options, callback) {
        
        var defaultOptions = {
            request: "GetLegendGraphic",
            version: "1.3.0",
            format: "image/png",
            transparent: "true",
            width: "20",
            height: "20",
            //layer: workspaceName + ':' + typeName,
            //rule: "Medium"
        };
        
        if (options) {
            options = $.extend(true, defaultOptions, options);
        } else {
            options = defaultOptions;
        }
        
        ows.postText(
            wmsUrl, 
            options, 
            callback
        );
    },
    
    getServerNameSpaces: function(serverUrl, options, callback) {
        
        var defaultOptions = {
            service: "wfs",
            request: "DescribeFeatureType",
            version: "2.0.0"
        };
        
        if (options) {
            options = $.extend(true, defaultOptions, options);
        } else {
            options = defaultOptions;
        }
        
        ows.postText(
            serverUrl, 
            options, 
            function(xml) {

                var imports = $("xsd\\:import", xml);
                var res = [];
                var $import = null;
                for (var i = 0; i < imports.length; i++) {
                    $import = imports[i];
                    res.push({
                        name_space: $import.attr("namespace")
                    });
                }

                console.log(res);
                if (callback) callback(res);
            }
        );
    },
    
    getNameSpaceInfos: function(serverUrl, options, callback) {
        
        var defaultOptions = {
            service: "wfs",
            request: "GetCapabilities",
            version: "2.0.0"
            //,nameSpace: nameSpace
        };
        
        if (options) {
            options = $.extend(true, defaultOptions, options);
        } else {
            options = defaultOptions;
        }
        
        ows.postText(
            serverUrl, 
            options, 
            function(xml) {

                var featureTypes = $("FeatureType", xml);
                var res = new Array();
                var $featureType = null;
                for (var i = 0; i < featureTypes.length; i++) {
                    $featureType = $(featureTypes[i]);
                    res.push({
                        name_space: options.nameSpace
                        ,resource_name: $($featureType.find("Name")).html()
                        ,title: $($featureType.find("Title")).html()
                        ,projection: ows.extractProjection($($featureType.find("DefaultCRS")).html())
                        ,bbox: ows.extractBbox($($featureType.find("ows\\:WGS84BoundingBox")))
                    });
                }

                console.log(res);
                if (callback) callback(res);
            }
        );
    },

    getLayerInfos: function(serverUrl, options, callback) {

        var defaultOptions = {
            service: "wfs",
            request: "DescribeFeatureType",
            version: "2.0.0"
            //,typeName: workspaceName + ':' + typeName,
        };
        
        if (options) {
            options = $.extend(true, defaultOptions, options);
        } else {
            options = defaultOptions;
        }
        
        ows.postText(
            serverUrl, 
            options, 
            function(xml) {

                var elements = $("xsd\\:element", xml);
                var res = {};
                var fields = new Array()
                var $element = null;
                for (var i = 0; i < elements.length; i++) {
                    $element = $(elements[i]);

                    if (ows.processField($element.attr("name"))) {
                        fields.push({
                            field: $element.attr("name")
                            ,nillable: ($element.attr("nillable") === "true")
                            ,data_type: ows.extractDataType($element.attr("type"))
                            ,isFilter: ows.isFilterField($element.attr("name"))
                        });

                    } else if (ows.isGeomField($element.attr("name"))) {

                        res.geometry = {
                            field: $element.attr("name")
                            ,nillable: ($element.attr("nillable") === "true")
                            ,data_type: ows.extractDataType($element.attr("type"))
                            ,geom_type: ows.extractGeometryDataType($element.attr("type"))
                        };
                    }
                }

                res.fields = fields;

                console.log(res);
                if (callback) callback(res);
            }
        );
    },

    xpath: function(nodeName) {

        var xpath = nodeName.replace(/:/g, "\\:");

        return xpath;
    },

    processField: function(field) {
        
        if (!field)
            return false;
        
        return ["id", "gid", "the_geom"].indexOf(field) == -1;
    },
    
    isGeomField: function(field) {
        
        return ["the_geom"].indexOf(field) > -1;
    },
    
    isFilterField: function(field) {
        
        return ["the_geom"].indexOf(field) == -1;
    },
    
    extractDataType: function(type) {
        
        if (type && (type.indexOf("xsd:") == 0))
            return type.substring(4);
        
        return type;
    },
    
    extractGeometryDataType: function(type) {

        // voir -> http://schemas.opengis.net/gml/3.1.1/base/geometryAggregates.xsd
        if (type 
        && (
        (type.toLowerCase().indexOf("polygon") > -1) 
        || (type.toLowerCase().indexOf("surface") > -1)
        )) {
            
            return "polygon";
        
        } else if (type 
        && (
        (type.toLowerCase().indexOf("curve") > -1) 
        || (type.toLowerCase().indexOf("line") > -1)
        )) {
            
            return "line";
        
        } else if (type 
        && (
        (type.toLowerCase().indexOf("point") > -1)
        )) {
            
            return "point";
        }
        
        return null;
    },

    extractProjection: function(projection) {

        if (projection) return projection.substr(projection.indexOf("EPSG")).replace("::",":");

        return projection;
    },

    extractBbox: function($bbox) {

        var lowerCorner = $($bbox.find("ows\\:LowerCorner")).html();
        var upperCorner = $($bbox.find("ows\\:UpperCorner")).html();

        var lowerCornerArr = lowerCorner.split(" ");
        var upperCornerArr = upperCorner.split(" ");

        return [lowerCornerArr[0], lowerCornerArr[1], upperCornerArr[0], upperCornerArr[1]];
    },

    /**
     * Examples
     * http://grepcode.com/file/repo1.maven.org/maven2/org.jvnet.ogc/ogc-schemas/2.0.0/ogc/wfs/2.0/examples/GetFeature/GetFeature_13_Res.xml
     * http://grepcode.com/file/repo1.maven.org/maven2/org.jvnet.ogc/wfs-v_2_0/2.0.0/ogc/wfs/2.0/examples/GetFeature/GetFeature_09.xml?av=f
     */
    getXmlWfsGetFeatureHeader: function(options) {

        var xml = 
'<?xml version="1.0" ?>'
+'<GetFeature '
+'   version="2.0.0" '
+'   service="WFS" '
+'   handle="' + options.handle + '" '
+'   xmlns="http://www.opengis.net/wfs/2.0" '
+'   xmlns:fes="http://www.opengis.net/fes/2.0" '
+'   xmlns:gml="http://www.opengis.net/gml/3.2" '
+'   xmlns:myns="http://www.someserver.com/myns" '
+'   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
+'   xsi:schemaLocation="http://www.opengis.net/wfs/2.0 '
+'                       http://schemas.opengis.net/wfs/2.0/wfs.xsd '
+'                       http://www.opengis.net/gml/3.2 '
+'                       http://schemas.opengis.net/gml/3.2.1/gml.xsd"> '
+ '<Query typeNames="' + options.typeNames + '">';

        for(var i = 0; i < options.properties.length; i++) {

            xml += '<PropertyName>' + options.properties[i] + '</PropertyName>';
        }

        return xml;
    },

    getXmlWfsGetFeatureFooter: function(options) {

        return '</Query></GetFeature>';
    },

    getWfsFilterIntersects: function(options, geom_type) {

        var xml =
  '    <fes:Filter>'
+ '        <fes:Intersects>'
+ '            <fes:ValueReference>' + options.geometryColumn + '</fes:ValueReference>';

        switch(geom_type) {

            case "point":

                xml +=
  '            <gml:Point>'
+ '                <gml:pos>' + options.coords + '</gml:pos>'
+ '            </gml:Point>';
            break;

            case "line":

                xml +=
  '            <gml:LineString>'
+ '                <gml:posList>' + options.coords + '</gml:posList>'
+ '            </gml:LineString>';
            break;

            case "polygon":

                xml +=
  '            <gml:Polygon>'
+ '                <gml:exterior>'
+ '                    <gml:LinearRing>'
+ '                        <gml:posList>' + options.coords + '</gml:posList>'
+ '                    </gml:LinearRing>'
+ '                </gml:exterior>'
+ '            </gml:Polygon>';

            break;

            default:

                console.error("Unknow geometry '" + geom_type + "' type !");
            break;
        }

        xml +=
  '        </fes:Intersects>'
+ '    </fes:Filter>';

        return xml;
    },

    //http://gis.stackexchange.com/questions/31027/creating-a-polyline-buffer-in-openlayers
    //http://gis.stackexchange.com/questions/31614/openlayers-wfs-getfeature-draw-circle
    //http://gis.stackexchange.com/questions/8950/how-to-properly-utilize-dwithin-spatial-filter-in-openlayers/8952#8952

    parseWfsGetFeatureResponse: function(xml, typeNames) {

        console.log(xml);

        var features = [];

        $('wfs\\:member', xml)
            .find(ows.xpath(typeNames))
            .each(function() {

                var $typeName = $(this);

                (function() {

                    var feature = {
                        gml_id: $typeName.attr("gml:id"),
                    };

                    $typeName.children().each(function() {

                        feature[$(this).context.localName] = $(this).text();
                    });

                    features.push(feature);
                })();
        });

        console.log(features);

        return features;
    },

    extractFidValue: function(feature) {

        var val = feature["gml_id"].split(".")[1];

        return val;
    },

    extractPropertyValue: function(feature, typeName, prop) {
        
        var nameSpace = typeName.split(":")[0];

        return feature[nameSpace + ":" + prop];
    },

    getFeaturesByPolygon: function(serverUrl, options, callback) {

        var defaultOptions = {
            handle: "ows.getFeaturesByPolygon()",
            geometryColumn: "geom"
            //,typeNames: workspaceName + ':' + typeName,
            //properties: ["id"],
            //coords: "1855187.2717816331 4246602.462400938 1855147.3446741172 4246459.255748784 1855308.8682398316 4246450.841496582 1855187.2717816331 4246602.462400938"
        };
        
        if (options) {
            options = $.extend(true, defaultOptions, options);
        } else {
            options = defaultOptions;
        }

        var xml = ows.getXmlWfsGetFeatureHeader(options);

        xml += ows.getWfsFilterIntersects(options, "polygon");

        xml += ows.getXmlWfsGetFeatureFooter(options);

        console.log(xml);

        $.ajax({
            url: serverUrl,
            data: xml, 
            type: 'POST',
            contentType: "text/xml",
            success : function (data, textStatus, jqXHR) {

                var features = ows.parseWfsGetFeatureResponse(jqXHR.responseText, options.typeNames);

                if (callback) callback(features);
            },
            error : function (xhr, ajaxOptions, thrownError){  
                console.error(xhr.status);          
                console.error(thrownError);
            } 
        });
    },

    getFeaturesByLinestring: function(serverUrl, options, callback) {

        var defaultOptions = {
            handle: "ows.getFeaturesByLinestring()",
            geometryColumn: "geom"
            //,typeNames: workspaceName + ':' + typeName,
            //properties: ["id"],
            //coords: "1855187.2717816331 4246602.462400938 1855147.3446741172 4246459.255748784"
        };
        
        if (options) {
            options = $.extend(true, defaultOptions, options);
        } else {
            options = defaultOptions;
        }

        var xml = ows.getXmlWfsGetFeatureHeader(options);

        xml += ows.getWfsFilterIntersects(options, "line");

        xml += ows.getXmlWfsGetFeatureFooter(options);

        console.log(xml);

        $.ajax({
            url: serverUrl,
            data: xml, 
            type: 'POST',
            contentType: "text/xml",
            success : function (data, textStatus, jqXHR) {
                
                var features = ows.parseWfsGetFeatureResponse(jqXHR.responseText, options.typeNames);

                if (callback) callback(features);
            },
            error : function (xhr, ajaxOptions, thrownError){  
                console.error(xhr.status);          
                console.error(thrownError);
            } 
        });
    },

    getFeaturesByPoint: function(serverUrl, options, callback) {

        var defaultOptions = {
            handle: "ows.getFeaturesByPoint()",
            geometryColumn: "geom"
            //,typeNames: workspaceName + ':' + typeName,
            //properties: ["id"],
            //coords: "1855187.2717816331 4246602.462400938"
        };
        
        if (options) {
            options = $.extend(true, defaultOptions, options);
        } else {
            options = defaultOptions;
        }

        var xml = ows.getXmlWfsGetFeatureHeader(options);

        xml += ows.getWfsFilterIntersects(options, "point");

        xml += ows.getXmlWfsGetFeatureFooter(options);

        console.log(xml);

        $.ajax({
            url: serverUrl,
            data: xml, 
            type: 'POST',
            contentType: "text/xml",
            success : function (data, textStatus, jqXHR) {
                
                var features = ows.parseWfsGetFeatureResponse(jqXHR.responseText, options.typeNames);

                if (callback) callback(features);
            },
            error : function (xhr, ajaxOptions, thrownError){  
                console.error(xhr.status);          
                console.error(thrownError);
            } 
        });
    },

    postText: function (url, data, callback) {

        $.ajax({
            url: url,
            type: "POST",
            data: data,
            mimeType: "text/plain; charset=x-user-defined"
        }).done(function(text) { if (callback) callback(text);}).fail(function (jqXHR, textStatus, errorThrown) {
            console.error(errorThrown);
        });
    }
};
