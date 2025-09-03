//Función para agregar tooltip
function tooltip_cproyec(feature, layer){
	if(feature.properties && feature.properties.Layer){
		var tooltipcontent = "<b>Nombre: </b>" + feature.properties.Layer;
		layer.bindTooltip(tooltipcontent, {
		permanent : false,
		direction : "top",
		className : "tooltip"
		});
	}
};