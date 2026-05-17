import api from "@/lib/api";
import {hostname} from "@/const";
import {objToFormData} from "@/lib/tools";

export function userLogin(info) {
    return api({
        url: hostname + "/login",
        method: "post",
        data: objToFormData(info),
        headers: {
            'Content-Type': 'multipart/form-data'
        },
    })
}

export function registerUser(userInfo){
    return api({
        url: hostname + "/insertUserInfo",
        method: "post",
        data: objToFormData(userInfo),
        headers: {
            'Content-Type': 'multipart/form-data'
        },
    })
}

export function findAllUsers() {
    return api({
        url: hostname + "/findAllUsers",
        method: "get",
    })
}