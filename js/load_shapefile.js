let userLayer;  // Capa cargada por el usuario

function dmsToDecimal(input) {
  if (typeof input === 'number') return input;

  input = input.replace(/[“”]/g, '"'); // Reemplaza comillas tipográficas
  const dmsRegex = /(-?\d+)[^\d]+(\d+)[^\d]+(\d+(?:\.\d+)?)(?:[^\w]*(N|S|E|W|O))?/i;
  const match = String(input).trim().match(dmsRegex);
  if (!match) return NaN;

  let degrees = parseFloat(match[1]);
  const minutes = parseFloat(match[2]);
  const seconds = parseFloat(match[3]);
  let direction = match[4]?.toUpperCase();

  if (direction === 'O') direction = 'W';

  let decimal = Math.abs(degrees) + minutes / 60 + seconds / 3600;
  if (degrees < 0) decimal *= -1;
  if (direction === 'S' || direction === 'W') decimal *= -1;

  return decimal;
}




function handleFileSelect() {
  const input = document.getElementById('shapefile-input');
  const file = input.files[0];
  if (!file) return alert('Selecciona un archivo válido (.zip, .kml, .kmz, .csv, .xlsx, .xls).');

  const ext = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();

  if (ext === 'zip') {
    reader.onload = e => shp(e.target.result).then(addUserLayerToMap)
      .catch(err => alert('Error procesando ZIP: ' + err));
    reader.readAsArrayBuffer(file);

  } else if (ext === 'kml') {
    reader.onload = e => {
      const xml = new DOMParser().parseFromString(e.target.result, 'text/xml');
      const geojson = window.toGeoJSON.kml(xml);
      addUserLayerToMap(geojson);
    };
    reader.readAsText(file);

  } else if (ext === 'kmz') {
    reader.onload = async e => {
      const zip = await JSZip.loadAsync(e.target.result);
      const kmlName = Object.keys(zip.files).find(n => n.endsWith('.kml'));
      if (!kmlName) return alert('El KMZ no contiene un archivo KML.');
      const kmlText = await zip.files[kmlName].async('string');
      const xml = new DOMParser().parseFromString(kmlText, 'text/xml');
      const geojson = window.toGeoJSON.kml(xml);
      addUserLayerToMap(geojson);
    };
    reader.readAsArrayBuffer(file);

  } else if (ext === 'csv') {
	  reader.onload = e => {
		Papa.parse(e.target.result, {
		  header: true,
		  dynamicTyping: true,
		  complete: results => {
			const features = results.data.map(r => {
			  let lat = r.lat ?? r.Lat ?? r.latitud ?? r.Latitud ?? null;
			  let lng = r.long ?? r.Long ?? r.longitud ?? r.Longitud ?? r.lng ?? r.Lng ?? null;
			  
			  if ((lat != null && lng != null) && (isNaN(lat) || isNaN(lng))) {
				  lat = dmsToDecimal(lat);
				  lng = dmsToDecimal(lng);
				}

			  // Si no hay lat/lon, intenta convertir desde UTM
			  const este = r.este ?? r.Este ?? r.x ?? r.X;
			  const norte = r.norte ?? r.Norte ?? r.y ?? r.Y;
			  const zona = r.zona ?? r.Zona ?? null;
			  const hemisferio = r.hemisferio ?? r.Hemisferio ?? 'S'; // Asume Norte si no se indica

			  if ((lat == null || lng == null) && este && norte && zona) {
				try {
				  const utmProj = `+proj=utm +zone=${zona} +datum=WGS84 +units=m +no_defs${hemisferio.toUpperCase() === 'S' ? ' +south' : ''}`;
				  const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';
				  const [lonConverted, latConverted] = proj4(utmProj, wgs84, [parseFloat(este), parseFloat(norte)]);
				  lat = latConverted;
				  lng = lonConverted;
				} catch (err) {
				  console.error('Error convirtiendo coordenadas UTM:', err);
				}
			  }

			  return lat != null && lng != null && !isNaN(lat) && !isNaN(lng)
				? { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: r }
				: null;
			}).filter(f => f);
			addUserLayerToMap({ type: 'FeatureCollection', features });
		  },
		  error: err => alert('Error al procesar CSV: ' + err)
		});
	  };
	  reader.readAsText(file);
	  
  } else if (ext === 'xlsx' || ext === 'xls') {
	  reader.onload = e => {
		const data = new Uint8Array(e.target.result);
		const workbook = XLSX.read(data, { type: 'array' });
		const sheet = workbook.Sheets[workbook.SheetNames[0]];
		const json = XLSX.utils.sheet_to_json(sheet);

		const features = json.map(r => {
		  let lat = r.lat ?? r.Lat ?? r.latitud ?? r.Latitud ?? null;
		  let lng = r.long ?? r.Long ?? r.longitud ?? r.Longitud ?? r.lng ?? r.Lng ?? null;
		  
		  if ((lat != null && lng != null) && (isNaN(lat) || isNaN(lng))) {
			  lat = dmsToDecimal(lat);
			  lng = dmsToDecimal(lng);
			}

		  const este = r.este ?? r.Este ?? r.x ?? r.X;
		  const norte = r.norte ?? r.Norte ?? r.y ?? r.Y;
		  const zona = r.zona ?? r.Zona ?? null;
		  const hemisferio = r.hemisferio ?? r.Hemisferio ?? 'S';

		  if ((lat == null || lng == null) && este && norte && zona) {
			try {
			  const utmProj = `+proj=utm +zone=${zona} +datum=WGS84 +units=m +no_defs${hemisferio.toUpperCase() === 'S' ? ' +south' : ''}`;
			  const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';
			  const [lonConverted, latConverted] = proj4(utmProj, wgs84, [parseFloat(este), parseFloat(norte)]);
			  lat = latConverted;
			  lng = lonConverted;
			} catch (err) {
			  console.error('Error convirtiendo coordenadas UTM:', err);
			}
		  }

		  return lat != null && lng != null && !isNaN(lat) && !isNaN(lng)
			? { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: r }
			: null;
		}).filter(f => f);

		addUserLayerToMap({ type: 'FeatureCollection', features });
	  };
	  reader.readAsArrayBuffer(file);

  } else {
    alert('Formato no soportado.');
  }
}

function addUserLayerToMap(geojson) {
  // Crear el pane personalizado solo una vez
  if (!map.getPane('user-upload')) {
    map.createPane('user-upload');
    map.getPane('user-upload').style.zIndex = 10000; // Pon un número alto
  }

  if (userLayer) map.removeLayer(userLayer);

  userLayer = L.geoJSON(geojson, {
    pane: 'user-upload', // Aquí asignas el pane personalizado

    onEachFeature: (f, layer) => {
      const html = Object.entries(f.properties || {}).map(([k, v]) => `<b>${k}:</b> ${v}`).join('<br>');
      layer.bindPopup(html);
    },

    pointToLayer: (f, latlng) => L.circleMarker(latlng, {
      pane: 'user-upload', // ¡También aquí!
      radius: 6,
      fillColor: '#424242',
      color: '#000000',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    }),

    style: {
      color: '#000000',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.3
    }
  }).addTo(map);

  userLayer.bringToFront();
  if (userLayer.getBounds) map.fitBounds(userLayer.getBounds());
}

function clearUserLayer() {
  if (userLayer) {
    map.removeLayer(userLayer);
    userLayer = null;
  }
}

// Eventos
document.getElementById('shapefile-input').addEventListener('change', handleFileSelect);
document.getElementById('show-button').addEventListener('click', () => {
  if (userLayer) {
    userLayer.addTo(map);
    map.fitBounds(userLayer.getBounds());
  } else {
    alert('Primero carga un archivo.');
  }
});
document.getElementById('clear-button').addEventListener('click', clearUserLayer);


