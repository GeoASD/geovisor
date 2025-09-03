importScripts('https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js');
onmessage = function (e) {
  const { userGeojson, layerData, layerName } = e.data;

  const result = {
    layerName: layerName,
    type: 'none', // Tipo de resultado: 'intersect' o 'none'
    distance_m: null, // Distancia en metros, si aplica
    area: null, // Área de la intersección, si aplica
    attributes: {} // Atributos de la geometría más cercana/intersectada
  };

  try {
    const userFeatures = userGeojson.features;
    const layerFeatures = layerData.features;

    for (const userFeature of userFeatures) {
      for (const layerFeature of layerFeatures) {
        // Verificar el tipo de geometría
        if (userFeature.geometry.type === "Point") {
          if (layerFeature.geometry.type === "Polygon" || layerFeature.geometry.type === "MultiPolygon") {
            // Punto contra Polígono
            if (turf.booleanPointInPolygon(userFeature.geometry, layerFeature.geometry)) {
              result.type = 'intersect';
              result.area = turf.area(layerFeature.geometry); // Área de la intersección
              result.attributes = { ...layerFeature.properties }; // Atributos del polígono
              break;
            }
          } else if (layerFeature.geometry.type === "Point") {
            // Punto contra Punto
            const distance = turf.distance(userFeature.geometry, layerFeature.geometry);
            if (distance < result.distance_m || result.distance_m === null) {
              result.distance_m = distance; // Distancia más corta entre los puntos
              result.attributes = { ...layerFeature.properties }; // Atributos del punto más cercano
            }
          }
        }

        if (userFeature.geometry.type === "Polygon" || userFeature.geometry.type === "MultiPolygon") {
          if (layerFeature.geometry.type === "Polygon" || layerFeature.geometry.type === "MultiPolygon") {
            // Polígono contra Polígono
            if (turf.booleanOverlap(userFeature.geometry, layerFeature.geometry)) {
              result.type = 'intersect';
              result.area = turf.area(userFeature.geometry); // Área de la intersección
              result.attributes = { ...layerFeature.properties }; // Atributos del polígono
              break;
            }
          } else if (layerFeature.geometry.type === "Point") {
            // Polígono contra Punto
            if (turf.booleanPointInPolygon(layerFeature.geometry, userFeature.geometry)) {
              result.type = 'intersect';
              result.area = turf.area(userFeature.geometry); // Área de la intersección
              result.attributes = { ...userFeature.properties }; // Atributos del polígono
              break;
            }
          } else if (layerFeature.geometry.type === "LineString" || layerFeature.geometry.type === "MultiLineString") {
            // Polígono contra Línea
            if (turf.booleanIntersects(userFeature.geometry, layerFeature.geometry)) {
              result.type = 'intersect';
              result.area = turf.area(userFeature.geometry); // Área de la intersección
              result.attributes = { ...layerFeature.properties }; // Atributos de la línea
              break;
            }
          }
        }

        if (userFeature.geometry.type === "LineString" || userFeature.geometry.type === "MultiLineString") {
          if (layerFeature.geometry.type === "Point") {
            // Línea contra Punto
            const distance = turf.pointToLineDistance(layerFeature.geometry, userFeature.geometry);
            if (distance < result.distance_m || result.distance_m === null) {
              result.distance_m = distance; // Distancia mínima entre la línea y el punto
              result.attributes = { ...layerFeature.properties }; // Atributos del punto más cercano
            }
          } else if (layerFeature.geometry.type === "Polygon" || layerFeature.geometry.type === "MultiPolygon") {
            // Línea contra Polígono
            if (turf.booleanIntersects(userFeature.geometry, layerFeature.geometry)) {
              result.type = 'intersect';
              result.area = turf.area(userFeature.geometry); // Área de la intersección
              result.attributes = { ...layerFeature.properties }; // Atributos del polígono
              break;
            }
          } else if (layerFeature.geometry.type === "LineString" || layerFeature.geometry.type === "MultiLineString") {
            // Línea contra Línea
            if (turf.booleanIntersects(userFeature.geometry, layerFeature.geometry)) {
              result.type = 'intersect';
              result.area = turf.area(userFeature.geometry); // Área de la intersección
              result.attributes = { ...layerFeature.properties }; // Atributos de la línea
              break;
            }
          }
        }
      }

      // Si encontramos intersección, salimos del ciclo
      if (result.type === 'intersect') {
        break;
      }
    }

  } catch (error) {
    console.error("Error procesando geometría:", error);
  }

  // Retornamos el resultado al hilo principal
  postMessage(result);
};
