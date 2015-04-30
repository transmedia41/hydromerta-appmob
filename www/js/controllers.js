angular.module('hydromerta.controllers', ['hydromerta.constants', 'leaflet-directive', 'hydromerta.services', 'geolocation'])

        .controller('MapController', function ($scope, mapboxMapId, mapboxAccessToken, SectorService, StorageService, ActionPointService, $rootScope, $state, leafletData) {
            var indexCircle = 0;
            var egoutIcon = {
                type: "extraMarker",
                extraClasses: "icon-bouche_egout"
            }
            var toiletteIcon = {
                type: "extraMarker",
                extraClasses: "icon-toilettes"

            }
            var afficheIcon = {
                type: "extraMarker",
                extraClasses: "icon-affiche"

            }
            var arrosageIcon = {
                type: "extraMarker",
                extraClasses: "icon-arrosage"
            }
            var fontaineIcon = {
                type: "extraMarker",
                extraClasses: 'icon-fontaine'
            }
            var hydranteIcon = {
                type: "extraMarker",
                extraClasses: 'icon-hydrante'

            }






            var mapboxTileLayer = "http://api.tiles.mapbox.com/v4/" + mapboxMapId + "/{z}/{x}/{y}.png?access_token=" + mapboxAccessToken

            $scope.paths = {}
            $scope.geojson = {}


            angular.extend($scope, {
                defaults: {
                    maxZoom: 18,
                    minZoom: 12,
                    attributionControl: false,
                    tileLayer: mapboxTileLayer,
                    zoomControl: false
                },
                maxbounds: {
                    southWest: {
                        lat: 46.749859206774524,
                        lng: 6.559438705444336
                    },
                    northEast: {
                        lat: 46.8027621127906,
                        lng: 6.731100082397461
                    }
                },
                mapCenter: {
                    lat: 46.779463,
                    lng: 6.638802,
                    zoom: 12
                },
                layers: {
                    baselayers: {
                        xyz: {
                            name: 'OpenStreetMap (XYZ)',
                            url: mapboxTileLayer,
                            type: 'xyz'
                        }
                    },
                    overlays: {
                        markers: {
                            type: 'group',
                            name: 'Markers',
                            visible: false
                        },
                        circles: {
                            type: 'group',
                            name: 'Circles',
                            visible: false
                        },
                        sectors: {
                            type: 'group',
                            name: 'Sectors',
                            visible: true
                        },
                        yverdon: {
                            type: 'group',
                            name: 'Yverdon',
                            visible: false
                        },
                        actions: {
                            name: "Actions",
                            type: "markercluster",
                            visible: true
                        }

                    }
                },
                markers: {},
                addSectorsPathToMap: function (sectors) {

                    angular.forEach(sectors, function (value, key) {
                        var sector = {}
                        sector.type = 'polygon'
                        //sector.layer = 'sectors'
                        //sector.focus = false
                        sector.clickable = false

                        // STROKE
                        sector.weight = 6
                        sector.opacity = 1
                        sector.color = 'green'

                        sector.fill = true
                        sector.fillColor = 'red'
                        sector.fillOpacity = 0.8

                        //sector.actionsPolygon = sectors[i].properties.actionsPolygon
                        //sector.actionPoints = sectors[i].properties.actionsPoint
                        /*sector.message = "<h3>Influence : "+sectors[i].properties.influence+"%</h3><p>Boss: "
                         +sectors[i].properties.character.name+"</p>";*/


                        sector.latlngs = []
                        var polyPoints = value.geometry.coordinates[0]
                        angular.forEach(polyPoints, function (value) {
                            sector.latlngs.push({
                                lat: value[1],
                                lng: value[0]
                            })
                        })

                        /*
                         for (var x = latlngs.length - 1; x>= 0; x--) {
                         sector.latlngs[x] = {
                         lat: latlngs[x][1], lng: latlngs[x][0]
                         }
                         };*/


                        $scope.paths['sector' + key] = sector

                    })
                },
                stylingSectorsGeoJSON: function (sectors) {
                    var data = {
                        type: "FeatureCollection",
                        features: []
                    }
                    angular.forEach(sectors, function (value, key) {
                        value.style = {
                            fillColor: "green",
                            weight: 2,
                            opacity: 1,
                            color: 'white',
                            dashArray: '3',
                            fillOpacity: 0.7
                        }
                        data.features.push(value)
                    })
                    return data
                },
                addSectorsGeoJSONToMap: function (sectors) {

                    /*var data = $scope.stylingSectorsGeoJSON(sectors)
                     console.log(data)*/

                    $scope.geojson = {
                        data: {
                            type: "FeatureCollection",
                            features: sectors
                        },
                        style: function (feature) {
                            switch (feature.geometry.type) {
                                case 'Polygon':
                                    return {
                                        weight: 5,
                                        opacity: 1,
                                        color: '#228D00',
                                        dashArray: '12',
                                        fillOpacity: 0.1
                                    }
                                case 'Point':
                                    return {
                                        fillColor: "green",
                                        weight: 2,
                                        opacity: 1,
                                        color: '#228D00',
                                        dashArray: '3',
                                        fillOpacity: 0.7
                                    }
                            }
                        }
                    }

                    //$scope.geojson= data

                },
                markerColor: function (cooldown) {
                    // lastperformed+coooldown > date.now()
                    if (cooldown <= 600) {
                        return 'img/green.png';
                    } else {
                        return 'img/grey.png';
                    }
                    ;

                },
                addMarkersToMap: function (points) {
                    var markers = []
                    angular.forEach(points, function (point, index) {
                        var marker = {
                            layer: 'actions',
                            id: point.id,
                            lat: point.geometry.coordinates[1],
                            lng: point.geometry.coordinates[0],
                            properties: point.properties,
                            icon: {}
                        }
                        switch (point.properties.type.toLowerCase()) {
                            case 'hydrante':
                                marker.icon.extraClasses = 'icon-hydrante'
                                marker.icon.iconImg = 'images/hydrante.png'//hydrante
                                break;
                            case 'fontaine':
                                marker.icon.extraClasses = 'icon-fontaine'
                                marker.icon.iconImg = 'images/fontaine.png'
                                break;
                            case 'arrosage':
                                marker.icon.extraClasses = 'icon-arrosage'
                                marker.icon.iconImg = 'images/arrosage.png'
                                break;
                            case 'affiche':
                                marker.icon.extraClasses = 'icon-affiche'
                                marker.icon.iconImg = 'images/affiche.png'
                                break;
                            case 'toilettes':
                                marker.icon.extraClasses = 'icon-toilettes'
                                marker.icon.iconImg = 'images/toilettes.png'
                                break;
                            case 'bouche_egout':
                                marker.icon.extraClasses = 'icon-bouche_egout'
                                marker.icon.iconImg = 'images/bouche-egout.png'//'../images/bouche-egout.png'
                                break;
                            case 'dechet_lac':
                                marker.icon.extraClasses = 'icon-dechet_lac'
                                marker.icon.iconImg = 'images/dechet-lac.png'
                                break;
                        }
                        marker.icon.type = 'extraMarker'
                        marker.icon.imgWidth = 32
                        marker.icon.imgHeight = 42
                        markers.push(marker)
                        $scope.addRadiusToMap(point);
                    })
                    return markers
                },
                addRadiusToMap: function (point) {
                    var shapes = [];
                    var lng = point.geometry.coordinates[0];
                    var lat = point.geometry.coordinates[1];
                    circle = {
                        type: "circle",
                        layer: 'circles',
                        dashArray: "7,10",
                        clickable: false,
                        radius: point.properties.actionRadius,
                        latlngs: {
                            lat: lat,
                            lng: lng
                        },
                        color: 'green',
                        weight: 2
                    }
                    $scope.paths["circle" + indexCircle] = circle;
                    indexCircle++;

                },
                layersVisibility: function () {
                    leafletData.getMap("leafletMap").then(function (map) {
                        var zoom = map.getZoom();

                        //circles visibility
                        if (zoom >= 15) {
                            $scope.layers.overlays.circles.visible = true;
                        } else {
                            $scope.layers.overlays.circles.visible = false;
                        }


                        ;
                    })
                },
            })

            $scope.$on('leafletDirectiveMarker.click', function (e, args) {
                StorageService.setActionPoint(args.leafletEvent.target.options.properties);
                StorageService.setActionId(args.leafletEvent.target.options.id);
                StorageService.setActionLat(args.leafletEvent.target.options.lat);
                StorageService.setActionLng(args.leafletEvent.target.options.lng);
                $state.go('actionDetail');
            });

            $scope.$on("leafletDirectiveMap.zoomend", function (ev, featureSelected, leafletEvent) {
                $scope.layersVisibility();
            })








            ActionPointService.getActionPoints(function (data) {
                leafletData.getMap().then(function (map) {
                    if (map._controlCorners.bottomleft.childElementCount === 0) {
                        L.control.locate({position: 'bottomleft', follow: true, locateOptions: {enableHighAccuracy: true}}).addTo(map);
                    }
                });
                $scope.markers = $scope.addMarkersToMap(data);

                SectorService.getSectors(function (data) {
                    $scope.addSectorsGeoJSONToMap(data)
                })

            })



            $rootScope.$on('user responce', function () {
                $scope.user = StorageService.user;
            })

            $rootScope.$on('new point available', function () {
                ActionPointService.getActionPoints(function (data) {
                    $scope.markers = $scope.addMarkersToMap(data);
                })
            })



        })

        .controller('actionController', function ($scope, StorageService, $state, geolocation, SocketService) {
            $scope.action = StorageService.actionPoint;
            $scope.user = StorageService.user;
            $scope.actionId = StorageService.actionId;
            $scope.sectors = StorageService.sectors;
            $scope.coordinates = {};
            $scope.sectorId;
            
            
            
            for (var i = 0; i < $scope.sectors.length ; i++) {
                for (var j = 0; j < $scope.sectors[i].properties.actionsPoint.length; j++) {
                    if ($scope.sectors[i].properties.actionsPoint[j] === $scope.actionId) {
                        $scope.sectorId = $scope.sectors[i].id;
                    }
                }
                
            }
            
            







            geolocation.getLocation().then(function (data) {
                $scope.coordinates.latitude = data.coords.latitude;
                $scope.coordinates.longitude = data.coords.longitude;
            })

//            $scope.isUserInCircle = function () {
//                
//               return geolib.isPointInCircle(
//                        {latitude: $scope.coordinates.latitude, longitude: $scope.coordinates.longitude},
//                        {latitude: StorageService.actionLat, longitude: StorageService.actionLng},
//                500
//                        )
//            }

            $scope.backToMap = function () {
                $state.go('map')
            }

            $scope.makeAction = function (actionId) {
                var data = {
                    id: actionId,
                    sector_id: $scope.sectorId,
                    position: $scope.coordinates
                };



//                SocketService.getSocket()
//                        .emit('make action point', data)


            }

        })