//Creación de objeto mapa
var map = L.map("map").setView([-10.548704, -75.461643], 5);




//Controlador de capas mapas base
const controlBaseMaps = L.control({ position: 'topright' });
controlBaseMaps.onAdd = function (map) {
  return L.DomUtil.get('panel-mapas-base');
};
controlBaseMaps.addTo(map);



//Controlador de capas proyectos total
const controlProyectos = L.control({ position: 'topright' });
controlProyectos.onAdd = function (map) {
  return L.DomUtil.get('panel-proyectos');
};
controlProyectos.addTo(map);




//Controlador de capas nacionales (Servicios rest)
const controlCapasRest = L.control({ position: 'topright' });

controlCapasRest.onAdd = function (map) {
  return L.DomUtil.get('panel-capas-rest');
};

controlCapasRest.addTo(map);





var overlays = {};





//Enlazar mapas base
var osm_estandar = L.tileLayer(' http://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,				 
}).addTo(map);

var esriSatelite = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles © Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19
  }
);


//Creación diccionarios
var basemaps =	{
					"OpenStreetMap Standard" : osm_estandar,
					"Satelital (Esri)": esriSatelite,
					"Desactiva el mapa base" : L.layerGroup([]),					
				};

	
	
	
	



//Enlazar capas wfs
/*var proyectos_wfs 		= "http://192.168.1.11:8080/geoserver/proyectos_total/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=proyectos_total%3Aproyectos_totales&maxFeatures=50&outputFormat=application%2Fjson";
var proyectos_total 	= new L.GeoJSON.AJAX(proyectos_wfs,{
	onEachFeature : popup_proyectos
});*/






// Crear un icono personalizado para los puntos
var icono_bipdeclarado = L.icon({
  iconUrl: 'images/bip_declarado.png', // Ruta al icono
  iconSize: [20, 20], // Tamaño del icono
  iconAnchor: [10, 20], // Punto del icono que corresponde a la posición del marcador
  popupAnchor: [0, -20] // Desplazamiento del popup
});

var gifIcon = L.icon({
    iconUrl: 'images/point_azul.svg', // ejemplo: 'images/pulse.gif'
    iconSize: [32, 32], // ajusta según el tamaño del GIF
    iconAnchor: [16, 16], // el centro del icono será el punto exacto en el mapa
});

var proyectos_total = L.geoJSON(proyectos_total, {
    pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
            icon: gifIcon
        });
    },
    onEachFeature: popup_proyectos
}).addTo(map);

generarDashboard(proyectos_total);




// ----------------------------------------
// Función para crear el gráfico del dashboard
// ----------------------------------------

function generarDashboard(capa) {
	let porDepartamento = {};
	let porActividad = {};

	capa.eachLayer(function (layer) {
		const props = layer.feature.properties;

		let depto = props.Departamen;
		let actividad = props.Actividad;

		if (depto) {
			if (!porDepartamento[depto]) porDepartamento[depto] = 0;
			porDepartamento[depto]++;
		}

		if (actividad) {
			if (!porActividad[actividad]) porActividad[actividad] = 0;
			porActividad[actividad]++;
		}
	});

	// --- Gráfico de barras por Departamento ---
	const deptoEntries = Object.entries(porDepartamento).sort((a, b) => a[0].localeCompare(b[0]));
	const deptoLabels = deptoEntries.map(entry => entry[0]);
	const deptoData = deptoEntries.map(entry => entry[1]);

	const maxDepto = Math.max(...deptoData);
	const deptoColors = deptoData.map(count => {
		const alpha = 0.4 + 0.6 * (count / maxDepto);
		return `rgba(54, 162, 235, ${alpha.toFixed(2)})`;
	});

	const ctxBar = document.getElementById('dashboardBarChart').getContext('2d');
	new Chart(ctxBar, {
		type: 'bar',
		data: {
			labels: deptoLabels,
			datasets: [{
				label: 'N° de Proyectos',
				data: deptoData,
				backgroundColor: deptoColors,
				borderColor: 'rgba(54, 162, 235, 1)',
				borderWidth: 1
			}]
		},
		options: {
			responsive: true,
			indexAxis: 'x', // eje vertical (barras de pie a cabeza)
			scales: {
				y: {
					beginAtZero: true,
					title: {
						display: true,
						text: 'Proyectos'
					}
				},
				x: {
					ticks: {
						autoSkip: false,
						maxRotation: 45,
						minRotation: 0
					}
				}
			},
			plugins: {
				legend: { display: false },
				title: {
					display: false
				}
			}
		}
	});

	// --- Gráfico de donut por Actividad ---
	const actEntries = Object.entries(porActividad).sort((a, b) => a[0].localeCompare(b[0]));
	const actLabels = actEntries.map(entry => entry[0]);
	const actData = actEntries.map(entry => entry[1]);
	const actMax = Math.max(...actData);

	// Generar colores aleatorios distintos para cada actividad
	function getRandomColor(index) {
		const baseColors = [
			'#02e16d', '#fdfc0b', '#00525a', '#f9670c',
			'#ff0000','#9a6632', '#3a23d3', '#e2a4f6', 
			'#e800ff', '#06e4e1', '#8c0033'
		];
		return baseColors[index % baseColors.length];
	}

	const actColors = actLabels.map((_, index) => getRandomColor(index));

	const ctxDonut = document.getElementById('dashboardDoughnutChart').getContext('2d');
	new Chart(ctxDonut, {
		type: 'doughnut',
		data: {
			labels: actLabels,
			datasets: [{
				label: 'N° de Proyectos',
				data: actData,
				backgroundColor: actColors,
				borderColor: 'rgba(255,255,255,0.8)',
				borderWidth: 2
			}]
		},
		options: {
			responsive: true,
			plugins: {
				legend: {
					position: 'right'
				},
				title: {
					display: false
				}
			}
		}
	});
}









//Agregar control de coordenadas
L.control.coordinates({
	position : "bottomleft",
	decimal : 6,
	labelTemplateLat : "Latitud: {y}",
	labelTemplateLng : "Longitud: {x}",
	enableUserInput : true,
}).addTo(map);




//Agregar control de geocodificación
L.Control.geocoder({
	position: "topleft",
	placeholder: "Ingrese el proyecto...",
	errorMessage: "No se encontraron resultados"
});




//Agregar control de busqueda de atributos de una capa
var searchControl = new L.Control.Search({
						layer : proyectos_total,
						propertyName : "Proyecto",
						zoom : 12,
						collapsed : true,
						filterData: function(text, records) {
        					var results = {};
					        var searchText = text.toLowerCase();
					        for (var key in records) {
					            if (key.toLowerCase().indexOf(searchText) !== -1) {
									results[key] = records[key];
					            }
					        }
					        return results;
					    }
}).addTo(map);

document.addEventListener('mouseover', function (event) {
    const el = event.target.closest('.search-tip');
    if (el && !el.title) {
        el.title = el.textContent.trim();
    }
});




//Evento cuando se encuentre la busqueda
searchControl.on('search:locationfound', function(e){

	if(e.layer._popup){
		e.layer.openPopup();
	}
}).on('search:collapsed', function(e){
	proyectos_total.eachLayer(function(layer){
		proyectos_total.resetStyle(layer);
	});
});
map.get




//Agregar el control de busqueda al mapa
map.addControl(searchControl);




//Añadir SiderBar
var sidebar = L.control.sidebar({
	position 	: "left",
	autopan		: true,
	container	: "sidebar",
	//closeButton	: false
}).addTo(map);

sidebar.open("home");







// --- Funciones para estilos desde drawingInfo ---
function styleFromSymbol(symbol) {
    const rgba = arr => `rgba(${arr[0]},${arr[1]},${arr[2]},${arr[3]/255})`;
    const style = { color: '#333', weight: 1, opacity: 1, fill: false };

    if (symbol.type === 'esriSLS') {
        style.color = rgba(symbol.color);
        style.weight = symbol.width || 1;
        const dashStyles = {
            esriSLSDash: '5,5',
            esriSLSDot: '1,5',
            esriSLSDashDot: '5,5,1,5',
            esriSLSSolid: null
        };
        style.dashArray = dashStyles[symbol.style] || null;
    }
    else if (symbol.type === 'esriSFS') {
        style.fill = true;
        style.fillColor = rgba(symbol.color);
        style.fillOpacity = symbol.color[3] / 255;
        style.color = symbol.outline ? rgba(symbol.outline.color) : '#000';
        style.weight = symbol.outline ? symbol.outline.width : 1;
    }
    else if (symbol.type === 'esriSMS') {
        style.radius = symbol.size ? symbol.size / 2 : 5;
        style.color = rgba(symbol.outline?.color || [0,0,0,255]);
        style.fillColor = rgba(symbol.color);
        style.fillOpacity = symbol.color[3] / 255;
        style.weight = symbol.outline?.width || 1;
    }
    return style;
}

function parseArcgisDrawingInfo(drawingInfo) {
    const renderer = drawingInfo.renderer;
    if (renderer.type === 'simple') {
        return () => styleFromSymbol(renderer.symbol);
    }
    if (renderer.type === 'uniqueValue') {
        const field = renderer.field1;
        const styles = {};
        renderer.uniqueValueInfos.forEach(info => {
            styles[info.value] = styleFromSymbol(info.symbol);
        });
        return feature => styles[feature.properties[field]] || { color: '#ccc' };
    }
    if (renderer.type === 'classBreaks') {
        const field = renderer.field;
        const breaks = renderer.classBreakInfos.map(b => ({
            max: b.classMaxValue,
            style: styleFromSymbol(b.symbol)
        }));
        return feature => {
            const value = feature.properties[field];
            for (const b of breaks) {
                if (value <= b.max) return b.style;
            }
            return { color: '#ccc' };
        };
    }
    return () => ({ color: '#999' });
}

// Función para agregar capas con iconos opcionales
function addStyledFeatureLayer(url, map, nombreCapa, icono, estilo) {
  return fetch(`${url}?f=pjson`)
    .then(res => res.json())
    .then(meta => {
      const baseStyleFn = estilo || parseArcgisDrawingInfo(meta.drawingInfo);

      const layerOptions = {
        url: url,
        metadata: meta,
        _customOpacity: 1,
        _baseStyleFn: baseStyleFn
      };

      // Crear función de estilo
      const styleFn = function (feature) {
        const style = baseStyleFn(feature);
        const opacity = layerOptions._customOpacity ?? 1;
        return {
          ...style,
          opacity,
          fillOpacity: opacity
        };
      };

      layerOptions.style = styleFn;

      if (meta.geometryType === 'esriGeometryPoint') {
		  layerOptions.pointToLayer = function (feature, latlng) {
			if (icono) {
			  return L.marker(latlng, { icon: icono });
			}
			const style = styleFn(feature);
			return L.circleMarker(latlng, style);
		  };
		}

      const capa = L.esri.featureLayer(layerOptions);
      capa.metadata = meta;

      capa.bindPopup(function (evt) {
        const props = evt.feature.properties;
        let html = '<table>';
        for (const key in props) {
          html += `<tr><th>${key}</th><td>${props[key]}</td></tr>`;
        }
        html += '</table>';
        return html;
      });

      overlays[nombreCapa] = capa;

      return capa;
    });
}

// --- Lista de capas ArcGIS que quieres cargar ---
const capasRest = [
	{
        url: 'https://arcgis4.inei.gob.pe:6443/arcgis/rest/services/VISOR_DE_MAPAS/VISOR_DE_INDICADOR_GEOESPACIAL_A/MapServer/1',
        nombre: 'Centros poblados',
		minZoom: 12,
		estilo: estilo_ccpp
    },
    {
        url: 'https://geospatial.sernanp.gob.pe/arcgis_server/rest/services/sernanp_visor/sernanp_lineatiempo/MapServer/0',
        nombre: 'ANP de administración nacional'
    },
	{
        url: 'https://geospatial.sernanp.gob.pe/arcgis_server/rest/services/sernanp_visor/sernanp_lineatiempo/MapServer/2',
        nombre: 'Áreas de conservación regional'
    },
	{
        url: 'https://geospatial.sernanp.gob.pe/arcgis_server/rest/services/sernanp_visor/sernanp_lineatiempo/MapServer/3',
        nombre: 'Áreas de conservación privada'
    },
	{
        url: 'https://geospatial.sernanp.gob.pe/arcgis_server/rest/services/sernanp_visor/sernanp_overviewmap/MapServer/1',
        nombre: 'Zonas reservadas'
    },
	{
        url: 'https://geospatial.sernanp.gob.pe/arcgis_server/rest/services/gestion_de_anp/peru_sernanp_021401/MapServer/0',
        nombre: 'Zona de amortiguamiento'
    },
	{
        url: 'https://geospatial.sernanp.gob.pe/arcgis_server/rest/services/sernanp_peru/peru_minam_0008/MapServer/14',
        nombre: 'Sitios RAMSAR'
    },
	{
        url: 'https://sigda.cultura.gob.pe/sigda/rest/services/v_4/declarados_v4/MapServer/0',
        nombre: 'BIP declarado PCN',
		icon: icono_bipdeclarado
    },
	{
        url: 'https://sigda.cultura.gob.pe/sigda/rest/services/v_3/base/MapServer/0',
        nombre: 'BIP delimitado (Aprobado)',
		estilo: estilo_bipaprobado
    },
	{
        url: 'https://sigda.cultura.gob.pe/sigda/rest/services/v_4/pqn_v4/MapServer/0',
        nombre: 'Qhapaq Ñan'
    },
	{
        url: 'https://geo.serfor.gob.pe/geoservicios/rest/services/Visor/Inventario_Ecosistemas_Fragiles/MapServer/0',
        nombre: 'Ecosistemas frágiles'
    },
	{
        url: 'https://services8.arcgis.com/lY46ft0T5l70a6Yw/arcgis/rest/services/comunidad_campesina/FeatureServer/0',
        nombre: 'Comunidades campesinas',
		estilo: cccc
    },
	{
        url: 'https://services8.arcgis.com/lY46ft0T5l70a6Yw/arcgis/rest/services/Mapa_de_Comunidades__Actualizado_2025_WFL1/FeatureServer/4',
        nombre: 'Comunidades nativas'
    },
	
	
    // Puedes agregar más objetos con url y nombre
];





// --- Cargar las capas y agregarlas al control ---
Promise.all(capasRest.map(c => addStyledFeatureLayer(c.url, map, c.nombre, c.icon, c.estilo)))
  .then(capasAgregadas => {
    const capasZoomControl = [];

    capasAgregadas.forEach((capa, i) => {
      const conf = capasRest[i];
      if (typeof conf.minZoom === 'number') {
        capa._minZoom = conf.minZoom;
        capasZoomControl.push(capa);
      }
    });

    capasAgregadas.forEach((capa, i) => {
      const nombre = capasRest[i].nombre;
      overlays[nombre] = capa;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `chk-${nombre}`;
      checkbox.checked = false;

      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.style.display = 'block';
      label.style.marginTop = '4px';
      label.appendChild(checkbox);
      label.append(` ${nombre}`);

      const containerDiv = document.createElement('div');
      containerDiv.style.display = 'none';
      containerDiv.style.flexDirection = 'column';
      containerDiv.style.marginLeft = '20px';
      containerDiv.style.marginTop = '4px';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = 0;
      slider.max = 1;
      slider.step = 0.05;
      slider.value = 1;
      slider.style.width = '100px';
      slider.style.marginBottom = '4px';

      capa._customOpacity = 1;

      ['mousedown', 'mousemove', 'touchstart', 'touchmove'].forEach(evt =>
        slider.addEventListener(evt, e => e.stopPropagation())
      );

      slider.addEventListener('input', () => {
        const value = parseFloat(slider.value);
        capa._customOpacity = value;

        if (capa.setStyle) {
          capa.setStyle(f => {
            const baseStyle = capa._baseStyleFn ? capa._baseStyleFn(f) : {};
            return {
              ...baseStyle,
              opacity: value,
              fillOpacity: value
            };
          });
        }
      });

      containerDiv.appendChild(slider);

      // --- Leyendas manuales ---
      const leyendasManuales = {
        'BIP declarado PCN': {
          iconUrl: 'images/bip_declarado.png'
        },
        'BIP delimitado (Aprobado)': {
          color: '#042652',
          fillColor: '#0070ff',
          width: 20,
          height: 12
        },
        'Comunidades campesinas': {
          color: '#f2f2f2',
          fillColor: '#a70cce',
          width: 20,
          height: 12
        },
        'Ubicación referencial de proyectos': {
          iconUrl: 'images/point_azul.svg'
        },
        'Centros poblados': {
          items: [
            { label: 'Urbano', color: '#ff0016' },
            { label: 'Rural', color: '#00ff26' }
          ]
        }
      };

      if (leyendasManuales[nombre]) {
        const info = leyendasManuales[nombre];

        if (info.items && Array.isArray(info.items)) {
          info.items.forEach(subItem => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '6px';
            item.style.marginTop = '4px';

            const swatch = document.createElement('div');
            swatch.style.width = '12px';
            swatch.style.height = '12px';
            swatch.style.backgroundColor = subItem.color;
            swatch.style.border = '1px solid #000';
            swatch.style.borderRadius = '50%';

            const label = document.createElement('span');
            label.textContent = subItem.label;

            item.appendChild(swatch);
            item.appendChild(label);
            containerDiv.appendChild(item);
          });
        } else {
          const item = document.createElement('div');
          item.style.display = 'flex';
          item.style.alignItems = 'center';
          item.style.gap = '6px';
          item.style.marginTop = '4px';

          const swatch = document.createElement('div');
          swatch.style.width = `${info.width || 20}px`;
          swatch.style.height = `${info.height || 20}px`;

          if (info.iconUrl) {
            swatch.style.backgroundImage = `url(${info.iconUrl})`;
            swatch.style.backgroundSize = 'contain';
            swatch.style.backgroundRepeat = 'no-repeat';
            swatch.style.backgroundPosition = 'center';
          } else if (info.color) {
            swatch.style.backgroundColor = info.fillColor || info.color;
            swatch.style.border = '1px solid #000';
          }

          item.appendChild(swatch);
          if (info.label) {
            const lbl = document.createElement('span');
            lbl.textContent = info.label;
            item.appendChild(lbl);
          }

          containerDiv.appendChild(item);
        }
      }

      // --- Renderer automático desde ArcGIS ---
      const renderer = capa.metadata?.drawingInfo?.renderer;

      if (renderer && !leyendasManuales[nombre]) {
        const legendContainer = document.createElement('div');
        legendContainer.style.display = 'flex';
        legendContainer.style.flexDirection = 'column';
        legendContainer.style.gap = '2px';
        legendContainer.style.marginTop = '4px';

        const addLegendItem = (symbol, labelText) => {
          const item = document.createElement('div');
          item.style.display = 'flex';
          item.style.alignItems = 'center';
          item.style.gap = '6px';

          const swatch = document.createElement('div');
          swatch.style.width = '20px';
          swatch.style.height = '12px';
          swatch.style.border = '1px solid #000';

          if (symbol.url) {
            swatch.style.backgroundImage = `url(${symbol.url})`;
            swatch.style.backgroundSize = 'contain';
            swatch.style.backgroundRepeat = 'no-repeat';
            swatch.style.backgroundPosition = 'center';
          } else if (symbol.color) {
            const rgba = `rgba(${symbol.color[0]}, ${symbol.color[1]}, ${symbol.color[2]}, ${symbol.color[3] / 255})`;

            if (symbol.type === 'esriSLS') {
              swatch.style.height = '2px';
              swatch.style.backgroundColor = rgba;
              swatch.style.border = 'none';
              swatch.style.marginTop = '5px';
            } else if (symbol.type === 'esriSMS') {
              swatch.style.width = '12px';
              swatch.style.height = '12px';
              swatch.style.backgroundColor = rgba;
              swatch.style.borderRadius = '50%';
            } else {
              swatch.style.backgroundColor = rgba;
            }
          }

          const label = document.createElement('span');
          label.textContent = labelText || '';
          item.appendChild(swatch);
          item.appendChild(label);

          legendContainer.appendChild(item);
        };

        if (renderer.type === 'simple' && renderer.symbol) {
          addLegendItem(renderer.symbol, renderer.label || '');
        }

        if (renderer.type === 'uniqueValue' && Array.isArray(renderer.uniqueValueInfos)) {
          renderer.uniqueValueInfos.forEach(info => {
            addLegendItem(info.symbol, info.label || info.value);
          });
        }

        if (renderer.type === 'classBreaks' && Array.isArray(renderer.classBreakInfos)) {
          renderer.classBreakInfos.forEach(info => {
            addLegendItem(info.symbol, info.label || `${info.classMinValue} - ${info.classMaxValue}`);
          });
        }

        containerDiv.appendChild(legendContainer);
      }

      // --- Evento del checkbox ---
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          map.addLayer(capa);
          containerDiv.style.display = 'flex';
        } else {
          map.removeLayer(capa);
          containerDiv.style.display = 'none';
        }
      });

      // Añadir al panel
      const panelContent = document.getElementById('panel-capas-rest-content');
      panelContent.appendChild(label);
      panelContent.appendChild(containerDiv);

      // Estilo dinámico inicial
      capa.on('load', () => {
        const value = capa._customOpacity ?? 1;
        if (capa.setStyle) {
          capa.setStyle(f => {
            const baseStyle = capa._baseStyleFn ? capa._baseStyleFn(f) : {};
            return {
              ...baseStyle,
              opacity: value,
              fillOpacity: value
            };
          });
        }
      });

      // ✅ Guardamos el checkbox para actualizarlo con el zoom
      capa._checkbox = checkbox;

      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          map.addLayer(capa);
          containerDiv.style.display = 'flex';
        } else {
          map.removeLayer(capa);
          containerDiv.style.display = 'none';
        }
      });

      document.getElementById('panel-capas-rest-content').appendChild(label);
      document.getElementById('panel-capas-rest-content').appendChild(containerDiv);
    });

    map.on('zoomend', () => {
	  const zoom = map.getZoom();

	  capasZoomControl.forEach(capa => {
		const nombre = Object.keys(overlays).find(key => overlays[key] === capa);
		const checkbox = document.getElementById(`chk-${nombre}`);
		if (!checkbox) return;

		if (zoom >= capa._minZoom) {
		  checkbox.disabled = false;

		  // ✅ Si el usuario lo había activado antes, vuelve a mostrar la capa
		  if (checkbox.checked && !map.hasLayer(capa)) {
			map.addLayer(capa);
			const contenedor = checkbox.parentElement.nextSibling;
			if (contenedor) contenedor.style.display = 'flex';
		  }

		} else {
		  // ❌ Solo oculta la capa, pero NO desactiva el checkbox
		  if (map.hasLayer(capa)) {
			map.removeLayer(capa);
			const contenedor = checkbox.parentElement.nextSibling;
			if (contenedor) contenedor.style.display = 'none';
		  }
		  checkbox.disabled = true;
		}
	  });
	});

    map.fire('zoomend'); // activamos el control desde el inicio

  }); // fin del .then





// Panel contenedor de capas nacionales (Servicios rest)

const panelRestContent = document.getElementById('panel-capas-rest-content');

map.scrollWheelZoom.enable();

panelRestContent.addEventListener('mouseenter', () => {
  map.scrollWheelZoom.disable();
});

panelRestContent.addEventListener('mouseleave', () => {
  map.scrollWheelZoom.enable();
});


(function makePanelDraggable() {
  const panel = document.getElementById('panel-capas-rest');
  const header = document.getElementById('panel-capas-rest-header');
  let offsetX = 0, offsetY = 0;
  let isDragging = false;

  header.addEventListener('mousedown', (e) => {
  e.preventDefault();       // evitar selección de texto y comportamiento por defecto
  e.stopPropagation();      // detener propagación para Leaflet no "capturar" este evento

  isDragging = true;
  offsetX = e.clientX - panel.offsetLeft;
  offsetY = e.clientY - panel.offsetTop;
  document.body.style.userSelect = 'none'; // evitar selección de texto mientras arrastras
});

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panel.style.left = `${e.clientX - offsetX}px`;
    panel.style.top = `${e.clientY - offsetY}px`;
    panel.style.right = 'auto'; // evitar conflictos si usaste right
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = '';
  });
})();


(function makePanelCollapsable() {
  const header = document.getElementById('panel-capas-rest-header');
  const content = document.getElementById('panel-capas-rest-content');

  let isCollapsed = true; // <-- colapsado por defecto

  // Aplica el estado inicial colapsado
  content.style.display = 'none';
  header.innerHTML = `Capas Nacionales <span style="margin-left: 120px;">▼</span>`;

  header.style.cursor = 'pointer';

  header.addEventListener('click', () => {
    isCollapsed = !isCollapsed;

    if (isCollapsed) {
      content.style.display = 'none';
      header.innerHTML = `Capas Nacionales <span style="margin-left: 120px;">▼</span>`;
    } else {
      content.style.display = 'block';
      header.innerHTML = `Capas Nacionales <span style="margin-left: 120px;">▲</span>`;
    }
  });
})();






// Lógica de mapas base
const panelBase = document.getElementById('panel-mapas-base-content');

Object.entries(basemaps).forEach(([nombre, capa]) => {
  const checkbox = document.createElement('input');
  checkbox.type = 'radio';
  checkbox.name = 'baseMap';
  checkbox.value = nombre;
  checkbox.checked = map.hasLayer(capa);

  checkbox.addEventListener('change', () => {
    Object.values(basemaps).forEach((layer) => map.removeLayer(layer));
    map.addLayer(capa);
  });

  const label = document.createElement('label');
  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(' ' + nombre));
  panelBase.appendChild(label);
  panelBase.appendChild(document.createElement('br'));
});



// Lógica de panel de proyectos
const panelProy = document.getElementById('panel-proyectos-content');

const checkboxProyectos = document.createElement('input');
checkboxProyectos.type = 'checkbox';
checkboxProyectos.checked = true;
checkboxProyectos.id = 'chk-proyectos-total';

const labelProy = document.createElement('label');
labelProy.htmlFor = checkboxProyectos.id;
labelProy.appendChild(checkboxProyectos);
labelProy.appendChild(document.createTextNode(' Ubicación referencial de proyectos'));

// Crear contenedor para la leyenda
const leyendaProyectos = document.createElement('div');
leyendaProyectos.style.display = 'flex';
leyendaProyectos.style.alignItems = 'center';
leyendaProyectos.style.marginLeft = '10px'; // indentar la leyenda un poco
leyendaProyectos.style.marginTop = '-10px';

// Crear ícono para la leyenda
const iconoLeyenda = document.createElement('div');
iconoLeyenda.style.width = '40px';
iconoLeyenda.style.height = '40px';
iconoLeyenda.style.backgroundImage = 'url(images/point_azul.svg)'; // usa el mismo icono que en leyendasManuales
iconoLeyenda.style.backgroundSize = 'contain';
iconoLeyenda.style.backgroundRepeat = 'no-repeat';
iconoLeyenda.style.backgroundPosition = 'center';

// Texto de la leyenda (opcional)
const textoLeyenda = document.createElement('span');

// Agregar icono y texto al contenedor de leyenda
leyendaProyectos.appendChild(iconoLeyenda);
leyendaProyectos.appendChild(textoLeyenda);

// Insertar en el panel
panelProy.appendChild(labelProy);
panelProy.appendChild(leyendaProyectos);

checkboxProyectos.addEventListener('change', () => {
  if (checkboxProyectos.checked) {
    map.addLayer(proyectos_total);
    leyendaProyectos.style.display = 'flex';
  } else {
    map.removeLayer(proyectos_total);
    leyendaProyectos.style.display = 'none';
  }
});







document.querySelectorAll('.draggable-panel').forEach(panel => {
  const header = panel.querySelector('div[id$="-header"]');
  const content = panel.querySelector('div[id$="-content"]');
  

// Saltar si ya tiene comportamiento personalizado
  if (panel.id === 'panel-capas-rest') return;

  header.style.cursor = 'pointer';
  header.addEventListener('click', () => {
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
  });
});




// Hace los paneles colapsables
function PanelColapsable(panelId, tituloBase, flechaMarginLeft = '20px') {
  const header = document.getElementById(`${panelId}-header`);
  const content = document.getElementById(`${panelId}-content`);
  let colapsado = false;

  function actualizarHeader() {
    header.innerHTML = `${tituloBase} <span style="margin-left: ${flechaMarginLeft};">${colapsado ? '▼' : '▲'}</span>`;
  }

  actualizarHeader();
  header.style.cursor = 'pointer';

  header.addEventListener('click', (e) => {
    e.stopPropagation(); // evita zoom en el mapa si haces doble clic
    colapsado = !colapsado;
    content.style.display = colapsado ? 'none' : 'block';
    actualizarHeader();
  });
}


PanelColapsable('panel-proyectos', 'Proyectos', '164px' );
PanelColapsable('panel-mapas-base', 'Mapas Base', '153px' );




// Evita hacer zoom al mapa al momento de hacer doble clik
['panel-mapas-base', 'panel-proyectos', 'panel-capas-rest'].forEach(id => {
  const header = document.getElementById(id);
  ['click', 'mousedown', 'dblclick'].forEach(eventType => {
    header.addEventListener(eventType, e => e.stopPropagation());
  });
});



// Obtener los contenidos de los paneles
const panelBaseContent = document.getElementById('panel-mapas-base-content');
const panelProyectosContent = document.getElementById('panel-proyectos-content');

// Aplicar evento para desactivar/activar zoom en cada uno
[panelBaseContent, panelProyectosContent].forEach(panel => {
  panel.addEventListener('mouseenter', () => {
    map.scrollWheelZoom.disable();
  });

  panel.addEventListener('mouseleave', () => {
    map.scrollWheelZoom.enable();
  });
});

















async function fileToGeoJSON(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'geojson' || ext === 'json') {
    const text = await file.text();
    return JSON.parse(text);

  } else if (ext === 'zip') {
    return await shp(file);

  } else if (ext === 'kml' || ext === 'kmz') {
    if (ext === 'kml') {
      const text = await file.text();
      const parser = new DOMParser();
      const kmlDom = parser.parseFromString(text, 'text/xml');
      return toGeoJSON.kml(kmlDom);

    } else if (ext === 'kmz') {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const kmlFile = zip.file(/.kml$/i)[0];
      if (!kmlFile) throw new Error("No se encontró archivo KML dentro del KMZ");
      const kmlText = await kmlFile.async('text');
      const parser = new DOMParser();
      const kmlDom = parser.parseFromString(kmlText, 'text/xml');
      return toGeoJSON.kml(kmlDom);
    }

  } else if (ext === 'xlsx' || ext === 'xls') {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const features = jsonData.map(row => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(row.lon || row.Lon || row.x || row.X), parseFloat(row.lat || row.Lat || row.y || row.Y)]
      },
      properties: row
    }));

    return {
      type: 'FeatureCollection',
      features
    };

  } else {
    throw new Error('Formato de archivo no soportado');
  }
}











































document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('analysis-file-input');
  const runBtn = document.getElementById('btn-run-analysis');
  const resultsDiv = document.getElementById('analysis-results');

  let loadedFiles = [];




// ==== 1. UI: Sección para seleccionar capas a analizar ====
	const analysisLayerSelector = document.createElement('div');
	analysisLayerSelector.id = 'analysis-layer-selector';
	analysisLayerSelector.style.marginTop = '10px';
	analysisLayerSelector.innerHTML = '<h4>Selecciona capas para el análisis:</h4>';

	capasRest.forEach((c, idx) => {
	  const checkbox = document.createElement('input');
	  checkbox.type = 'checkbox';
	  checkbox.id = `analysis-layer-${idx}`;
	  checkbox.dataset.index = idx;

	  const label = document.createElement('label');
	  label.htmlFor = checkbox.id;
	  label.textContent = ` ${c.nombre}`;

	  const container = document.createElement('div');
	  container.append(checkbox, label);
	  analysisLayerSelector.appendChild(container);
	});

	// Insertamos la UI justo antes del botón "Ejecutar Análisis"
	resultsDiv.parentNode.insertBefore(analysisLayerSelector, runBtn);




  // Cuando se seleccionan archivos
  fileInput.addEventListener('change', (e) => {
    loadedFiles = Array.from(e.target.files);
    if (loadedFiles.length > 0) {
      runBtn.disabled = false;
      resultsDiv.innerHTML = `<p>${loadedFiles.length} archivo(s) cargado(s)</p>`;
    } else {
      runBtn.disabled = true;
      resultsDiv.innerHTML = '';
    }
  });


    // Al hacer click en ejecutar análisis
	runBtn.addEventListener('click', async () => {
	  resultsDiv.innerHTML = '<p>Ejecutando análisis espacial...</p>';
	  const file = loadedFiles[0];
	  if (!file) return resultsDiv.innerHTML = '<p>No se cargó archivo.</p>';

	  let userGeojson;
	  try {
		userGeojson = await fileToGeoJSON(file);
	  } catch (e) {
		return resultsDiv.innerHTML = `<p>Error al procesar el archivo: ${e.message}</p>`;
	  }

	  const selectedLayers = Array.from(document.querySelectorAll('#analysis-layer-selector input:checked'))
		.map(cb => parseInt(cb.dataset.index));

	  if (selectedLayers.length === 0) {
		resultsDiv.innerHTML = '<p>Selecciona al menos una capa.</p>';
		return;
	  }

	  resultsDiv.innerHTML = '<h4>Resultados del análisis:</h4>';

	  // Creamos el worker aquí para cada ejecución
	  const worker = new Worker('js/worker.js');

	  const promises = selectedLayers.map(async idx => {
		const cfg = capasRest[idx];

		// Manejo de error en fetch:
		try {
		  const url = `${cfg.url}/query?where=1=1&outFields=*&f=geojson`;
		  const resp = await fetch(url);

		  if (!resp.ok) throw new Error(`Error: ${resp.statusText}`);

		  const layerData = await resp.json();

		  return new Promise(resolve => {
			worker.postMessage({ userGeojson, layerData, layerName: cfg.nombre });
			worker.onmessage = e => resolve(e.data);
		  });

		} catch (error) {
		  resultsDiv.innerHTML += `<div style="color:red;"><strong>${cfg.nombre}:</strong> ${error.message}</div>`;
		  return null;
		}
	  });

	  const results = await Promise.all(promises);

	  worker.terminate();

	  results.filter(r => r !== null).forEach(({ layerName, result }) => {
		if (result.type === 'intersect') {
		  resultsDiv.innerHTML += `
			<strong>${layerName}</strong>
			<div style="border:1px solid green; padding:8px; margin-bottom:8px;">
			  Superposición encontrada.<br>
			  Área: ${result.area.toFixed(2)} m²<br>
			  Atributos:<br>
			  <ul>${
				Object.entries(result.attributes)
				  .slice(0, 5)
				  .map(([k, v]) => `<li>${k}: ${v}</li>`)
				  .join('')
			  }</ul>
			</div>`;
		} else {
		  resultsDiv.innerHTML += `
			<strong>${layerName}</strong>
			<div style="border:1px solid red; padding:8px; margin-bottom:8px;">
			  No hay superposición.<br>
			  Distancia mínima: ${result.distance_m.toFixed(2)} m<br>
			  Atributos del más cercano:<br>
			  <ul>${
				Object.entries(result.attributes)
				  .slice(0, 5)
				  .map(([k, v]) => `<li>${k}: ${v}</li>`)
				  .join('')
			  }</ul>
			</div>`;
		}
	  });
	});
});
