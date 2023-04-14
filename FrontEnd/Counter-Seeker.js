import wixWindow from 'wix-window';

$w.onReady( function () {
    wixWindow.getCurrentGeolocation().then(async (geo) => {
        const location = geo.coords
        await $w('#section2').hide("slide", { duration: 1000, direction: "top" });
        await $w('#section2').collapse();
        await $w('#section3').expand();
        await $w('#section3').show("slide", { duration: 1000, direction: "top" });

        const URI = "https://www.google.com/maps/search/";
        const URIGeolocation = `/@${location.latitude},${location.longitude},14.3z?hl=es-ES`

        $w('#image4').link = URI + "FEDEX" + URIGeolocation;
        $w('#image5').link = URI + "UPS" + URIGeolocation;
        $w('#image6').link = URI + "DHL" + URIGeolocation;
    });

});
