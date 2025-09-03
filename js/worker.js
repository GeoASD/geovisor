importScripts('https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js');

onmessage = function (e) {
  const { userGeojson, layerData, layerName } = e.data;

  let foundIntersection = false;
  let bestMatch = null;
  let minDistance = Infinity;

  for (const userFeature of userGeojson.features) {
    for (const layerFeature of layerData.features) {
      try {
        const intersect = turf.booleanIntersects(userFeature, layerFeature);

        if (intersect) {
          foundIntersection = true;

          const intersection = turf.intersect(userFeature, layerFeature);

          let area = 0;
          if (intersection && (intersection.geometry.type === 'Polygon' || intersection.geometry.type === 'MultiPolygon')) {
            area = turf.area(intersection);
          }

          postMessage({
            layerName,
            result: {
              type: 'intersect',
              area,
              attributes: layerFeature.properties
            }
          });
          return; // salimos temprano, ya que encontramos intersección
        } else {
          // Si no hay intersección, calculamos distancia mínima
          const dist = turf.distance(
            turf.centroid(userFeature),
            turf.centroid(layerFeature),
            { units: 'meters' }
          );

          if (dist < minDistance) {
            minDistance = dist;
            bestMatch = layerFeature;
          }
        }
      } catch (err) {
        console.warn(`Error procesando geometría:`, err);
      }
    }
  }

  if (!foundIntersection && bestMatch) {
    postMessage({
      layerName,
      result: {
        type: 'none',
        distance_m: minDistance,
        attributes: bestMatch.properties || {}
      }
    });
  } else if (!foundIntersection) {
    postMessage({
      layerName,
      result: {
        type: 'none',
        distance_m: null,
        attributes: {}
      }
    });
  }
};
