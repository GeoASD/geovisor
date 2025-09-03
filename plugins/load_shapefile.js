
var shapefileLayer; // Variable para almacenar la capa shapefile

// Aquí inicia el código para el input
function handleFileSelect(event) { // Maneja la selección del archivo
    var input = document.getElementById('shapefile-input'); // Obtiene el elemento de entrada del archivo
    var file = input.files[0]; // Obtiene el archivo seleccionado
    
    if (file) { // Verifica si se seleccionó un archivo
        var reader = new FileReader(); // Crea una nueva instancia de FileReader
        reader.onload = function(event) { // Define la función que se ejecuta cuando se carga el archivo
            var data = event.target.result; // Obtiene los datos del archivo
            convertToGeoJSON(data); // Convierte los datos a GeoJSON
        };
        reader.readAsArrayBuffer(file); // Lee el archivo como un ArrayBuffer
    } else {
        alert('Por favor selecciona un archivo shapefile en formato zip para cargar.'); // Muestra una alerta si no se seleccionó un archivo
    }
}

// Convierte el archivo a GeoJSON
function convertToGeoJSON(data) { // Convierte los datos del shapefile a GeoJSON
    shp(data).then(function(geojson) { // Utiliza la biblioteca Shapefile JS para convertir los datos
        addShapefileLayerToMap(geojson); // Añade la capa GeoJSON al mapa
    });
}

// Añade la capa shapefile al mapa
function addShapefileLayerToMap(geojson) { // Añade la capa GeoJSON al mapa
    shapefileLayer = L.geoJSON(geojson, { // Crea una nueva capa GeoJSON
        onEachFeature: function(feature, layer) { // Define una función para cada feature
            var popupContent = formatPopupContent(feature.properties); // Formatea el contenido del popup
            layer.bindPopup(popupContent); // Asocia el popup al layer
        }
    });
}

// Formatea el contenido del popup
function formatPopupContent(properties) { // Formatea las propiedades del feature para mostrarlas en el popup
    return Object.entries(properties) // Obtiene las entradas de las propiedades
        .map(function(entry) { // Mapea cada entrada a una cadena formateada
            return '<b>' + entry[0] + ':</b> ' + entry[1]; // Devuelve la cadena formateada
        })
        .join('<br>'); // Une todas las cadenas con un salto de línea
}

// Aquí inicia el código para el botón mostrar shapefile
function showShapefile() { // Muestra el shapefile en el mapa
    if (shapefileLayer) { // Verifica si hay una capa shapefile cargada
        shapefileLayer.addTo(window.map); // Añade la capa al mapa
        window.map.fitBounds(shapefileLayer.getBounds()); // Ajusta la vista para mostrar la capa completa
    } else {
        alert('Por favor, primero carga un archivo shapefile.'); // Muestra una alerta si no hay una capa cargada
    }
}

// Aquí inicia el código para el botón borrar shapefile
function clearShapefile() { // Borra el shapefile del mapa
    if (shapefileLayer) { // Verifica si hay una capa shapefile cargada
        window.map.removeLayer(shapefileLayer); // Elimina la capa del mapa
        shapefileLayer = null; // Resetea la variable shapefileLayer
    } else {
        alert('No hay shapefile cargado para borrar.'); // Muestra una alerta si no hay una capa cargada
    }
}

// Asigna los eventos a los elementos
document.getElementById('shapefile-input').addEventListener('change', handleFileSelect); // Asigna el evento de cambio al input
document.getElementById('show-button').addEventListener('click', showShapefile); // Asigna el evento de click al botón de mostrar
document.getElementById('clear-button').addEventListener('click', clearShapefile); // Asigna el evento de click al botón de borrar
