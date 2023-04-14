import wixWindow from 'wix-window';

$w.onReady(function () {
	const shipmentInfo = wixWindow.getRouterData();

	$w('#image4').src = shipmentInfo.jsonRates.parcel.image;
	
	$w('#text35').text = shipmentInfo.jsonRates.service.serviceName;
	$w('#text36').text = shipmentInfo.idRastreo;

	$w('#text39').text = shipmentInfo.origen.datos.nombre;
	$w('#text41').text = shipmentInfo.origen.datos.telefono;
	$w('#text43').text = shipmentInfo.origen.direccion.formatted;

	$w('#text48').text = shipmentInfo.destino.datos.nombre;
	$w('#text46').text = shipmentInfo.destino.datos.telefono;
	$w('#text44').text = shipmentInfo.destino.direccion.formatted;

	$w('#text28').text = shipmentInfo.paymentInfo.amount + " " + shipmentInfo.paymentInfo.currency;
	$w('#text29').text = shipmentInfo.paymentInfo.id;
	$w('#text30').text = shipmentInfo.paymentInfo.card.bank_name;

	$w('#html1').postMessage(shipmentInfo._id);

});
