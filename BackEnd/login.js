import { authentication, currentMember, badges } from "wix-members-backend"
import { registrationEmail } from "backend/sendMail"

export async function devmodeActiveorDesactiveByUserID(userID) {
    const list = await badges.listMemberBadges([userID]);
    if (list.length) {
        return list[0].badgeIds.length ? true : false;
    } else {
        return false;
    }
}

export async function devmodeActiveorDesactive() {
    const list = await badges.listMemberBadges([(await currentMember.getMember())._id]);
    if (list.length) {
        return list[0].badgeIds.length ? true : false;
    } else {
        return false;
    }
}

export async function devmodeOFF() {
    return await badges.removeMembers("95ff20bf-98fe-4b9d-b154-860a377c86cd", [(await currentMember.getMember())._id])
}

export async function devmodeON() {
    return await badges.assignMembers("95ff20bf-98fe-4b9d-b154-860a377c86cd", [(await currentMember.getMember())._id])
}

export async function register(email, password, firstName, lastName, phone) {
    try {
        const token = (await authentication.register(email, password, { contactInfo: { firstName: firstName, lastName: lastName, phones: [phone] } })).sessionToken
        await registrationEmail(firstName, email);
        return [true, token];
    } catch (error) {
        const errCode = error.details.applicationError.code;
        if (errCode === "-19995") {
            return [false, "User already exists."]
        } else {
            return [false, "Error on signing in. Please try again."]
        }
    }
}

export async function signIn(email, password) {
    try {
        return [true, await authentication.login(email, password)];
    } catch (err) {
        const errCode = err.details.applicationError.code;
        if (errCode === "-19976") {
            return [false, "Wrong email or password."]
        } else if (errCode === "-19999") {
            return [false, "Email not found."]
        } else {
            return [false, "Error on signing in. Please try again."]
        }
    }
}
