import { currencyExchange, saveShipmentDB, getAllCountries, getStatesOfCountry, createCharge } from "backend/processes"
import { getRates } from "backend/RatesAndShipment"
import wixLocation from 'wix-location';
import wixStorage from 'wix-storage';
import { Address } from "public/clases.js"

var origen = new Address("MX");
var destino = new Address("MX");

$w.onReady(async function () {
    $w('#input2,#input3,#input4,#input5').min = 0;
    $w('#input2,#input3,#input4,#input5').max = 20;
    $w('#repeater2').data = [{ "_id": "1P", "tipo": "Paquete" }];

    $w('#repeater2').onItemReady(($item, itemData, index) => { //Codigo para el repetidor de dimensiones
        $item('#container3').show("slide", { duration: 500, direction: "left", delay: index * 100 });
    });

    $w('#dropdown3').options = await getAllCountries();

    $w('#button21').onClick(async () => { //Click en el boton de dimensiones
        $w('#text270').collapse();
        $w('#button21').disable();

        var vali = true;
        $w('#repeater2').forEachItem(($item, itemData, index) => { //Establecer los inputs de los contenedores del repetidor son validos
            console.log($item('#input2').valid, $item('#input3').valid, $item('#input4').valid, $item('#input5').valid)
            vali = vali && $item('#input2').valid && $item('#input3').valid && $item('#input4').valid && $item('#input5').valid;
            itemData.peso = $item('#input2').value;
            itemData.largo = $item('#input3').value;
            itemData.alto = $item('#input4').value;
            itemData.ancho = $item('#input5').value;
            itemData.aduana = {};
        });

        if (vali) { //Si son validos los inputs
            $w('#section3').hide("slide", { duration: 1000, direction: "top" }).then(() => {
                $w('#section3').collapse().then(() => {
                    $w('#section4,#section5').expand().then(() => {
                        $w('#section4,#section5').show("slide", { duration: 1000, direction: "top" });
                        $w('#section4').scrollTo();
                        $w('#text297,#text327').text = "Quantity: 1 Package";
                        $w('#text298,#text328').text = "Dimensions:\n";
                        $w('#repeater2').data.forEach((value, index) => {
                            $w('#text298,#text328').text += `\n${value.largo} X ${value.alto} X ${value.ancho} CM : ${value.peso} KG`;
                        });
                        $w('#text298,#text297,#button9').show("fade", { duration: 500 });
                        $w('#button21').enable();
                    });
                });
            });
        } else { //Si no son validos
            $w('#text270').expand();
            $w('#button21').enable();
        }
    });

    $w('#dropdownOrigenPais').onChange(async () => {
        origen.pais($w('#dropdownOrigenPais').value);
        $w('#dropdownOrigenEstado').disable();
        $w('#dropdownOrigenEstado').options = await getStatesOfCountry($w('#dropdownOrigenPais').value);
        $w('#dropdownOrigenEstado').enable();
    });
    $w('#dropdownDestinoPais').onChange(async () => {
        destino.pais($w('#dropdownDestinoPais').value);
        $w('#dropdownDestinoEstado').disable();
        $w('#dropdownDestinoEstado').options = await getStatesOfCountry($w('#dropdownDestinoPais').value);
        $w('#dropdownDestinoEstado').enable();
    });

    $w('#button9').onClick(() => {
        $w('#section3').expand().then(() => {
            $w('#section3').show("slide", { duration: 1000, direction: "top" }).then(() => {
                $w('#section3').scrollTo();
            });
        });
        $w('#section4,#section5,#section7').hide("slide", { duration: 1000, direction: "top" }).then(() => {
            $w('#section4,#section5,#section7').collapse();
        });
        $w('#text297,#text298,#button9').hide();
    });

    $w('#button23').onClick((rest) => { //Botones de direcciones
        $w('#button23').disable();
        $w('#text305').collapse();
        if ($w('#inputOrigenCP').valid && $w('#inputOrigenCalle').valid && $w('#inputOrigenCiudad').valid && $w('#inputOrigenNumExt').valid && $w('#inputOrigenNumInt').valid && $w('#dropdownOrigenEstado').valid && $w('#dropdownOrigenPais').valid && $w('#dropdownDestinoPais').valid && $w('#dropdownDestinoEstado').valid && $w('#inputDestinoNumInt').valid && $w('#inputDestinoNumExt').valid && $w('#inputDestinoCiudad').valid && $w('#inputDestinoCalle').valid && $w('#inputDestinoCP').valid) {
            origen.reset($w('#dropdownOrigenPais').value, $w('#dropdownOrigenEstado').value, $w('#inputOrigenCiudad').value, $w('#inputOrigenCalle').value, $w('#inputOrigenNumExt').value, $w('#inputOrigenNumInt').value, $w('#inputOrigenCP').value)
            destino.reset($w('#dropdownDestinoPais').value, $w('#dropdownDestinoEstado').value, $w('#inputDestinoCiudad').value, $w('#inputDestinoCalle').value, $w('#inputDestinoNumExt').value, $w('#inputDestinoNumInt').value, $w('#inputDestinoCP').value)
            $w('#text300').text = "Shipper:\n" + origen.stringfy(); //Dirección de origen franja amarilla
            $w('#text299').text = "Recipient:\n" + destino.stringfy(); //Direccion de destino franja amarilla
            $w('#text300,#text299').show("fade", { duration: 500 });
            $w('#section5').hide("slide", { duration: 1000, direction: "top" }).then(() => { //Colapsa franja de direcciones
                $w('#section5').collapse().then(() => {
                    $w('#section6').expand().then(() => { //Expande la franja amarilla y la de cargando
                        $w('#section6').show("slide", { duration: 1000, direction: "top" }).then(async () => {
                            $w('#section6').scrollTo();

                            const infoToSend = convertionData(); //Convierte la información recabada en información que entiendan las mensajerias
                            const infoReturned = await getRates(infoToSend); //Manda la informacion recabada al backend

                            if (infoReturned.length > 0) {
                                $w('#repeater1').data = infoReturned;

                                $w('#section6').collapse();
                                $w('#section7').expand().then(() => {
                                    $w('#section7').show("slide", { duration: 1000, direction: "top" }).then(() => {
                                        $w('#text310').scrollTo();
                                    });
                                });

                            } else {
                                $w('#text307').expand();
                                $w('#image10,#text306').collapse();
                            }
                            $w('#button10').show();
                            $w('#button23').enable();
                        });
                    });
                });
            });
        } else {
            $w('#button23').enable();
            $w('#text305').expand();
        }
    });

    $w('#button10').onClick(() => {
        $w('#section5').expand().then(() => {
            $w('#section5').show("slide", { duration: 1000, direction: "top" }).then(() => {
                $w('#section4').scrollTo();
            });
        });
        $w('#section7,#section6').hide("slide", { duration: 1000, direction: "top" }).then(() => {
            $w('#section7,#section6').collapse();
        });
        $w('#text299,#text300,#button10').hide();
    });

    $w('#repeater1').onItemReady(async ($item, itemData, index) => {
        //Acomoda la info en el repetidor
        switch (itemData.parcel.id) {
        case "fedex":
            itemData.parcel.image = "https://static.wixstatic.com/media/4c0a11_e3aa2e51a0f14a748d9533afb86b6684~mv2.png"
            break;
        case "ups":
            itemData.parcel.image = "https://static.wixstatic.com/media/4c0a11_daad52b8d6eb496ab81ef16fe06daf1c~mv2.png"
            break;
        case "dhl":
            itemData.parcel.image = "https://static.wixstatic.com/media/4c0a11_d8f2c2d066534cf6bd8275c290108bd1~mv2.png"
            break;
        }
        $item('#image13').src = itemData.parcel.image; //Imagen de la mensajeria
        $item('#text262').text = CapitalizeFirstLetter(itemData.service.serviceName); //Tipo de servicio
        if (itemData.deliveryDate === undefined) {
            $item('#text264').text = "Undefined";
        } else {
            $item('#text264').text = new Date(itemData.deliveryDate).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' }); //Fecha estimada de entrega
        }
        const amount = await currencyExchange(itemData.rate.currency, itemData.rate.total) //Cambia la moneda a MXN
        itemData.totalPesoMexicano = Number(amount); //Guarda el total convertido en el data del item actual
        $item('#text263').text = "$ " + Number(amount).toFixed(2) + " MXN"; //Muestra el total en MXN
        $item('#button20').style.backgroundColor = itemData.parcel.color; //Cambia el color del boton

        $item('#container4').show("slide", { duration: 500, direction: "left", delay: index * 100 });

        $item('#button20').onClick(async () => { //Cuando el cliente selecciona cual servicio quiere

            $w('#text227').text = origen.stringfy();
            $w('#text283').text = destino.stringfy();

            $w('#text323').text = itemData.parcel.name;
            $w('#text324').text = itemData.service.serviceName;
            if (itemData.deliveryDate === undefined) {
                $w('#text325').text = "Undefined delivery date.";
            } else {
                $w('#text325').text = new Date(itemData.deliveryDate).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' }); //Fecha estimada de entrega
            }

            $w('#text330').text = "Subtotal: $" + Number((25 / 29) * itemData.totalPesoMexicano).toFixed(2);
            $w('#text331').text = "MX Tax: $" + Number((itemData.totalPesoMexicano) - ((25 / 29) * itemData.totalPesoMexicano)).toFixed(2);

            $w('#text334').text = "Total: $" + Number(itemData.totalPesoMexicano).toFixed(2) + " MXN";

            wixStorage.session.setItem("total", JSON.stringify({ "totalPesoMexicano": itemData.totalPesoMexicano, "descuentos": 0, "totalAPagar": itemData.totalPesoMexicano, "puntos": 0, "infoServicio": itemData, "cupones": {} }));

            if (destino.internacional()) {
                $w('#repeater3').data = $w('#repeater2').data;

                $w('#section1,#section2,#section3,#section4,#section5,#section6,#section7').collapse().then(() => {
                    $w('#section11').expand().then(() => {
                        $w('#section11').show("slide", { duration: 1000, direction: "top" }).then(() => {
                            $w('#text346').scrollTo();
                        });
                    });
                });
            } else {
                $w('#section1,#section2,#section3,#section4,#section5,#section6,#section7').collapse().then(() => {
                    $w('#section8').expand().then(() => {
                        $w('#section8').show("slide", { duration: 1000, direction: "top" }).then(() => {
                            $w('#text315').scrollTo();
                            setTimeout(() => {
                                wixLocation.to("/account/my-shipments")
                            }, 540000);
                        });
                    });
                });
            }
        });
    });

    $w('#repeater3').onItemReady(($item, itemData, index) => {
        $item('#text347').text = `\n${itemData.largo} X ${itemData.alto} X ${itemData.ancho} CM : ${itemData.peso} KG`;
    });

    $w('#button26').onClick(() => {
        $w('#text352').collapse();
        var vali = true;
        $w('#repeater3').forEachItem(($item, itemData, index) => { //Establecer los inputs de los contenedores del repetidor son validos
            vali = vali && $item('#input13').valid && $item('#dropdown3').valid && $item('#input14').valid;
            itemData.aduana.descripcion = $item('#input13').value;
            itemData.aduana.pais = $item('#dropdown3').value;
            itemData.aduana.valor = Number($item('#input14').value);
        });

        if (vali) {
            $w('#section11').collapse().then(() => {
                $w('#section8').expand().then(() => {
                    $w('#section8').show("slide", { duration: 1000, direction: "top" }).then(() => {
                        $w('#text315').scrollTo();
                        setTimeout(() => {
                            wixLocation.to("/account/my-shipments")
                        }, 540000);
                    });
                });
            });
        } else {
            $w('#text352').expand();
        }
    });

    $w('#button25').onClick(async () => {
        $w('#image12').show();
        $w('#button25').disable();
        $w('#text339').collapse();
        if ($w('#input6').valid && $w('#input8').valid && $w('#input7').valid && $w('#input9').valid) {
            let totales = JSON.parse(wixStorage.session.getItem("total"));
            const result = await sendInfoShipment(totales)
            if (result.estatus) {
                wixLocation.to(await createCharge(result.id));
            } else {
                $w('#section8').collapse();
            }
        } else {
            $w('#text339').expand();
            $w('#button25').enable();
            $w('#image12').hide();
        }
    });
});

function convertionData() {
    var objToReturn = {
        "fedex": {
            "shipper": {
                "postalCode": origen.cp(),
                "countryCode": origen.pais()
            },
            "recipient": {
                "postalCode": destino.cp(),
                "countryCode": destino.pais()
            },
            "sobre": false,
            "packages": packages("fedex"),
            "totalPaquetes": 1
        },
        "dhl": {
            "shipperDetails": {
                "postalCode": origen.cp(),
                "cityName": origen.ciudad(),
                "countryCode": origen.pais(),
            },
            "receiverDetails": {
                "postalCode": destino.cp(),
                "cityName": destino.ciudad(),
                "countryCode": destino.pais(),
            },
            "packages": packages("dhl")
        },
        "ups": {
            "shipper": {
                "Address": {
                    "AddressLine": [
                        origen.calle()
                    ],
                    "City": origen.ciudad(),
                    "PostalCode": origen.cp(),
                    "StateProvinceCode": origen.estado(),
                    "CountryCode": origen.pais()
                }
            },
            "recipient": {
                "Address": {
                    "AddressLine": [
                        destino.calle()
                    ],
                    "City": destino.ciudad(),
                    "PostalCode": destino.cp(),
                    "StateProvinceCode": destino.estado(),
                    "CountryCode": destino.pais()
                }
            },
            "pesoTotal": $w('#repeater2').data[0].peso,
            "packages": packages("ups"),
            "numPackages": "1"
        }
    };
    return objToReturn;
}

function packages(parcel = "") {
    var toReturn = [];
    for (let i = 0; i < 1; i++) {
        const itemData = $w('#repeater2').data;

        switch (parcel.toLowerCase()) {
        case "fedex":
            toReturn.push({
                "weight": {
                    "units": "KG",
                    "value": Number(itemData[0].peso)
                },
                "dimensions": {
                    "length": Number(itemData[0].largo),
                    "width": Number(itemData[0].ancho),
                    "height": Number(itemData[0].alto),
                    "units": "CM"
                }
            });
            break;
        case "dhl":
            toReturn.push({
                "weight": Number(itemData[0].peso),
                "dimensions": {
                    "length": Number(itemData[0].largo),
                    "width": Number(itemData[0].ancho),
                    "height": Number(itemData[0].alto)
                }
            });
            break;
        case "ups":
            var pesoUPS = String(Number(itemData[0].peso));
            toReturn.push({
                "PackagingType": {
                    "Code": "02"
                },
                "Dimensions": {
                    "UnitOfMeasurement": {
                        "Code": "CM"
                    },
                    "Length": String(itemData[0].largo),
                    "Width": String(itemData[0].ancho),
                    "Height": String(itemData[0].alto)
                },
                "PackageWeight": {
                    "UnitOfMeasurement": {
                        "Code": "KGS"
                    },
                    "Weight": pesoUPS
                }
            });
            break;
        }

        return toReturn;
    }
}

import wixUsers from 'wix-users';

async function sendInfoShipment(totalesStorage) {
    let origenObject = {
        "datos": {
            "nombre": $w('#input6').value,
            "telefono": $w('#input8').value,
            "email": await wixUsers.currentUser.getEmail()
        },
        "direccion": origen.JSON()
    };
    let destinoObject = {
        "datos": {
            "nombre": $w('#input7').value,
            "telefono": $w('#input9').value,
            "email": await wixUsers.currentUser.getEmail()
        },
        "direccion": destino.JSON()
    };
    return await saveShipmentDB(origenObject, destinoObject, "Paquete", packages(totalesStorage.infoServicio.parcel.id.toLowerCase()), totalesStorage.infoServicio, totalesStorage.totalAPagar, totalesStorage.infoServicio.parcel.name, totalesStorage.infoServicio.parcel.id, $w('#inputDescripcion').value, destino.internacional() ? comodities(totalesStorage.infoServicio.parcel.id.toLowerCase()) : []);
}

function comodities(parcel = "") {
    var toReturn = []
    switch (parcel) {
    case "fedex":
        for (let i = 0; i < $w('#repeater3').data.length; i++) {
            const aduanaInfo = $w('#repeater3').data[i].aduana;
            toReturn.push({
                "description": aduanaInfo.descripcion,
                "countryOfManufacture": aduanaInfo.pais,
                "quantity": 1,
                "quantityUnits": "NO",
                "unitPrice": {
                    "amount": aduanaInfo.valor,
                    "currency": "NMP"
                },
                "customsValue": {
                    "amount": aduanaInfo.valor,
                    "currency": "NMP"
                },
                "weight": {
                    "units": "KG",
                    "value": $w('#repeater3').data[i].peso
                }
            })
        }
        break;
    }
    return toReturn;
}

function CapitalizeFirstLetter(string) {
    const words = string.split(" ");
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i][0].toUpperCase() + words[i].substr(1);
    }
    return words.join(" ");
}
