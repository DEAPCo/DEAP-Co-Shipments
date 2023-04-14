/*************************
Production endpoints:

 • Premium site:
   https://mysite.com/_functions/multiply?leftOperand=3&rightOperand=4
 • Free sites:
   https://username.wixsite.com/mysite/_functions/multiply?leftOperand=3&rightOperand=4

Test endpoints:
 • Premium sites:
   https://mysite.com/_functions-dev/multiply?leftOperand=3&rightOperand=4
 • Free sites:
   https://username.wixsite.com/mysite/_functions-dev/multiply?leftOperand=3&rightOperand=4
**********************/

import { ok, badRequest, serverError, response, created } from 'wix-http-functions';
import wixData from 'wix-data';
import { getSecret } from "wix-secrets-backend"
import { getRates, create_Shipment_API } from "backend/RatesAndShipment"
import { devmodeActiveorDesactiveByUserID } from "backend/Login"

const jwt = require('jsonwebtoken');

export async function post_shipment(request) {
    const responseJSON = {
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": request.headers.origin
        }
    };
    try {
        if (request.headers["authorization"]) {
            try {
                const token = String(request.headers["authorization"]).substr(String(request.headers["authorization"]).indexOf(" ") + 1)
                const userInfo = await jwt.verify(token, await getSecret("JWT_Secret_Password"));
                try {
                    const userIDCount = await wixData.query("Members/PrivateMembersData").eq("_id", userInfo.clientID).count({ suppressAuth: true })

                    if (userIDCount) {
                        if (await devmodeActiveorDesactiveByUserID(userInfo.clientID)) {
                            try {
                                const body = await request.body.json();
                                const parcel = String(request.path[0]).toLowerCase()
                                
                                const shipment = await create_Shipment_API(parcel, body, userInfo.email, userInfo.name);
                                if(shipment.status){
                                    return created({...responseJSON, body : shipment});
                                } else {
                                    return badRequest({...responseJSON, body : shipment});
                                }
                            } catch (err) {
                                console.log(err);
                                return badRequest({ ...responseJSON, body: { error: String(err) } });
                            }
                        } else {
                            throw ("DevMode is off. Turn it on in your setting's account.")
                        }
                    } else {
                        throw ("Invalid Bearer Token.")
                    }
                } catch (err) {
                    return response({ ...responseJSON, status: 401, body: { error: err } })
                }
            } catch (err) {
                return response({ ...responseJSON, status: 401, body: { error: "Invalid Bearer Token." } })
            }
        } else {
            return response({ ...responseJSON, status: 401, body: { error: "Missing authentication." } })
        }

    } catch (err) {
        console.log(err);
        return serverError({ ...responseJSON, "body": { "error": err } });
    }
}

export async function post_rates(request) {
    const responseJSON = {
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": request.headers.origin
        }
    };
    try {
        if (request.headers["authorization"]) {
            try {
                const token = String(request.headers["authorization"]).substr(String(request.headers["authorization"]).indexOf(" ") + 1)
                const userInfo = await jwt.verify(token, await getSecret("JWT_Secret_Password"));
                try {
                    const userIDCount = await wixData.query("Members/PrivateMembersData").eq("_id", userInfo.clientID).count({ suppressAuth: true })

                    if (userIDCount) {
                        if (await devmodeActiveorDesactiveByUserID(userInfo.clientID)) {
                            try {
                                const body = await request.body.json();
                                const objectInfo = {
                                    "fedex": {
                                        "shipper": {
                                            "postalCode": body.shipper.zipCode,
                                            "countryCode": body.shipper.countryCode
                                        },
                                        "recipient": {
                                            "postalCode": body.recipient.zipCode,
                                            "countryCode": body.recipient.countryCode
                                        },
                                        "sobre": false,
                                        "packages": [body.package.fedex],
                                        "totalPaquetes": 1
                                    },
                                    "dhl": {
                                        "shipperDetails": {
                                            "postalCode": body.shipper.zipCode,
                                            "cityName": body.shipper.city,
                                            "countryCode": body.shipper.countryCode,
                                        },
                                        "receiverDetails": {
                                            "postalCode": body.recipient.zipCode,
                                            "cityName": body.recipient.city,
                                            "countryCode": body.recipient.countryCode,
                                        },
                                        "packages": [body.package.dhl]
                                    },
                                    "ups": {
                                        "shipper": {
                                            "Address": {
                                                "AddressLine": [
                                                    body.shipper.addressLine
                                                ],
                                                "City": body.shipper.city,
                                                "PostalCode": body.shipper.zipCode,
                                                "StateProvinceCode": body.shipper.stateCode,
                                                "CountryCode": body.shipper.countryCode
                                            }
                                        },
                                        "recipient": {
                                            "Address": {
                                                "AddressLine": [
                                                    body.recipient.addressLine
                                                ],
                                                "City": body.recipient.city,
                                                "PostalCode": body.recipient.zipCode,
                                                "StateProvinceCode": body.recipient.stateCode,
                                                "CountryCode": body.recipient.countryCode
                                            }
                                        },
                                        "pesoTotal": body.totalWeight,
                                        "packages": [body.package.ups],
                                        "numPackages": "1"
                                    }
                                };
                                const rates = await getRates(objectInfo);
                                return ok({ ...responseJSON, "body": rates })
                            } catch (err) {
                                console.log(err);
                                return badRequest({ ...responseJSON, body: { error: String(err) } });
                            }
                        } else {
                            throw ("DevMode is off. Turn it on in your setting's account.")
                        }
                    } else {
                        throw ("Invalid Bearer Token.")
                    }
                } catch (err) {
                    return response({ ...responseJSON, status: 401, body: { error: err } })
                }
            } catch (err) {
                return response({ ...responseJSON, status: 401, body: { error: "Invalid Bearer Token." } })
            }
        } else {
            return response({ ...responseJSON, status: 401, body: { error: "Missing authentication." } })
        }

    } catch (err) {
        console.log(err);
        return serverError({ ...responseJSON, "body": { "error": err } });
    }
}

export async function post_OAuth(request) {
    const responseJSON = {
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": request.headers.origin
        }
    };
    try {
        const body = await request.body.json();
        if (body) {
            const clientID_Key = Object.keys(body).filter(value => value === "clientID");
            if (clientID_Key.length) {
                const clientID = body.clientID;
                const user = (await wixData.query("Members/PrivateMembersData").eq("_id", clientID).find({ suppressAuth: true })).items

                if (user.length) {
                    if (await devmodeActiveorDesactiveByUserID(clientID)) {
                        const token = await jwt.sign({
                            "clientID": clientID,
                            "email":user[0].loginEmail,
                            "name":user[0].name
                        }, await getSecret("JWT_Secret_Password"), { "expiresIn": "24h" });
                        return ok({
                            ...responseJSON,
                            "body": {
                                "access_token": token,
                                "token_type": "Bearer",
                                "expires_in": 86400,
                            }
                        })
                    } else {
                        return response({
                            ...responseJSON,
                            status: 401,
                            body: {
                                error: "DevMode is off. Turn it on in your setting's account."
                            }
                        })
                    }
                } else {
                    return response({
                        ...responseJSON,
                        status: 401,
                        body: {
                            error: "clientID was not found."
                        }
                    });
                }
            } else {
                return response({
                    ...responseJSON,
                    status: 401,
                    body: {
                        error: "Missing authentication."
                    }
                })
            }
        } else {
            return response({
                ...responseJSON,
                status: 401,
                body: {
                    error: "Missing authentication."
                }
            })
        }
    } catch (err) {
        console.log(err);
        return serverError({
            ...responseJSON,
            "body": {
                error: err
            }
        });
    }
}

export async function get_label(request) {
    const label = await wixData.get("EnviosOnline", request.path[0], { suppressAuth: true });
    console.log(request.headers.origin);
    return ok({
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": request.headers.origin
        },
        "body": label.guia
    });
}
