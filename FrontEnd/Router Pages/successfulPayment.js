import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import {create_Shipment} from "backend/RatesAndShipment"

$w.onReady(async function () {
	const paymentInfo = wixWindow.getRouterData();

	$w('#text23').text = String(paymentInfo.id);
	$w('#text24').text = String(paymentInfo.amount) + " " + String(paymentInfo.currency);
	$w('#text25').text = String(paymentInfo.card.bank_name)

	$w('#text23,#text24,#text25,#box2,#text30,#text31,#text32').show("fade",{duration:1000});
	
	$w('#button9').onClick(async ()=>{
		$w('#box1,#box2').collapse();
		$w('#box3').expand();
		const fetchResponse = await create_Shipment(paymentInfo.order_id, paymentInfo.id);
		if(fetchResponse.estatus){
			wixLocation.to("/shipment/information/" + paymentInfo.order_id);
		} else {
			$w('#image3').hide();
			$w('#text29').text = "Oh no :(";
			$w('#text28').text = "An error occurred. Please contact the support area with ID " + fetchResponse.errorID;
		}
	});

});
