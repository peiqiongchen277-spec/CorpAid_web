import api from "@/lib/api";
import {hostname} from "@/const";

export function findEventRelationByQuery(query) {
    return api({
        url: hostname + "/findRelationByQuery?query=" + query,
        method: "get"
    })
}

export function findEventDetailByQueryAndEid(query, eid) {
    return api({
        url: hostname + "/findDetailByQueryAndEid",
        method: "get",
        params: {
            query: query,
            eid: eid
        }
    })
}

export function findPredictionsByQuery(query, predictable) {
    return api({
        url: hostname + "/findPredictionsByQuery",
        method: "get",
        params: {
            query: query,
            predictable: predictable
        }
    })
}