//Crear estilos
var proyectos_estilo = {
	color: "purple",
	weight:1,
	fillOpacity: 0.4
};



function estilo_bipaprobado(feature) {
  return {
    color: '#042652',       
    weight: 1,              
    fill: true,
    fillColor: '#0070ff',   
    fillOpacity: 0.5       
  };
}


function cccc(feature) {
  return {
    color: '#f2f2f2',       
    weight: 1,              
    fill: true,
    fillColor: '#a70cce',   
    fillOpacity: 0.5       
  };
}


function estilo_ccpp(feature) {
  const area = feature.properties.AREA;
  return {
    radius: 5,
    color: '#ffffff',
    weight: 0.5,
    fillColor: area == 1 ? '#ff0016' : '#00ff26',
    fillOpacity: 0.8,
  };
}