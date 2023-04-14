import { signIn, register } from "backend/Login"
import { authentication } from "wix-members"
import wixLocation from 'wix-location';

$w.onReady(function () {
	if(wixLocation.query.section === "register"){
		ShowRegister();
	}

    $w('#button5').onClick(async () => {
        if ($w('#input1').valid && $w('#input2').valid) {
            $w('#image7').show();
            $w('#text28').collapse();
            const [status, message] = await signIn($w('#input1').value, $w('#input2').value);
            if (status) {
                await authentication.applySessionToken(message);
                wixLocation.to("/account/my-shipments");
            } else {
                $w('#image7').hide();
                $w('#text28').text = message;
                $w('#text28').expand();
            }
        } else {
            $w('#text28').text = "Email or password input missing."
            $w('#text28').expand();
        }
    });
    $w('#text22').onClick(async () => {
        await authentication.promptForgotPassword();
    });

    $w('#button6').onClick(async () => {
        ShowRegister();
    });

    $w('#text26').onClick(async () => {
        await $w('#section2').hide("slide", { duration: 1000, direction: "right" });
        await $w('#section2').collapse();
        await $w('#section1').expand();
        await $w('#section1').show("slide", { duration: 1000, direction: "left" });
        wixLocation.queryParams.remove(["section"]);
    });
	
	$w('#input6').onInput(()=>{
		if($w('#input6').value.length){
			$w('#input7').enable();
		} else {
			$w('#input7').disable();
			$w('#input7').value = "";
		}
	});

	$w('#input7').onInput(()=>{
		if($w('#input7').value === $w('#input6').value ){
			$w('#button7').enable();
		} else {	
			$w('#button7').disable();
		}
	});

	$w('#button7').onClick(async ()=>{
		if ($w('#input4').valid && $w('#input5').valid && $w('#input8').valid && $w('#input3').valid && $w('#input6').valid && $w('#input7').valid) {
			$w('#button7').disable();
            $w('#image6').show();
            $w('#text29').collapse();
            const [status, message] = await register($w('#input3').value, $w('#input7').value, $w('#input4').value, $w('#input5').value, $w('#input8').value);
            if (status) {
                await authentication.applySessionToken(message);
                wixLocation.to("/account/my-shipments");
            } else {
				$w('#button7').enable
                $w('#image6').hide();
                $w('#text29').text = message;
                $w('#text29').expand();
            }
        } else {
            $w('#text29').text = "Input fields are missing."
            $w('#text29').expand();
        }
	});

});

async function ShowRegister() {
    await $w('#section1').hide("slide", { duration: 1000, direction: "right" });
    await $w('#section1').collapse();
    await $w('#section2').expand();
    await $w('#section2').show("slide", { duration: 1000, direction: "left" });
    wixLocation.queryParams.add({ "section": "register" });
}
