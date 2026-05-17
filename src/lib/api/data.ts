import api from "@/lib/api";
import {hostname} from "@/const";

export function findAllData(){
    return api({
        url: hostname + "/findAllData",
        method: "get"
    })
}
