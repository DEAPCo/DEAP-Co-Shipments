import { fetch } from "wix-fetch"
import wixSecretsBackend from 'wix-secrets-backend';
import { getPackageConfig } from "wix-configs-backend"

async function getAuth() {
    const auth = JSON.parse(await wixSecretsBackend.getSecret("DHL_Authentication"));
    return await encodeFromNPM(auth.client_id + ":" + auth.client_secret)
}

async function encodeFromNPM(string) {
    return await require('nodejs-base64-encode').encode(string, 'base64');
}

/**
 * Obtener tarifas de entrega con las direcciones de origen/destino introducidas
 * 
 * @param values {Object} Objeto representando los datos de origen y destino del paquete así como sus dimensiones
 * 
 * @param values.shipperDetails {Object} Objeto donde indicando el origen del paquete
 * @param values.shipperDetails.postalCode {String} Código postal del origen del paquete
 * @param values.shipperDetails.cityName {String} Ciudad del origen del paquete
 * @param values.shipperDetails.countryCode {String} Código ISO del país de origen del paquete
 * 
 * @param values.receiverDetails {Object} Objeto donde indicando el destino del paquete
 * @param values.receiverDetails.postalCode {String} Código postal del destino del paquete
 * @param values.receiverDetails.cityName {String} Ciudad del destino del paquete
 * @param values.receiverDetails.countryCode {String} Código ISO del país de destino del paquete
 * 
 * @param values.packages {Array} Agrega la información de los paquetes del envío
 * 
 * @return {Promise <Array>} Array de servicios con costos disponibles para las direcciones de origen/destino introducidas
 */
export async function DHL_getRates(
    values = {
        "shipperDetails": {
            "postalCode": "04810",
            "cityName": "Ciudad de Mexico",
            "countryCode": "MX"
        },
        "receiverDetails": {
            "postalCode": "92832",
            "cityName": "Fullerton",
            "countryCode": "US"
        },
        "packages": [{
            "weight": 3,
            "dimensions": {
                "length": 10,
                "width": 10,
                "height": 10
            }
        }]
    }) {
    const auth = await getAuth();
    const date = new Date();
    if (date.getUTCHours() > 5) {
        date.setDate(date.getDate() + 1);
    }
    date.getUTCDay() === 6 ? date.setDate(date.getDate() + 1) : date.setDate(date.getDate());
    date.getUTCDay() === 0 ? date.setDate(date.getDate() + 1) : date.setDate(date.getDate());
    const dateInString = date.getFullYear() + "-" + date.toLocaleDateString(undefined, { "month": "2-digit" }) + "-" + date.toLocaleDateString(undefined, { "day": "2-digit" }) + "T" + "11:30:00GMT-06:00";

    try {
        const bodyToSend = {
            "customerDetails": {
                "shipperDetails": values.shipperDetails,
                "receiverDetails": values.receiverDetails
            },
            "payerCountryCode": "MX",
            "plannedShippingDateAndTime": dateInString, // "2022-11-16T13:00:00GMT-05:00",
            "unitOfMeasurement": "metric",
            "isCustomsDeclarable": true,
            "packages": values.packages
        };

        if (values.receiverDetails.countryCode === "MX") {
            bodyToSend.productsAndServices = [{
                "productCode": "O"
            }, {
                "productCode": "1"
            }, {
                "productCode": "N"
            }];
        } else {
            bodyToSend.productsAndServices = [{
                "productCode": "M"
            }, {
                "productCode": "Y"
            }, {
                "productCode": "P"
            }];
        }

        const fetchResponse = await fetch("https://express.api.dhl.com/mydhlapi/rates", {
            "method": "POST",
            "headers": {
                "Authorization": "Basic " + auth,
                'content-type': 'application/json'
            },
            "body": JSON.stringify(bodyToSend)
        });

        const fetchJson = await fetchResponse.json();
        console.log("DHL_Rates", fetchJson);

        const incremento = Math.abs(Number((await getPackageConfig("DHL")).incrementoDePrecio));
        console.log("DHL Incremento", incremento);

        if (fetchResponse.ok) {
            var toReturn = [];
            for (let i = 0; i < fetchJson.products.length; i++) {
                if (fetchJson.products[i].totalPrice[0].price !== 0) {
                    toReturn.push({
                        "_id": "DHL" + String(i),
                        "parcel": {
                            "name": "DHL",
                            "image": "https://static.wixstatic.com/shapes/4c0a11_859c3a68f51d4a74aaceb0fa485e1446.svg",
                            "color": "#FFCC00",
                            "id": "dhl"
                        },
                        "service": {
                            "serviceType": fetchJson.products[i].productCode,
                            "serviceName": "DHL " + fetchJson.products[i].productName
                        },
                        "rate": {
                            "total": fetchJson.products[i].totalPrice[0].price + incremento,
                            "currency": fetchJson.products[i].totalPrice[0].priceCurrency,
                        },
                        "shipmentWeight": fetchJson.products[i].weight.provided,
                        "deliveryDate": fetchJson.products[i].deliveryCapabilities.estimatedDeliveryDateAndTime,
                        "JSONoriginal": {
                            "product": fetchJson.products[i],
                        }
                    });
                }
            }
            return toReturn;
        } else {
            return [];
        }
    } catch (err) {
        return [];
    }

}

/**
 * TESTING Realizar el envío de un paquete para obtener la guía de embarque y los datos finales
 * 
 * @param shiper {Object} Datos de recolección
 * 
 * @param shiper.postalAddress {Object} Dirección de recolección
 * @param shiper.postalAddress.postalCode {String} Código postal de recolección
 * @param shiper.postalAddress.cityName {String} Ciudad de recolección
 * @param shiper.postalAddress.countryCode {String} Código ISO del país de recolección
 * @param shiper.postalAddress.addressLine1 {String} Lineas de la dirección de recolección
 * 
 * @param shiper.contactInformation {Object} Contacto de la recolección
 * @param shiper.contactInformation.phone {String} Telefono del remitente
 * @param shiper.contactInformation.companyName {String} Nombre del remitente
 * @param shiper.contactInformation.fullName {String} Nombre del remitente
 * 
 * 
 * @param recipients {Object} Datos de entrega
 * 
 * @param recipients.postalAddress {Object} Dirección de entrega
 * @param recipients.postalAddress.postalCode {String} Código postal de entrega
 * @param recipients.postalAddress.cityName {String} Ciudad de entrega
 * @param recipients.postalAddress.countryCode {String} Código ISO del país de entrega
 * @param recipients.postalAddress.addressLine1 {String} Lineas de la dirección de entrega
 * 
 * @param recipients.contactInformation {Object} Contacto de la entrega
 * @param recipients.contactInformation.phone {String} Telefono del destinatario
 * @param recipients.contactInformation.companyName {String} Nombre del destinatario
 * @param recipients.contactInformation.fullName {String} Nombre del destinatario
 * 
 * 
 * @param productCode {String} Código del tipo de servicio que eligió el cliente
 * 
 * @param packages {Array} Agrega la información de los paquetes del envío
 * 
 * @param idDataBase {String} ID del elemento en DB para matchear que sea el mismo envío
 * 
 * @param empresa {String} Nombre de la empresa para poder obtener su logo y se incruste en la guía de envio "simp", "paqueto", "DEAPCo"
 * 
 * @return {Promise <Object>} Indica si el envío se generó correctamente {"estatus":Boolean, "JSON":JSON del fetch}
 */
export async function DHL_Testing_sendShipment(
    shiper = {
        "postalAddress": {
            "postalCode": "04810",
            "cityName": "CDMX",
            "countryCode": "MX",
            "addressLine1": "Lira 48, Prados de Coyoacan"
        },
        "contactInformation": {
            "phone": "+1123456789",
            "companyName": "Usuario individual",
            "fullName": "John Brew"
        }
    },
    recipients = {
        "postalAddress": {
            "postalCode": "04810",
            "cityName": "CDMX",
            "countryCode": "MX",
            "addressLine1": "Lira 48, Prados de Coyoacan"
        },
        "contactInformation": {
            "phone": "+1123456789",
            "companyName": "Usuario individual",
            "fullName": "John Brew"
        }
    },
    productCode = "",
    packages = [{
        "weight": 0,
        "dimensions": {
            "length": 0,
            "width": 0,
            "height": 0
        }
    }],
    idDataBase = "",
    empresa = "") {

    const auth = await getAuth();
    const date = new Date();
    if (date.getUTCHours() > 5) {
        date.setDate(date.getDate() + 1);
    }
    date.getUTCDay() === 6 ? date.setDate(date.getDate() + 1) : date.setDate(date.getDate());
    date.getUTCDay() === 0 ? date.setDate(date.getDate() + 1) : date.setDate(date.getDate());
    const dateInString = date.getFullYear() + "-" + date.toLocaleDateString(undefined, { "month": "2-digit" }) + "-" + date.toLocaleDateString(undefined, { "day": "2-digit" }) + "T" + "11:30:00GMT-06:00";

    try {
        const fetchResponse = await fetch("https://express.api.dhl.com/mydhlapi/test/shipments", {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Message-Reference': idDataBase,
                Authorization: "Basic " + auth
            },
            body: JSON.stringify({
                "plannedShippingDateAndTime": dateInString, //"2019-08-04T14:00:31GMT+01:00",
                "customerDetails": {
                    "shipperDetails": shiper,
                    "receiverDetails": recipients,
                    "sellerDetails": (await getPackageConfig("DHL")).informacionCuenta,
                },
                "pickup": {
                    "isRequested": true,
                    "pickupDetails": shiper
                },
                "productCode": productCode,
                "accounts": [(await getPackageConfig("DHL")).accountNumbers],
                "outputImageProperties": {
                    "customerLogos": [{
                        "fileFormat": "JPG",
                        "content": logoBase64(empresa)
                    }],
                    "encodingFormat": "pdf",
                    "imageOptions": [{
                        "typeCode": "label",
                        "fitLabelsToA4": true,
                    }, {
                        "typeCode": "waybillDoc",
                        "templateName": "ARCH_8X4",
                        "isRequested": true,
                        "hideAccountNumber": true,
                        "numberOfCopies": 1
                    }],
                    "splitTransportAndWaybillDocLabels": true,
                    "allDocumentsInOneImage": true,
                    "splitDocumentsByPages": true,
                    "splitInvoiceAndReceipt": true,
                    "receiptAndLabelsInOneImage": true
                },
                "content": {
                    "packages": packages,
                    "isCustomsDeclarable": false,
                    "description": "Envio de mensajería",
                    "incoterm": "DAP",
                    "unitOfMeasurement": "metric"
                },
                "estimatedDeliveryDate": {
                    "isRequested": true,
                    "typeCode": "QDDF"
                }
            })
        });

        const fetchJson = await fetchResponse.json();
        console.log("DHL_TestingShipment", fetchJson);

        return { "estatus": fetchResponse.ok, "JSON": fetchJson };
    } catch (err) {
        return { "estatus": false, "JSON": err }
    }
}
