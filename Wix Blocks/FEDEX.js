import wixSecretsBackend from 'wix-secrets-backend';
import { fetch } from "wix-fetch"
import { getPackageConfig } from 'wix-configs-backend';

async function getAuthentication() {
    try {
        const secret = await wixSecretsBackend.getSecret("FEDEX_Authentication");

        const fetchResponse = await fetch("https://apis.fedex.com/oauth/token", {
            method: "post",
            headers: {
                "content-type": "application/x-www-form-urlencoded"
            },
            body: `grant_type=client_credentials&client_id=${JSON.parse(secret).client_id}&client_secret=${JSON.parse(secret).client_secret}`
        });
        const fetchJson = await fetchResponse.json();

        return fetchJson.access_token;

    } catch (error) {
        return error;
    }
}

/**
 * Obtener tarifas de entrega con las direcciones de origen/destino introducidas
 * 
 * @param values {Object} Objeto representando los datos de origen y destino del paquete así como sus dimensiones
 * 
 * @param values.shipper {Object} Objeto indicando el origen del paquete
 * @param values.shipper.postalCode {String} Código postal del origen del paquete
 * @param values.shipper.countryCode {String} Código ISO del país de origen del paquete
 * 
 * @param values.recipient {Object} Objeto indicando el destino del paquete
 * @param values.recipient.postalCode {String} Código postal del destino del paquete
 * @param values.recipient.countryCode {String} Código ISO del país del destino del paquete
 * 
 * @param values.sobre {Boolean} Indica si el envío es un sobre
 * 
 * @param values.packages {Array} Agrega la información de los paquetes del envío
 * 
 * @param values.totalWeight {Number} Peso total del envío
 * 
 * @param values.descripcion {String} Descripción de lo que se está enviando
 * 
 * @return {Promise <Array>} Array de servicios con costos disponibles para las direcciones de origen/destino introducidas
 */
export async function FEDEX_getRates(values = {
    "shipper": {
        "postalCode": "04810",
        "countryCode": "MX"
    },
    "recipient": {
        "postalCode": "62440",
        "countryCode": "MX"
    },
    "sobre": false,
    "packages": [{
        "weight": {
            "units": "KG",
            "value": 1
        },
        "dimensions": {
            "length": 1,
            "width": 2,
            "height": 3,
            "units": "CM"
        }
    }],
    "totalWeight": 0,
    "descripcion": ""
}) {
    try {
        var packagingType = values.sobre ? "FEDEX_ENVELOPE" : "YOUR_PACKAGING";
        const token = await getAuthentication();

        var bodyToSend = {
            "accountNumber": {
                "value": (await getPackageConfig("FEDEX")).accountNumbers.production
            },
            "rateRequestControlParameters": {
                "returnTransitTimes": "TRUE"
            },
            "requestedShipment": {
                "shipper": {
                    "address": values.shipper
                },
                "recipient": {
                    "address": values.recipient
                },
                "preferredCurrency": "MXN",
                "pickupType": "USE_SCHEDULED_PICKUP",
                "packagingType": packagingType,
                "rateRequestType": [
                    "LIST"
                ],
                "totalPackageCount": values.packages.length,
                "requestedPackageLineItems": values.packages
            }
        };

        if (values.recipient.countryCode !== "MX") {
            bodyToSend.requestedShipment.customsClearanceDetail = {
                "commercialInvoice": {
                    "shipmentPurpose": "GIFT"
                },
                "freightOnValue": "CARRIER_RISK",
                "dutiesPayment": {
                    "paymentType": "SENDER"
                },
                "commodities": [{
                    "description": values.descripcion,
                    "weight": values.packages[0].weight,
                    "quantity": 1,
                    "customsValue": {
                        "amount": "100",
                        "currency": "USD"
                    },
                    "unitPrice": {
                        "amount": "100",
                        "currency": "USD"
                    },
                    "numberOfPieces": 1,
                    "countryOfManufacture": "US",
                    "quantityUnits": "PCS",
                    "name": values.descripcion,
                    "harmonizedCode": "080211",
                    "partNumber": "P1"
                }]
            }
        }

        const fetchResponse = await fetch("https://apis.fedex.com/rate/v1/rates/quotes", {
            method: "post",
            headers: {
                "content-type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(bodyToSend)
        });

        const fetchJson = await fetchResponse.json();
        console.log(fetchJson);

        const incremento = Math.abs(Number((await getPackageConfig("FEDEX")).incrementoDePrecio));

        if (fetchResponse.ok) {
            var toReturn = [];
            for (let i = 0; i < fetchJson.output.rateReplyDetails.length; i++) {
                toReturn.push({
                    "_id": "Fedex" + String(i),
                    "parcel": {
                        "name": "FEDEX",
                        "image": "https://static.wixstatic.com/shapes/4c0a11_e6803cfec58a475fa3a82babaf5e3779.svg",
                        "color": "#4D148C",
                        "id": "fedex"
                    },
                    "service": {
                        "serviceType": fetchJson.output.rateReplyDetails[i].serviceType,
                        "serviceName": fetchJson.output.rateReplyDetails[i].serviceName
                    },
                    "rate": {
                        "total": fetchJson.output.rateReplyDetails[i].ratedShipmentDetails[0].totalNetCharge + incremento,
                        "currency": fetchJson.output.rateReplyDetails[i].ratedShipmentDetails[0].currency === "NMP" ? "MXN" : fetchJson.output.rateReplyDetails[i].ratedShipmentDetails[0].currency,
                    },
                    "shipmentWeight": fetchJson.output.rateReplyDetails[i].ratedShipmentDetails[0].shipmentRateDetail.totalBillingWeight,
                    "deliveryDate": fetchJson.output.rateReplyDetails[i].commit.dateDetail === undefined ? undefined : fetchJson.output.rateReplyDetails[i].commit.dateDetail.dayFormat === undefined ? undefined : fetchJson.output.rateReplyDetails[i].commit.dateDetail.dayFormat,
                    "JSONoriginal": {
                        "transactionId": fetchJson.transactionId,
                        "quoteDate": fetchJson.output.quoteDate,
                        "serviceInfo": fetchJson.output.rateReplyDetails[i]
                    }
                });
                console.log(values.recipient.countryCode, (await getPackageConfig("Rabee")).activo, fetchJson.output.rateReplyDetails[i].serviceType, values.totalWeight);
            }
            return toReturn;
        } else {
            return [];
        }
    } catch (err) {
        console.log(err);
        return [];
    }
}

/**
 * TESTING Realizar el envío de un paquete para obtener la guía de embarque y los datos finales
 * 
 * @param shiper {Object} Datos de recolección
 * 
 * @param shiper.address {Object} Dirección de recolección
 * @param shiper.address.streetLines {Array} Lineas de la dirección de recolección
 * @param shiper.address.city {String} Ciudad de recolección
 * @param shiper.address.stateOrProvinceCode {String} Estado de recolección
 * @param shiper.address.postalCode {String} Código postal de recolección
 * @param shiper.address.countryCode {String} Código ISO del país de recolección
 * 
 * @param shiper.contact {Object} Contacto de la recolección
 * @param shiper.contact.personName {String} Nombre del remitente
 * @param shiper.contact.phoneNumber {String} Telefono del remitente
 * 
 * 
 * @param recipients {Object} Datos de entrega
 * 
 * @param recipients.address {Object} Dirección de entrega
 * @param recipients.address.streetLines {Array} Lineas de la dirección de entrega
 * @param recipients.address.city {String} Ciudad de entrega
 * @param recipients.address.stateOrProvinceCode {String} Estado de entrega
 * @param recipients.address.postalCode {String} Código postal de entrega
 * @param recipients.address.countryCode {String} Código ISO del país de entrega
 * 
 * @param recipients.contact {Object} Contacto de la entrega
 * @param recipients.contact.personName {String} Nombre del destinatario
 * @param recipients.contact.phoneNumber {String} Telefono del destinatario
 * 
 * @param serviceType {String} Código del tipo de servicio que eligió el cliente
 * 
 * @param packagingType {String} "FEDEX_ENVELOPE" para envío de sobres, "YOUR_PACKAGING" para envío de paquetes
 * 
 * @param totalWeight {Number} Peso total del envío
 * 
 * @param requestedPackageLineItems {Array} Agrega la información de los paquetes del envío
 * 
 * @param idDataBase {String} ID del elemento en DB para matchear que sea el mismo envío
 * 
 * @return {Promise <Object>} Indica si el envío se generó correctamente {"estatus":Boolean, "JSON":JSON del fetch}
 */
export async function FEDEX_Testing_sendShipment(shiper = {
        "address": {
            "streetLines": ["LIRA 48"],
            "city": "Ciudad de Mexico",
            "stateOrProvinceCode": "DF",
            "postalCode": "04810",
            "countryCode": "MX"
        },
        "contact": {
            "personName": "Diego Efrain",
            "phoneNumber": "7774942202"
        }
    }, recipients = {
        "address": {
            "streetLines": ["212 W Houston Ave"],
            "city": "Fullerton",
            "stateOrProvinceCode": "CA",
            "postalCode": "92832",
            "countryCode": "US"
        },
        "contact": {
            "personName": "Diego Efrain",
            "phoneNumber": "7774942202"
        }
    },
    serviceType = "INTERNATIONAL_ECONOMY",
    packagingType = "YOUR_PACKAGING",
    totalWeight = 3,
    requestedPackageLineItems = [{
        "weight": {
            "units": "KG",
            "value": 3
        },
        "dimensions": {
            "length": 10,
            "width": 10,
            "height": 10,
            "units": "CM"
        }
    }],
    idDataBase = "fbrenckwjcnkwjenckjwndkewjnc",
    comodities = [{
        "description": "Commodity description",
        "countryOfManufacture": "US",
        "quantity": 1,
        "quantityUnits": "NO",
        "unitPrice": {
            "amount": 100,
            "currency": "USD"
        },
        "customsValue": {
            "amount": 100,
            "currency": "USD"
        },
        "weight": {
            "units": "KG",
            "value": 3
        }
    }]
) {
    const token = await getAuthentication();
    const bodyToSend = {
        "mergeLabelDocOption": "LABELS_AND_DOCS",
        "requestedShipment": {
            "shipper": shiper,
            "soldTo": (await getPackageConfig("FEDEX")).informacionCuenta,
            "recipients": [recipients],
            "pickupType": "USE_SCHEDULED_PICKUP",
            "serviceType": serviceType,
            "packagingType": packagingType,
            "totalWeight": totalWeight,
            "shippingChargesPayment": {
                "paymentType": "THIRD_PARTY",
                "payor": {
                    "responsibleParty": (await getPackageConfig("FEDEX")).informacionCuenta
                }
            },
            "labelSpecification": {
                "labelStockType": "PAPER_LETTER",
                "imageType": "PDF"
            },
            "rateRequestType": [
                "ACCOUNT"
            ],
            "preferredCurrency": "NMP",
            "totalPackageCount": requestedPackageLineItems.length,
            "requestedPackageLineItems": requestedPackageLineItems
        },
        "labelResponseOptions": "LABEL",
        "accountNumber": {
            "value": (await getPackageConfig("FEDEX")).accountNumbers.sandbox
        },
        "shipAction": "CONFIRM"
    }
    if (recipients.address.countryCode !== "MX") {
        bodyToSend.requestedShipment.customsClearanceDetail = {
            "dutiesPayment": {
                "paymentType": "RECIPIENT"
            },
            "isDocumentOnly": packagingType === "YOUR_PACKAGING" ? false : true,
            "commodities": comodities
        }

        bodyToSend.requestedShipment.shippingDocumentSpecification = {
            "shippingDocumentTypes": [
                "PRO_FORMA_INVOICE",
                "LABEL"
            ],
            "commercialInvoiceDetail": {
                "customerImageUsages": [{
                    "providedImageType":"SIGNATURE"
                }],
                "documentFormat":{
                    "docType":"PDF",
                    "stockType":"PAPER_LETTER"
                }
            }
        }
    }

    try {
        const fetchResponse = await fetch("https://apis-sandbox.fedex.com/ship/v1/shipments", {
            "method": "post",
            "headers": {
                "x-customer-transaction-id": idDataBase,
                "x-locale": "es_MX",
                "content-type": "application/json",
                "authorization": "Bearer " + token
            },
            "body": JSON.stringify(bodyToSend)
        });

        const fetchJSON = await fetchResponse.json();
        console.log("FEDEX_TestShipment", fetchJSON);

        return { "estatus": fetchResponse.ok, "JSON": fetchJSON };
    } catch (err) {
        console.log("FEDEX_TestShipment", err);
        return { "estatus": false, "JSON": err };
    }
}
