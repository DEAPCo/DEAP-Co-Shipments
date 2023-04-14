import wixData from 'wix-data';
import { convert } from "current-currency"
import { fetch } from "wix-fetch"
import { getSecret } from "wix-secrets-backend"
import { currentMember } from "wix-members-backend"

export async function getMyShipments() {
    return (await wixData.query("EnviosOnline").eq("_owner", (await currentMember.getMember({ fieldsets: ["FULL"] }))._id).eq("pagado",true).find()).items
}

export async function createCharge(idDabase) {
    const envioInfo = await wixData.get("EnviosOnline", idDabase, { suppressAuth: true });
    const memberInfo = await currentMember.getMember({ fieldsets: ["FULL"] });

    const fetchResponse = await fetch(`https://sandbox-api.openpay.mx/v1/myfhlymn1x3nlrekweuj/charges`, {
        method: "POST",
        headers: {
            "Authorization": "Basic " + await getSecret("OpenPay_Authentication"),
            "Content-type": "application/json"
        },
        body: JSON.stringify({
            'method': 'card',
            'amount': Number(envioInfo.totalPagado),
            'description': envioInfo.jsonRates.service.serviceName,
            'order_id': idDabase,
            'customer': {
                'name': memberInfo.contactDetails.firstName,
                'last_name': memberInfo.contactDetails.lastName,
                'phone_number': memberInfo.contactDetails.phones[0],
                'email': memberInfo.contactDetails.emails[0]
            },
            'send_email': false,
            'confirm': false,
            'redirect_url': 'https://www.shipments.deapcomx.com/shipment/payment'
        })
    });
    const fetchJSON = await fetchResponse.json();
    return fetchJSON.payment_method.url;
}

export async function getPayment(transaction) {
    const fetchResponse = await fetch(`https://sandbox-api.openpay.mx/v1/myfhlymn1x3nlrekweuj/charges/${transaction}`, {
        method: "GET",
        headers: {
            "Authorization": "Basic " + await getSecret("OpenPay_Authentication")
        }
    });

    if (fetchResponse.ok) {
        return [fetchResponse.ok, await fetchResponse.json()];
    } else {
        return [true, {
            "amount":0,
            "currency":"USD",
            "id":transaction,
            "card":{
                "bank_name":"unknow"
            }
        }];
    }

}

/**
 * Guarda los datos obtenidos de la cotización
 * 
 * @param origen {object} Datos de origen como direcciones y contactos de quien manda
 * @param destino {object} Datos de destino como direcciones y contactos de quien manda
 * @param tipoDeEnvio {String} Sobre o Paquete
 * @param dimensiones [Array] Datos de los paquetes a enviar
 * @param jsonRates {Object} Object obtenido como respuesta de los precios
 * @param totalPagado {Number} Total a pagar ya con descuentos aplicados
 * @param nombreMensajeria {String} Nombre de la mensajeria que el cliente seleccionó
 * @param IDMensajeria {String} ID de la mensajería que el cliente seleccionó
 * @param descripcionDelEnvio {String} Descripción de lo que envía el cliente
 * @prama comodities {Array} Informacion necesaria para la aduana, si está vacio, no es envio internacional
 */
export async function saveShipmentDB(origen, destino, tipoDeEnvio, dimensiones, jsonRates, totalPagado, nombreMensajeria, IDMensajeria, descripcionDelEnvio, comodities) {
    try {
        const saveInfo = await wixData.insert("EnviosOnline", {
            "origen": origen,
            "destino": destino,
            "tipoDeEnvio": tipoDeEnvio,
            "dimensiones": dimensiones,
            "jsonRates": jsonRates,
            "totalPagado": totalPagado,
            "pagado": false,
            "nombreMensajeria": nombreMensajeria,
            "idMensajeria": IDMensajeria,
            "descripcionDelEnvio": descripcionDelEnvio,
            "comodities": comodities
        });

        return { "estatus": true, "id": saveInfo._id };
    } catch (err) {
        console.log(err);
        return { "estatus": false };
    }
}

export async function currencyExchange(currency, amount) {
    if (currency !== "MXN") {
        return Math.ceil((await convert(currency, amount, "MXN")).amount);
    } else {
        return amount;
    }
}

export async function getAllCountries() {
    var toReturn = [];
    const states = await require('country-state-city').Country.getAllCountries();

    for (let i = 0; i < states.length; i++) {
        toReturn.push({ "label": states[i].name, "value": states[i].isoCode });
    }

    return toReturn;
}

export async function getStatesOfCountry(country) {
    var toReturn = [];
    const states = await require('country-state-city').State.getStatesOfCountry(country);

    for (let i = 0; i < states.length; i++) {
        toReturn.push({ "label": states[i].name, "value": states[i].isoCode });
    }

    return toReturn;
}
