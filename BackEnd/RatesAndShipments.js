import * as Mensajeria from "@deapco/widget-mensajerias-backend"
import wixData from 'wix-data';
import { confirmationShipment } from "backend/sendMail"

export async function getRates(parcelInfo) {
    var ratesToReturn = [];

    const FedexRates = await Mensajeria.FEDEX_getRates(parcelInfo.fedex);
    FedexRates.forEach((value) => {
        ratesToReturn.push(value);
    });

    if (parcelInfo.fedex.recipient.countryCode === "MX") {
        const DHLRates = await Mensajeria.DHL_getRates(parcelInfo.dhl);
        DHLRates.forEach((value) => {
            ratesToReturn.push(value);
        });

        const UPSRates = await Mensajeria.UPS_getRates(parcelInfo.ups);
        UPSRates.forEach((value) => {
            ratesToReturn.push(value);
        });
    }

    ratesToReturn.sort((a, b) => {
        return a.rate.total - b.rate.total;
    });
    return ratesToReturn;
}

/**
 * Genera directamente el envio con la empresa elegida
 */
export async function create_Shipment(id, folioPago) {
    var objectToSave = {};
    const envioInfo = await wixData.get("EnviosOnline", id, { "suppressAuth": true });

    try {
        if (!envioInfo.pagado) {
            var fetchResponse = {};
            var idRastreoSave = "";
            var guiasSave = [];

            switch (String(envioInfo.idMensajeria).toLowerCase()) {
            case "fedex":
                var streetOrigen = [],
                    streetDestino = [];
                if (envioInfo.origen.direccion.streetAddress.name.length > 35) {
                    for (let i = 0; i < envioInfo.origen.direccion.streetAddress.name.length; i + 35) {
                        streetOrigen.push(envioInfo.origen.direccion.streetAddress.name.substr(i, 35));
                    }
                } else {
                    streetOrigen.push(envioInfo.origen.direccion.streetAddress.name);
                }
                if (envioInfo.destino.direccion.streetAddress.name.length > 35) {
                    for (let i = 0; i < envioInfo.destino.direccion.streetAddress.name.length; i + 35) {
                        streetDestino.push(envioInfo.destino.direccion.streetAddress.name.substr(i, 35));
                    }
                } else {
                    streetDestino.push(envioInfo.destino.direccion.streetAddress.name);
                }
                streetOrigen.push(envioInfo.origen.direccion.streetAddress.number);
                streetDestino.push(envioInfo.destino.direccion.streetAddress.number);

                var shiperFEDEX = {
                    "address": {
                        "streetLines": streetOrigen,
                        "city": envioInfo.origen.direccion.city,
                        "stateOrProvinceCode": envioInfo.jsonRates.JSONoriginal.serviceInfo.commit.derivedOriginDetail.stateOrProvinceCode,
                        "postalCode": envioInfo.jsonRates.JSONoriginal.serviceInfo.commit.derivedOriginDetail.postalCode,
                        "countryCode": envioInfo.jsonRates.JSONoriginal.serviceInfo.commit.derivedOriginDetail.countryCode
                    },
                    "contact": {
                        "personName": envioInfo.origen.datos.nombre,
                        "phoneNumber": envioInfo.origen.datos.telefono
                    }
                };
                var recipientsFEDEX = {
                    "address": {
                        "streetLines": streetDestino,
                        "city": envioInfo.destino.direccion.city,
                        "stateOrProvinceCode": envioInfo.jsonRates.JSONoriginal.serviceInfo.commit.derivedDestinationDetail.stateOrProvinceCode,
                        "postalCode": envioInfo.jsonRates.JSONoriginal.serviceInfo.commit.derivedDestinationDetail.postalCode,
                        "countryCode": envioInfo.jsonRates.JSONoriginal.serviceInfo.commit.derivedDestinationDetail.countryCode
                    },
                    "contact": {
                        "personName": envioInfo.destino.datos.nombre,
                        "phoneNumber": envioInfo.destino.datos.telefono
                    }
                };
                fetchResponse = await Mensajeria.FEDEX_Testing_sendShipment(shiperFEDEX, recipientsFEDEX, envioInfo.jsonRates.service.serviceType, envioInfo.jsonRates.JSONoriginal.serviceInfo.packagingType, envioInfo.jsonRates.shipmentWeight.value, envioInfo.dimensiones, envioInfo._id, recipientsFEDEX.address.countryCode === "MX" ? undefined : envioInfo.comodities);

                if (fetchResponse.estatus) {
                    var guiaFEDEX = [];
                    var guiaFEDEXEmail = [];

                    for (let i = 0; i < fetchResponse.JSON.output.transactionShipments[0].pieceResponses.length; i++) {
                        guiaFEDEX.push({
                            _id: String(i),
                            type: "pdf",
                            content: fetchResponse.JSON.output.transactionShipments[0].pieceResponses[i].packageDocuments[0].encodedLabel
                        });
                        guiaFEDEXEmail.push({
                            "@odata.type": "#microsoft.graph.fileAttachment",
                            "name": "Shipment Label.pdf",
                            "contentType": "application/pdf",
                            "contentBytes": fetchResponse.JSON.output.transactionShipments[0].pieceResponses[i].packageDocuments[0].encodedLabel
                        })
                    }
                    idRastreoSave = fetchResponse.JSON.output.transactionShipments[0].masterTrackingNumber;
                    guiasSave = guiaFEDEX;

                    await confirmationShipment(envioInfo.origen.datos.nombre, envioInfo.jsonRates.parcel.image, envioInfo.jsonRates.service.serviceName, idRastreoSave, envioInfo.origen.datos.email, guiaFEDEXEmail);

                }
                break;
            case "dhl":
                var shiperDHL = {
                    "postalAddress": {
                        "postalCode": envioInfo.origen.direccion.postalCode,
                        "cityName": envioInfo.origen.direccion.city,
                        "countryCode": envioInfo.origen.direccion.country,
                        "addressLine1": envioInfo.origen.direccion.streetAddress.name + " " + envioInfo.origen.direccion.streetAddress.number
                    },
                    "contactInformation": {
                        "phone": envioInfo.origen.datos.telefono,
                        "companyName": "-",
                        "fullName": envioInfo.origen.datos.nombre
                    }
                };
                var recipientsDHL = {
                    "postalAddress": {
                        "postalCode": envioInfo.destino.direccion.postalCode,
                        "cityName": envioInfo.destino.direccion.city,
                        "countryCode": envioInfo.destino.direccion.country,
                        "addressLine1": envioInfo.destino.direccion.streetAddress.name + " " + envioInfo.destino.direccion.streetAddress.number
                    },
                    "contactInformation": {
                        "phone": envioInfo.destino.datos.telefono,
                        "companyName": "-",
                        "fullName": envioInfo.destino.datos.nombre
                    }
                };

                fetchResponse = await Mensajeria.DHL_Testing_sendShipment(shiperDHL, recipientsDHL, envioInfo.jsonRates.service.serviceType, envioInfo.dimensiones, envioInfo._id, "deapcoShipments");

                if (fetchResponse.estatus) {
                    idRastreoSave = fetchResponse.JSON.shipmentTrackingNumber;
                    guiasSave = [{
                        _id: "0",
                        type: "pdf",
                        content: fetchResponse.JSON.documents[0].content
                    }]
                    await confirmationShipment(envioInfo.origen.datos.nombre, envioInfo.jsonRates.parcel.image, envioInfo.jsonRates.service.serviceName, fetchResponse.JSON.shipmentTrackingNumber, envioInfo.origen.datos.email, [{
                        "@odata.type": "#microsoft.graph.fileAttachment",
                        "name": "Shipment Label.pdf",
                        "contentType": "application/pdf",
                        "contentBytes": fetchResponse.JSON.documents[0].content
                    }]);
                }
                break;

            case "ups":
                var origenUPS = {
                    "Name": envioInfo.origen.datos.nombre,
                    "AttentionName": envioInfo.origen.datos.nombre,
                    "Address": {
                        "AddressLine": envioInfo.origen.direccion.streetAddress.name + " " + envioInfo.origen.direccion.streetAddress.number,
                        "City": envioInfo.origen.direccion.city,
                        "StateProvinceCode": envioInfo.origen.direccion.subdivision,
                        "PostalCode": envioInfo.origen.direccion.postalCode,
                        "CountryCode": envioInfo.origen.direccion.country
                    },
                    "Phone": {
                        "Number": envioInfo.origen.datos.telefono
                    }
                };
                var destinoUPS = {
                    "Name": envioInfo.destino.datos.nombre,
                    "AttentionName": envioInfo.destino.datos.nombre,
                    "Address": {
                        "AddressLine": envioInfo.destino.direccion.streetAddress.name + " " + envioInfo.destino.direccion.streetAddress.number,
                        "City": envioInfo.destino.direccion.city,
                        "StateProvinceCode": envioInfo.destino.direccion.subdivision,
                        "PostalCode": envioInfo.destino.direccion.postalCode,
                        "CountryCode": envioInfo.destino.direccion.country
                    },
                    "Phone": {
                        "Number": envioInfo.destino.datos.telefono
                    }
                };

                fetchResponse = await Mensajeria.UPS_Testing_sendShipment(origenUPS, destinoUPS, envioInfo.jsonRates.service.serviceType, envioInfo.dimensiones, envioInfo.descripcionDelEnvio);

                if (fetchResponse.estatus) {
                    if (Array.isArray(fetchResponse.JSON.ShipmentResponse.ShipmentResults.PackageResults)) {
                        var guiaUPS = [];
                        var guiaUPSAPI = [];

                        for (let i = 0; i < fetchResponse.JSON.ShipmentResponse.ShipmentResults.PackageResults.length; i++) {
                            guiaUPS.push({
                                _id: String(i),
                                type: "gif",
                                content: fetchResponse.JSON.ShipmentResponse.ShipmentResults.PackageResults[i].ShippingLabel.GraphicImage
                            });
                            guiaUPSAPI.push({
                                "@odata.type": "#microsoft.graph.fileAttachment",
                                "name": "Shipment Label.gif",
                                "contentType": "image/gif",
                                "contentBytes": fetchResponse.JSON.ShipmentResponse.ShipmentResults.PackageResults[i].ShippingLabel.GraphicImage
                            })
                        }

                        idRastreoSave = String(fetchResponse.JSON.ShipmentResponse.ShipmentResults.ShipmentIdentificationNumber);
                        guiasSave = guiaUPS;
                        await confirmationShipment(envioInfo.origen.datos.nombre, envioInfo.jsonRates.parcel.image, envioInfo.jsonRates.service.serviceName, idRastreoSave, envioInfo.origen.datos.email, guiaUPSAPI);

                    } else {
                        idRastreoSave = String(fetchResponse.JSON.ShipmentResponse.ShipmentResults.ShipmentIdentificationNumber);
                        await confirmationShipment(envioInfo.origen.datos.nombre, envioInfo.jsonRates.parcel.image, envioInfo.jsonRates.service.serviceName, idRastreoSave, envioInfo.origen.datos.email, [{
                            "@odata.type": "#microsoft.graph.fileAttachment",
                            "name": "Shipment Label.gif",
                            "contentType": "image/gif",
                            "contentBytes": fetchResponse.JSON.ShipmentResponse.ShipmentResults.PackageResults.ShippingLabel.GraphicImage
                        }]);
                        guiasSave = [{
                            _id: "0",
                            type: "gif",
                            content: fetchResponse.JSON.ShipmentResponse.ShipmentResults.PackageResults.ShippingLabel.GraphicImage
                        }]
                    }
                }
                break;
            }

            console.log(fetchResponse);
            if (fetchResponse.estatus) {
                objectToSave = {
                    ...envioInfo,
                    "idRastreo": idRastreoSave,
                    "guia": guiasSave,
                    "jsonShipment": fetchResponse.JSON,
                    "pagado": true,
                    "folioDePago": String(folioPago)
                }
                return wixData.save("EnviosOnline", objectToSave, { "suppressAuth": true }).then(() => {
                    return { "estatus": true }
                }).catch((err) => {
                    return wixData.insert("Enviosconerror", { "id": makeid(8), "idEnvio": id, "fetch": { "fetch": fetchResponse, "error": err } }, { "suppressAuth": true }).then((errorID) => {
                        return { "estatus": false, "errorID": errorID.id };
                    });
                });
            } else {
                return wixData.save("EnviosOnline", { ...envioInfo, "pagado": true, "folioDePago": String(folioPago) }, { "suppressAuth": true }).then(() => {
                    return wixData.insert("Enviosconerror", { "id": makeid(8), "idEnvio": id, "fetch": fetchResponse.info }, { "suppressAuth": true }).then((errorID) => {
                        return { "estatus": false, "errorID": errorID.id };
                    });
                });
            }
        } else {
            return { "estatus": true }
        }
    } catch (err) {
        console.log(err);
        return wixData.save("EnviosOnline", { ...envioInfo, "pagado": true, "folioDePago": String(folioPago) }, { "suppressAuth": true }).then(() => {
            return wixData.insert("Enviosconerror", { "id": makeid(8), "idEnvio": id, "fetch": fetchResponse }, { "suppressAuth": true }).then((errorID) => {
                return { "estatus": false, "errorID": errorID.id };
            });
        });
    }
}

export async function create_Shipment_API(parcel, shipmentInfo, email, name) {
    try {
        var fetchResponse = {}
        var fetchResponse = {};
        var idRastreoSave = "";
        switch (parcel) {
        case "fedex":
            var streetOrigen = [],
                streetDestino = [];
            if (shipmentInfo.shipper.address.addressLine.length > 35) {
                for (let i = 0; i < shipmentInfo.shipper.address.addressLine.length; i + 35) {
                    streetOrigen.push(shipmentInfo.shipper.address.addressLine.substr(i, 35));
                }
            } else {
                streetOrigen.push(shipmentInfo.shipper.address.addressLine);
            }
            if (shipmentInfo.recipient.address.addressLine.length > 35) {
                for (let i = 0; i < shipmentInfo.recipient.address.addressLine.length; i + 35) {
                    streetDestino.push(shipmentInfo.recipient.address.addressLine.substr(i, 35));
                }
            } else {
                streetDestino.push(shipmentInfo.recipient.address.addressLine);
            }
            streetOrigen.push(shipmentInfo.shipper.address.number);
            streetDestino.push(shipmentInfo.recipient.address.number);

            var shiperFEDEX = {
                "address": {
                    "streetLines": streetOrigen,
                    "city": shipmentInfo.shipper.address.city,
                    "stateOrProvinceCode": shipmentInfo.shipper.address.stateCode,
                    "postalCode": shipmentInfo.shipper.address.zipCode,
                    "countryCode": shipmentInfo.shipper.address.countryCode
                },
                "contact": {
                    "personName": shipmentInfo.shipper.contact.contactName,
                    "phoneNumber": shipmentInfo.shipper.contact.contactPhoneNumber
                }
            };
            var recipientsFEDEX = {
                "address": {
                    "streetLines": streetDestino,
                    "city": shipmentInfo.recipient.address.city,
                    "stateOrProvinceCode": shipmentInfo.recipient.address.stateCode,
                    "postalCode": shipmentInfo.recipient.address.zipCode,
                    "countryCode": shipmentInfo.recipient.address.countryCode
                },
                "contact": {
                    "personName": shipmentInfo.recipient.contact.contactName,
                    "phoneNumber": shipmentInfo.recipient.contact.contactPhoneNumber
                }
            };
            fetchResponse = await Mensajeria.FEDEX_Testing_sendShipment(shiperFEDEX, recipientsFEDEX, shipmentInfo.serviceType, "YOUR_PACKAGING", shipmentInfo.package.weight.value, [shipmentInfo.package], makeid(28), recipientsFEDEX.address.countryCode === "MX" ? undefined : [{ "weight": { "units": "KG", "value": Number(shipmentInfo.package.weight.value) }, "quantity": 1, "description": "Example", "countryOfManufacture": "MX", "unitPrice": { "amount": 100, "currency": "NMP" }, "customsValue": { "amount": 100, "currency": "NMP" }, "quantityUnits": "NO" }]);

            if (fetchResponse.estatus) {
                var guiaFEDEX = [];
                var guiaFEDEXEmail = [];
                let cartaPorte;

                for (let i = 0; i < fetchResponse.JSON.output.transactionShipments[0].pieceResponses.length; i++) {
                    guiaFEDEX.push({
                        _id: String(i),
                        type: "pdf",
                        content: fetchResponse.JSON.output.transactionShipments[0].pieceResponses[i].packageDocuments[0].encodedLabel
                    });
                    guiaFEDEXEmail.push({
                        "@odata.type": "#microsoft.graph.fileAttachment",
                        "name": "Shipment Label.pdf",
                        "contentType": "application/pdf",
                        "contentBytes": fetchResponse.JSON.output.transactionShipments[0].pieceResponses[i].packageDocuments[0].encodedLabel
                    })
                }
                idRastreoSave = fetchResponse.JSON.output.transactionShipments[0].masterTrackingNumber;
                if (fetchResponse.JSON.output.transactionShipments[0].shipmentDocuments) {
                    cartaPorte = fetchResponse.JSON.output.transactionShipments[0].shipmentDocuments[0].encodedLabel;
                    delete fetchResponse.JSON.output.transactionShipments[0].shipmentDocuments
                } else {
                    cartaPorte = undefined;
                }
                const servicio = fetchResponse.JSON.output.transactionShipments[0].serviceName;
                await confirmationShipment(name, "https://static.wixstatic.com/media/4c0a11_e3aa2e51a0f14a748d9533afb86b6684~mv2.png", servicio, idRastreoSave, email, guiaFEDEXEmail);
                return {
                    "status": true,
                    "shipmentInfo": {
                        "label": guiaFEDEX,
                        "trackingID": idRastreoSave,
                        "commercialInvoice": cartaPorte,
                        "service": servicio
                    }
                }
            } else {
                return {
                    "status": false,
                    "JSON": fetchResponse.JSON.errors
                }
            }
        case "dhl":
            var shiperDHL = {
                "postalAddress": {
                    "postalCode": shipmentInfo.shipper.address.zipCode,
                    "cityName": shipmentInfo.shipper.address.city,
                    "countryCode": shipmentInfo.shipper.address.countryCode,
                    "addressLine1": shipmentInfo.shipper.address.addressLine + " " + shipmentInfo.shipper.address.number
                },
                "contactInformation": {
                    "phone": shipmentInfo.shipper.contact.contactPhoneNumber,
                    "companyName": "-",
                    "fullName": shipmentInfo.shipper.contact.contactName
                }
            };
            var recipientsDHL = {
                "postalAddress": {
                    "postalCode": shipmentInfo.recipient.address.zipCode,
                    "cityName": shipmentInfo.recipient.address.city,
                    "countryCode": shipmentInfo.recipient.address.countryCode,
                    "addressLine1": shipmentInfo.recipient.address.addressLine + shipmentInfo.recipient.address.number
                },
                "contactInformation": {
                    "phone": shipmentInfo.recipient.contact.contactPhoneNumber,
                    "companyName": "-",
                    "fullName": shipmentInfo.recipient.contact.contactName
                }
            };

            fetchResponse = await Mensajeria.DHL_Testing_sendShipment(shiperDHL, recipientsDHL, shipmentInfo.serviceType, [shipmentInfo.package], makeid(28), "deapcoShipments");

            if (fetchResponse.estatus) {
                await confirmationShipment(name, "https://static.wixstatic.com/media/4c0a11_d8f2c2d066534cf6bd8275c290108bd1~mv2.png", "DHL Service", fetchResponse.JSON.shipmentTrackingNumber, email, [{
                    "@odata.type": "#microsoft.graph.fileAttachment",
                    "name": "Shipment Label.pdf",
                    "contentType": "application/pdf",
                    "contentBytes": fetchResponse.JSON.documents[0].content
                }]);

                return {
                    "status": true,
                    "shipmentInfo": {
                        "label": [{
                            _id: "0",
                            type: "pdf",
                            content: fetchResponse.JSON.documents[0].content
                        }],
                        "trackingID": fetchResponse.JSON.shipmentTrackingNumber
                    }
                }
            } else {
                return {
                    "status": false,
                    "JSON": fetchResponse.JSON.errors
                }
            }
        case "ups":
            var origenUPS = {
                "Name": shipmentInfo.shipper.contact.contactName,
                "AttentionName": shipmentInfo.shipper.contact.contactName,
                "Address": {
                    "AddressLine": shipmentInfo.shipper.address.addressLine + " " + shipmentInfo.shipper.address.number,
                    "City": shipmentInfo.shipper.address.city,
                    "StateProvinceCode": shipmentInfo.shipper.address.stateCode,
                    "PostalCode": shipmentInfo.shipper.address.zipCode,
                    "CountryCode": shipmentInfo.shipper.address.countryCode
                },
                "Phone": {
                    "Number": shipmentInfo.shipper.contact.contactPhoneNumber
                }
            };
            var destinoUPS = {
                "Name": shipmentInfo.recipient.contact.contactName,
                "AttentionName": shipmentInfo.recipient.contact.contactName,
                "Address": {
                    "AddressLine": shipmentInfo.recipient.address.addressLine + " " + shipmentInfo.recipient.address.number,
                    "City": shipmentInfo.recipient.address.city,
                    "StateProvinceCode": shipmentInfo.recipient.address.stateCode,
                    "PostalCode": shipmentInfo.recipient.address.zipCode,
                    "CountryCode": shipmentInfo.recipient.address.countryCode
                },
                "Phone": {
                    "Number": shipmentInfo.recipient.contact.contactPhoneNumber
                }
            }

            fetchResponse = await Mensajeria.UPS_Testing_sendShipment(origenUPS, destinoUPS, shipmentInfo.serviceType, [shipmentInfo.package], "Testing shipment");

            if (fetchResponse.estatus) {
                if (Array.isArray(fetchResponse.JSON.ShipmentResponse.ShipmentResults.PackageResults)) {
                    var guiaUPS = [];
                    var guiaUPSAPI = []

                    for (let i = 0; i < fetchResponse.JSON.ShipmentResponse.ShipmentResults.PackageResults.length; i++) {
                        guiaUPS.push({
                            _id: String(i),
                            type: "gif",
                            content: fetchResponse.JSON.ShipmentResponse.ShipmentResults.PackageResults[i].ShippingLabel.GraphicImage
                        });
                        guiaUPSAPI.push({
                            "@odata.type": "#microsoft.graph.fileAttachment",
                            "name": "Shipment Label.gif",
                            "contentType": "image/gif",
                            "contentBytes": fetchResponse.JSON.ShipmentResponse.ShipmentResults.PackageResults[i].ShippingLabel.GraphicImage
                        })
                    }

                    idRastreoSave = String(fetchResponse.JSON.ShipmentResponse.ShipmentResults.ShipmentIdentificationNumber);

                    await confirmationShipment(name, "https://static.wixstatic.com/media/4c0a11_daad52b8d6eb496ab81ef16fe06daf1c~mv2.png", "UPS Service", idRastreoSave, email, guiaUPSAPI);
                    return {
                        "status": true,
                        "shipmentInfo": {
                            "label": guiaUPS,
                            "trackingID": idRastreoSave
                        }
                    }
                } else {
                    idRastreoSave = String(fetchResponse.JSON.ShipmentResponse.ShipmentResults.ShipmentIdentificationNumber);
                    await confirmationShipment(name, "https://static.wixstatic.com/media/4c0a11_daad52b8d6eb496ab81ef16fe06daf1c~mv2.png", "UPS Service", idRastreoSave, email, [{
                        "@odata.type": "#microsoft.graph.fileAttachment",
                        "name": "Shipment Label.gif",
                        "contentType": "image/gif",
                        "contentBytes": fetchResponse.JSON.ShipmentResponse.ShipmentResults.PackageResults.ShippingLabel.GraphicImage
                    }]);
                    return {
                        "status": true,
                        "shipmentInfo": {
                            "label": [{
                                _id: "0",
                                type: "gif",
                                content: fetchResponse.JSON.ShipmentResponse.ShipmentResults.PackageResults.ShippingLabel.GraphicImage
                            }],
                            "trackingID": idRastreoSave
                        }
                    }
                }
            } else {
                return {
                    "status": false,
                    "JSON": fetchResponse.JSON.response.errors
                }
            }
        }
    } catch (err) {
        console.log(err)
        return { status: false, JSON: err }
    }
}

export async function cancel() {
    return await Mensajeria.FEDEX_cancelShipment("771821296107")
}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}
