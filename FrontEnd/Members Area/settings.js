import { devmodeOFF, devmodeON, devmodeActiveorDesactive } from "backend/Login"
import {currentMember} from "wix-members"

$w.onReady(async function () {
	$w('#switch2').checked = await devmodeActiveorDesactive()

    $w('#switch2').onChange(() => {
        if ($w('#switch2').checked) {
            devmodeON()
        } else {
            devmodeOFF()
        }
    });

    $w('#text355').text += (await currentMember.getMember())._id

});
