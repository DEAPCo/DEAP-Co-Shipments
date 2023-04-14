import {getMyShipments} from "backend/processes"

$w.onReady(async function () {

    $w('#repeater1').data = await getMyShipments();
    $w('#image3').collapse()

    if($w('#repeater1').data.length > 0){
        $w('#labelsText,#repeater1').show("fade",{duration:1000});
    } else {
        $w('#text29').expand();
    }

	$w('#repeater1').onItemReady(($item, itemData, index)=>{
		$item('#image4').src = itemData.jsonRates.parcel.image; 
        $item('#text26').text = itemData.jsonRates.service.serviceName; 
        if (itemData.jsonRates.deliveryDate === undefined) {
            $item('#text27').text = "Undefined";
        } else {
            $item('#text27').text = new Date(itemData.jsonRates.deliveryDate).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' }); //Fecha estimada de entrega
        }
        $item('#text28').text = String(itemData.idRastreo).substr(0,15) + (String(itemData.idRastreo).length > 15 ? "..." : "");
        $item('#button9').link = "/shipment/information/"+itemData._id;
		$item('#button9').target = "_self";

        $item('#container4').show("slide", { duration: 500, direction: "left", delay: index * 100 });
	});

});
