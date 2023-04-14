import { sendMailWithAttachment, sendMail } from "backend/Microsoft"

export async function registrationEmail(name, email) {
    return await sendMail("Hi, welcome to DEAP Co Shipments", {
        "contentType": "HTML",
        "content": `<h2 style="text-align: center;"><span style="color: #243763;">Thanks for joining DEAP Co Shipments</span></h2>
<p style="text-align: center;">Hi <strong><span style="color: #ff6e31;">${name}</span></strong>, your account was created successfully!</p>
<p style="text-align: center;">Start quoting parcel services and if you like any of them, create the shipping lable, all in one place.</p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;"><span style="color: #ff6e31;"><strong>Are you a Developer?</strong></span></p>
<p style="text-align: center;">Dive into our documentation to connect your system to our shipping API.</p>
<h3 style="text-align: center;"><a href="https://deapco.stoplight.io/docs/deap-co-shipments/a1o5inxilbd9p-deap-co-shipments" target="_blank"><span style="background-color: #243763; color: #fff; display: inline-block; padding: 3px 10px; font-weight: bold; border-radius: 5px; text-align: center;">API Docs</span></a></h3>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;">Thank you for using</p>
<p><img style="display: block; margin-left: auto; margin-right: auto;" src="https://static.wixstatic.com/media/4c0a11_a6f0f3e56b344bf38ec8a654c8543c80~mv2.png" alt="DEAP Co Shipments" width="209" height="64" /></p>`
    }, [{
        "emailAddress": {
            "address": email
        }
    }])
}

export async function confirmationShipment(name, logo, servicio, trackingID, email, label = [{
    "@odata.type": "#microsoft.graph.fileAttachment",
    "name": "Shipment Label.pdf",
    "contentType": "application/pdf",
    "contentBytes": "label"
}]) {
    return await sendMailWithAttachment("New Shipment Created!", {
        "contentType": "HTML",
        "content": `<h2 style="text-align: center;"><span style="color: #243763;">New Shipment created!</span></h2>
                    <p style="text-align: center;">Hi <strong><span style="color: #ff6e31;">${name}</span></strong>, your shipment was created successfully and here is the information:</p>
                    <table style="border-collapse: collapse; width: 100%; margin-left: auto; margin-right: auto; height: 38px;" border="0">
                    <tbody>
                    <tr style="height: 18px;">
                    <td style="width: 50%; text-align: right; height: 10px;"><img style="display: block; margin-left: auto; margin-right: auto;" src="${logo}" alt="Courier's logo" width="100" height="100" /></td>
                    <td style="width: 50%; height: 10px;">
                    <h3>${servicio}</h3>
                    </td>
                    </tr>
                    <tr style="height: 18px;">
                    <td style="width: 50%; text-align: right; height: 10px;">
                    <h3><strong>Tracking ID:</strong></h3>
                    </td>
                    <td style="width: 50%; height: 10px;">
                    <h3>${trackingID}</h3>
                    </td>
                    </tr>
                    </tbody>
                    </table>
                    <p style="text-align: center;">The shipment's label is attached in this email.</p>
                    <h3 style="text-align: center;"><span style="color: #ff6e31;">Print it, paste it on your package and deliver it.</span></h3>
                    <p style="text-align: center;">Find de nearest counters location with our</p>
                    <h3 style="text-align: center;"><a href="https://www.shipments.deapcomx.com/counter-seeker" target="_blank"><span style="background-color: #243763; color: #fff; display: inline-block; padding: 3px 10px; font-weight: bold; border-radius: 5px; text-align: center;">Counter seeker</span></a></h3>
                    <p style="text-align: center;">&nbsp;</p>
                    <p style="text-align: center;">Thank you for using</p>
                    <p><img style="display: block; margin-left: auto; margin-right: auto;" src="https://static.wixstatic.com/media/4c0a11_a6f0f3e56b344bf38ec8a654c8543c80~mv2.png" alt="DEAP Co Shipments" width="209" height="64" /></p>`
    }, [{
        "emailAddress": {
            "address": email
        }
    }], label);
}
