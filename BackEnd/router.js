//Read Our Wix Router API here  http://bo.wix.com/wix-code-reference-docs/wix-router.html 

import { ok, notFound, WixRouterSitemapEntry, forbidden } from "wix-router";
import { getPayment } from "backend/processes.jsw"
import wixData from 'wix-data';

export async function shipment_Router(request) {
    const path = request.path[0];
    if (path === "new") {
        return ok("new-shipment", undefined, { title: "New Shipment | DEAP Co Shipments" })
    } else if (path === "payment") {
        try {
            const paymentInfo = await getPayment(request.query.id);
            if (paymentInfo[0]) {
                return ok("successful-payment", paymentInfo[1], { title: "Payment Successful | DEAP Co Shipments" })
            } else {
                return notFound();
            }
        } catch (err) {
            return notFound()
        }
    } else if (path === "information") {
        try {
            const shipmentInfo = await wixData.get("EnviosOnline",request.path[1],{suppressAuth:true});
            const paymentInfo = await getPayment(shipmentInfo.folioDePago);
            if (shipmentInfo) {
                if(shipmentInfo._owner){
                    return ok("info-shipment", {...shipmentInfo, "paymentInfo":paymentInfo[1]}, { title: "Shipment Information | DEAP Co Shipments" })
                } else {
                    return forbidden();
                }
            } else {
                return notFound();
            }
        } catch (err) {
            return notFound()
        }
    } else {
        return notFound();
    }
}
