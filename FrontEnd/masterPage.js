import { authentication, currentMember } from "wix-members"
import wixLocation from 'wix-location';

$w.onReady(async function () {
    if (authentication.loggedIn()) {
        $w('#button4').label = "Logout"
        $w('#text354').text = "Hi " + (await currentMember.getMember({fieldsets:["FULL"]})).contactDetails.firstName + "!"
        $w('#button8,#button27').show("fade",{duration:1000});
        $w('#text354').expand()

        $w('#button4').onClick(() => {
            authentication.logout();
        });
    } else {
        $w('#button4').label = "Login"
        $w('#button4').link = "/sign-in"
        $w('#button8,#button27').hide()
        $w('#text354').collapse();
    }

    authentication.onLogout(() => {
        wixLocation.to("/");
    });
});
