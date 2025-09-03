// Crear función popup
function popup_proyectos(feature, layer){
	if(feature.properties && feature.properties.Proyecto){
		var popupcontent =
							"<br>"+"<b>Proyecto: </b>" + feature.properties.Proyecto +
							"<br>"+"<b>Código: </b>" + feature.properties.Código +
							"<br>"+"<b>Sector: </b>" + feature.properties.Sector +
							"<br>"+"<b>Tipo de servicio: </b>" + feature.properties.Tipo_de_Se +
							"<br>"+"<b>Departamento: </b>" + feature.properties.Departamen +
							"<br>"+"<b>Provincia: </b>" + feature.properties.Provincia +
							"<br>"+"<b>Distrito: </b>" + feature.properties.Distrito +
							"<br>"+"<b>Información disponible: </b>"+ feature.properties.Informaci;
							
		layer.bindPopup(popupcontent,{
			className: "popup"
		});
	}
};



function bindPopupToLayer(layer) {
  layer.bindPopup(function (evt) {
    const props = evt.feature.properties;
    let html = '<table>';
    for (const key in props) {
      html += `<tr><th>${key}</th><td>${props[key]}</td></tr>`;
    }
    html += '</table>';
    return html;
  });
}

