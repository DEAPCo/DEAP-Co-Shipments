import { fetch } from "wix-fetch"
import wixSecretsBackend from 'wix-secrets-backend';

export async function loginWithCredentials() { //Obtener token para usar la aplicacion
    const fetchResponse = await fetch("https://login.microsoftonline.com/4b103a7b-6c5b-43ec-a74b-c4b4702486bc/oauth2/v2.0/token", {
        "method": "post",
        "headers": {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        "body": await wixSecretsBackend.getSecret("MicrosoftKeyNoReply")
    })
    const fetchJSON = await fetchResponse.json();

    return fetchJSON;
}

export async function sendMail(subject = "", body = {
    "contentType": "HTML",
    "content": ""
}, to = [{
    "emailAddress": {
        "address": ""
    }
}]) { //Enviar un email
    const token = await loginWithCredentials();
    const fetchResponse = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        "method": "post",
        "headers": {
            "Authorization": "Bearer " + Object(token).access_token,
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({
            "message": {
                "subject": subject,
                "body": body,
                "from": {
                    "emailAddress": {
                        "address": "noreply@deapcomx.com"
                    }
                },
                "toRecipients": to
            }
        })
    })
    return fetchResponse.ok;
}

export async function sendMailWithAttachment(subject = "", body = {
    "contentType": "HTML",
    "content": ""
}, to = [{
    "emailAddress": {
        "address": ""
    }
}], attachments = [{
    "@odata.type": "#microsoft.graph.fileAttachment",
    "name": "attachment.pdf",
    "contentType": "application/pdf",
    "contentBytes": "SGVsbG8gV29ybGQh"
}]) { //Enviar un email
    const token = await loginWithCredentials();
    const fetchResponse = await  fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        "method": "post",
        "headers": {
            "Authorization": "Bearer " + Object(token).access_token,
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({
            "message": {
                "subject": subject,
                "body": body,
                "from": {
                    "emailAddress": {
                        "address": "noreply@deapcomx.com"
                    }
                },
                "toRecipients": to,
                "attachments": attachments
            }
        })
    });
    return fetchResponse.ok
}
