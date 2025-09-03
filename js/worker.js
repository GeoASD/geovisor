// worker.js

importScripts('https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js');

onmessage = function (e) {
  const { userGeojson, layerData, layerName } = e.data;

  let result = {
    layerName,
    type: 'none',
    area: 0,
    attributes: {},
    distance_m: null,
  };

  try {
    const studyArea = userGeojson.features[0]; // Usamos solo la primera geometría
    const bboxStudy = turf.bbox(studyArea);
    const bboxStudyPoly = turf.bboxPolygon(bboxStudy);

    let closest = null;
    let minDistance = Infinity;

    for (const feat of layerData.features) {
      const bboxFeat = turf.bbox(feat);
      const bboxFeatPoly = turf.bboxPolygon(bboxFeat);

      // Filtrado rápido por bounding box
      if (turf.booleanDisjoint(bboxStudyPoly, bboxFeatPoly)) continue;

      if (turf.booleanIntersects(studyArea, feat)) {
        const intersection = turf.intersect(studyArea, feat);

        if (intersection) {
          const areaIntersection = turf.area(intersection);

          result = {
            layerName,
            type: 'intersect',
            area: areaIntersection,
            attributes: feat.properties,
          };

          postMessage({ layerName, result });
          return; // Salimos temprano si ya hay intersección
        }
      }

      // Si no hay intersección, calculamos distancia
      const distance = turf.distance(
        turf.center(studyArea),
        turf.center(feat),
        { units: 'meters' }
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = feat;
      }
    }

    if (closest) {
      result = {
        layerName,
        type: 'no-intersect',
        distance_m: minDistance,
        attributes: closest.properties,
      };
    }

    postMessage({ layerName, result });
  } catch (err) {
    postMessage({ layerName, result: { error: err.message } });
  }
};
