import api from "@/lib/api";
import {hostname} from "@/const";

export function findAllPassages(){
    return api({
        url: hostname + "/findAllPassages",
        method: "get"
    })
}

export function findPassageByQuery(query){
    return api({
        url: hostname + "/findPassageByQuery?query=" + query,
        method: "get"
    })
}

export function findQueryInPassage(query){
    return api({
        url: hostname + "/findQueryInPassage?query=" + query,
        method: "get"
    })
}
