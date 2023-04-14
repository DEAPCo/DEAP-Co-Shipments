export class Address {
    #pais;
    #estado;
    #ciudad;
    #calle;
    #numExt;
    #numInt;
    #cp;

    constructor(pais = "", estado = "", ciudad = "", calle = "", numExt = "", numInt = "", cp = "") {
        this.#pais = pais;
        this.#estado = estado;
        this.#ciudad = ciudad;
        this.#calle = calle;
        this.#numExt = numExt;
        this.#numInt = numInt;
        this.#cp = cp;
    }
    reset(pais = "", estado = "", ciudad = "", calle = "", numExt = "", numInt = "", cp = "") {
        this.#pais = pais;
        this.#estado = estado;
        this.#ciudad = ciudad;
        this.#calle = calle;
        this.#numExt = numExt;
        this.#numInt = numInt;
        this.#cp = cp;
    }
    pais(pais) {
        if (pais) {
            this.#pais = pais;
        } else {
            return this.#pais;
        }
    }
    estado(estado) {
        if (estado) {
            this.#estado = estado;
        } else {
            return this.#estado;
        }
    }
    ciudad(ciudad) {
        if (ciudad) {
            this.#ciudad = ciudad;
        } else {
            return this.#ciudad;
        }
    }
    calle(calle) {
        if (calle) {
            this.#calle = calle;
        } else {
            return this.#calle;
        }
    }
    numExt(num) {
        if (num) {
            this.#numExt = num;
        } else {
            return this.#numExt;
        }
    }
    numInt(num) {
        if (num) {
            this.#numInt = num;
        } else {
            return this.#numInt;
        }
    }
    cp(cp) {
        if (cp) {
            this.#cp = cp;
        } else {
            return this.#cp;
        }
    }
    stringfy() {
        return `${this.#numExt} ${this.#calle} ${this.#numInt ? " Apt. " + this.#numInt : ""}, ${this.#ciudad}, ${this.#estado}, ${this.#cp}, ${this.#pais}`;
    }
    JSON() {
        return {
            "city": this.#ciudad,
            "streetAddress": {
                "number": `${this.#numExt}${this.#numInt ? " Apt. " + this.#numInt : ""}`,
                "name": this.#calle,
                "formattedAddressLine": `${this.#numExt} ${this.#calle} ${this.#numInt ? " Apt. " + this.#numInt : ""}`
            },
            "formatted": `${this.#numExt} ${this.#calle} ${this.#numInt ? " Apt. " + this.#numInt : ""}, ${this.#ciudad}, ${this.#estado}, ${this.#cp}, ${this.#pais}`,
            "country": this.#pais,
            "postalCode": this.#cp,
            "subdivision": this.#estado,
        }
    }
    internacional() {
        if (this.#pais !== "MX") {
            return true;
        } else {
            return false;
        }
    }
}
