import wixSecretsBackend from 'wix-secrets-backend';
import { fetch } from "wix-fetch"
import { getPackageConfig } from 'wix-configs-backend';

async function getAuthentication() {
    const auth = JSON.parse(await wixSecretsBackend.getSecret("UPS_Authentication"));
    const authEncoded = require('nodejs-base64-encode').encode(auth.client_id + ":" + auth.client_secret, 'base64');

    const fetchResponse = await fetch("https://onlinetools.ups.com/security/v1/oauth/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + authEncoded,
            "Accept": "application/json"
        },
        body: "grant_type=client_credentials"
    })

    return { "ok": fetchResponse.ok, "JSON": await fetchResponse.json() }
}

async function timeInTransit(token = {}, origen = { "country": "MX", "state": "MO", "city": "Cuernavaca", "cp": "62440" }, destino = { "country": "MX", "state": "DF", "city": "Ciudad de Mexico", "cp": "04810" }, peso = "0", numPaquetes = "1") {
    const date = new Date();
    if (date.getUTCHours() > 5) {
        date.setDate(date.getDate() + 1);
    }
    date.getUTCDay() === 6 ? date.setDate(date.getDate() + 1) : date.setDate(date.getDate());
    date.getUTCDay() === 0 ? date.setDate(date.getDate() + 1) : date.setDate(date.getDate());
    const dateInString = date.getFullYear() + "-" + date.toLocaleDateString(undefined, { "month": "2-digit" }) + "-" + date.toLocaleDateString(undefined, { "day": "2-digit" });

    try {
        const fetchResponse = await fetch("https://onlinetools.ups.com/api/shipments/v1/transittimes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `${token.JSON.token_type} ${token.JSON.access_token}`,
                "accept": "application/json",
                "transactionSrc": "testing",
                "transId": "testing"
            },
            body: JSON.stringify({
                "originCountryCode": origen.country,
                "originStateProvince": origen.state,
                "originCityName": origen.city,
                "originPostalCode": origen.cp,

                "destinationCountryCode": destino.country,
                "destinationStateProvince": destino.state,
                "destinationCityName": destino.city,
                "destinationPostalCode": destino.cp,

                "weight": peso,
                "weightUnitOfMeasure": "KGS",
                "shipDate": dateInString,
                "numberOfPackages": numPaquetes
            })
        });

        const fetchJSON = await fetchResponse.json();
        console.log("UPS_TimeInTransit", fetchJSON);

        if (fetchResponse.ok) {
            return fetchJSON.emsResponse.services[0].deliveryDate;
        } else {
            return undefined;
        }
    } catch (err) {
        return undefined;
    }
}

/**
 * Obtener tarifas de entrega con las direcciones de origen/destino introducidas
 * 
 * @param values {Object} Objeto representando los datos de origen y destino del paquete así como sus dimensiones
 * 
 * @param values.shipper {Object} Objeto indicando el origen del paquete
 * @param values.shipper.Address {Object}  Objeto indicando el origen del paquete
 * @param values.shipper.Address.AddressLine {Array} Lineas de la dirección de recolección
 * @param values.shipper.Address.City {String} Ciudad de recolección
 * @param values.shipper.Address.PostalCode {String} Código postal del origen del paquete
 * @param values.shipper.Address.StateProvinceCode {String} Código ISO del estado del origen del paquete
 * @param values.shipper.Address.CountryCode {String} Código ISO del país de origen del paquete
 * 
 * @param values.recipient {Object} Objeto indicando el destino del paquete
 * @param values.recipient.Address {Object} Objeto indicando el destino del paquete
 * @param values.recipient.Address.AddressLine {Array} Lineas de la dirección de entrega
 * @param values.recipient.Address.City {String} Ciudad de entrega
 * @param values.recipient.Address.PostalCode {String} Código postal de entrega del paquete
 * @param values.recipient.Address.StateProvinceCode {String} Código ISO del estado del destino del paquete
 * @param values.recipient.Address.CountryCode {String} Código ISO del país de destino del paquete
 * 
 * @param values.pesoTotal {String} Peso total del envio
 * 
 * @param values.packages {Array} Agrega la información de los paquetes del envío
 * 
 * @param values.numPackages {String} Número total de paquetes a enviar
 * 
 * @return {Promise <Array>} Array de servicios con costos disponibles para las direcciones de origen/destino introducidas
 */
export async function UPS_getRates(values = {
    "shipper": {
        "Address": {
            "AddressLine": [
                "México 95D km 104, Real del Puente"
            ],
            "City": "Xochitepec",
            "PostalCode": "62790",
            "StateProvinceCode": "MO",
            "CountryCode": "MX"
        }
    },
    "recipient": {
        "Address": {
            "AddressLine": [
                "Atlixcáyotl 5718, Reserva Territorial Atlixcáyotl"
            ],
            "City": "Puebla",
            "PostalCode": "72453",
            "StateProvinceCode": "PU",
            "CountryCode": "MX"
        }
    },
    "pesoTotal": "3",
    "packages": [{
        "PackagingType": {
            "Code": "02"
        },
        "Dimensions": {
            "UnitOfMeasurement": {
                "Code": "CM"
            },
            "Length": "10",
            "Width": "10",
            "Height": "10"
        },
        "PackageWeight": {
            "UnitOfMeasurement": {
                "Code": "KGS"
            },
            "Weight": "3"
        }
    }],
    "numPackages": "1"
}) {
    const token = await getAuthentication();

    try {
        const fetchResponse = await fetch("https://onlinetools.ups.com/api/rating/v1/Rate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `${token.JSON.token_type} ${token.JSON.access_token}`,
                "accept": "application/json"
            },
            body: JSON.stringify({
                "RateRequest": {
                    "Shipment": {
                        "Shipper": {
                            ...values.shipper,
                            "ShipperNumber": (await getPackageConfig("UPS")).accountNumber.number
                        },
                        "ShipTo": values.recipient,
                        "ShipFrom": values.shipper,
                        "PaymentDetails": {
                            "ShipmentCharge": {
                                "Type": "01",
                                "BillShipper": {
                                    "AccountNumber": (await getPackageConfig("UPS")).accountNumber.number,
                                }
                            }
                        },
                        "Service": {
                            "Code": "65",
                        },
                        "ShipmentTotalWeight": {
                            "UnitOfMeasurement": {
                                "Code": "KGS",
                            },
                            "Weight": values.pesoTotal
                        },
                        "NumOfPieces": values.numPackages,
                        "Package": values.packages
                    }
                }
            })
        });

        const fetchJSON = await fetchResponse.json();
        console.log("UPS_getRates", fetchJSON);

        const incremento = Math.abs(Number((await getPackageConfig("UPS")).incrementoDePrecio));
        console.log("UPS Incremento",incremento);

        if (fetchResponse.ok) {
            return [{
                "_id": "UPS0",
                "parcel": {
                    "name": "UPS",
                    "image": "https://static.wixstatic.com/shapes/4c0a11_a57c32c3921e43f6aa808e5281f3f2ee.svg",
                    "color": "#351C15",
                    "id": "ups"
                },
                "service": {
                    "serviceType": "65",
                    "serviceName": "UPS Express Saver"
                },
                "rate": {
                    "total": fetchJSON.RateResponse.RatedShipment.TotalCharges.MonetaryValue + incremento,
                    "currency": fetchJSON.RateResponse.RatedShipment.TotalCharges.CurrencyCode,
                },
                "shipmentWeight": fetchJSON.RateResponse.RatedShipment.RatedPackage.Weight,
                "deliveryDate": await timeInTransit(token, { "country": values.shipper.Address.CountryCode, "state": values.shipper.Address.StateProvinceCode, "city": values.shipper.Address.City, "cp": values.shipper.Address.PostalCode }, { "country": values.recipient.Address.CountryCode, "state": values.recipient.Address.StateProvinceCode, "city": values.recipient.Address.City, "cp": values.recipient.Address.PostalCode }, values.pesoTotal, values.packages.length),
                "JSONoriginal": fetchJSON
            }];
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
 * @param origen {Object} Datos de recolección
 * 
 * @param origen.Name {String} Nombre del remitente
 * @param origen.AttentionName {String} Nombre del remitente
 * @param origen.Address {Object} Dirección de recolección
 * @param origen.Address.AddressLine {String} Lineas de la dirección de recolección
 * @param origen.Address.City {String} Ciudad de recolección
 * @param origen.Address.StateProvinceCode {String} Estado de recolección
 * @param origen.Address.PostalCode {String} Código postal del origen del paquete
 * @param origen.Address.CountryCode {String} Código ISO del país de origen del paquete
 * @param origen.Phone {Object} Contacto de la recolección
 * @param origen.Phone.Number {String}  Telefono del remitente
 * 
 * @param destino {Object} Datos de entrega
 * @param destino.Name {String} Nombre del destinatario
 * @param destino.AttentionName {String} Nombre del destinatario
 * @param destino.Address {Object} Dirección de la entrega
 * @param destino.Address.AddressLine {String} Lineas de la dirección de entrega
 * @param destino.Address.City {String} Ciudad de la entrega
 * @param destino.Address.StateProvinceCode {String} Estado de la entrega
 * @param destino.Address.PostalCode {String} Código postal del destino del paquete
 * @param destino.Address.CountryCode {String} Código ISO del país del destino del paquete
 * @param destino.Phone {Object} Contacto de la entrega
 * @param destino.Phone.Number {String}  Telefono del destinatario
 * 
 * @param service {String} Código del tipo de servicio que eligió el cliente
 * 
 * @param packages {Array} Agrega la información de los paquetes del envío
 * 
 * @return {Promise <Object>} Indica si el envío se generó correctamente {"estatus":Boolean, "JSON":JSON del fetch}
 */
export async function UPS_Testing_sendShipment(
    origen = {
        "Name": "Diego Efrain",
        "AttentionName": "Diego Efrain",
        "Address": {
            "AddressLine": "1a Privada de las Flores 17",
            "City": "Cuernavaca",
            "StateProvinceCode": "MO",
            "PostalCode": "62440",
            "CountryCode": "MX"
        },
        "Phone": {
            "Number": "7774942202"
        }
    }, destino = {
        "Name": "Efra Antonio",
        "AttentionName": "Efra Antonio",
        "Address": {
            "AddressLine": "Lira 48",
            "City": "Ciudad de Mexico",
            "StateProvinceCode": "CMX",
            "PostalCode": "04810",
            "CountryCode": "MX"
        },
        "Phone": {
            "Number": "5543233015"
        }
    }, service = "65",
    packages = [{
        "PackagingType": {
            "Code": "02"
        },
        "Dimensions": {
            "UnitOfMeasurement": {
                "Code": "CM"
            },
            "Length": "8",
            "Width": "2",
            "Height": "2"
        },
        "PackageWeight": {
            "UnitOfMeasurement": {
                "Code": "KGS"
            },
            "Weight": "20.2"
        }
    }], descripcionDelEnvio = "Envio de mensajeria") {
    const token = await getAuthentication();

    const packagesChanged = packages.map(({
        PackagingType: Packaging,
        ...rest
    }) => ({
        Packaging,
        ...rest
    }));

    try {
        const fetchResponse = await fetch("https://wwwcie.ups.com/api/shipments/v1/ship", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `${token.JSON.token_type} ${token.JSON.access_token}`,
                "accept": "application/json"
            },
            body: JSON.stringify({
                "ShipmentRequest": {
                    "Request": {
                        "RequestOption": "validate",
                        "SubVersion": "1807"
                    },
                    "Shipment": {
                        "Description": descripcionDelEnvio,
                        "Shipper": {
                            ...origen,
                            "ShipperNumber": (await getPackageConfig("UPS")).accountNumber.number
                        },
                        "ShipTo": destino,
                        "ShipFrom": origen,
                        "PaymentInformation": {
                            "ShipmentCharge": {
                                "Type": "01",
                                "BillShipper": {
                                    "AccountNumber": (await getPackageConfig("UPS")).accountNumber.number,
                                }
                            }
                        },
                        "Service": {
                            "Code": service
                        },
                        "Package": packagesChanged
                    },
                    "LabelSpecification": {
                        "LabelImageFormat": {
                            "Code": "GIF"
                        },
                        "CharacterSet": "spa",
                        "LabelStockSize": {
                            "Height": "6",
                            "Width": "4"
                        }
                    }
                }
            })
        });

        const fetchJSON = await fetchResponse.json();
        console.log("UPS_TestingShipment", fetchJSON);

        return { "estatus": fetchResponse.ok, "JSON": fetchJSON }
    } catch (err) {
        return { "estatus": false, "JSON": err };
    }
}
