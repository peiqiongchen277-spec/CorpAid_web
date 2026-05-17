import api from "@/lib/api";
import {hostname} from "@/const";

export function findTimelineByQuery(query: string){
    return api({
        url: hostname + "/findTimelineByQuery?query=" + query,
        method: "get"
    })
}

export function findPAByQuery(query: string){
    return api({
        url: hostname + "/findPAByQuery?query=" + query,
        method: "get"
    })
}

export function eventReportGenerateReport(payload: { prompt: string; private_data_json?: unknown }) {
    return api({
        url: hostname + "/event-report/generate-report",
        method: "post",
        data: payload,
    })
}

export function eventReportGenerateReportStart(payload: { prompt: string; private_data_json?: unknown }) {
    return api({
        url: hostname + "/event-report/generate-report/start",
        method: "post",
        data: payload,
    })
}

export function eventReportGenerateReportStatus(jobId: string) {
    return api({
        url: hostname + "/event-report/generate-report/status/" + encodeURIComponent(jobId),
        method: "get",
    })
}

export function eventReportGenerateReportOutlineSubmit(payload: {
    job_id: string;
    outline_titles: string[];
    outline_text?: string;
    design_plan?: string;
    private_data_json?: unknown;
}) {
    return api({
        url: hostname + "/event-report/generate-report/outline-submit",
        method: "post",
        data: payload,
    })
}

export function eventReportCreateOutline(payload: { user_query: string; private_data_json?: unknown }) {
    return api({
        url: hostname + "/event-report/outline",
        method: "post",
        data: payload,
    })
}

export function eventReportContinue(payload: { session_id: string; new_outline: string; design_plan?: string; private_data_json?: unknown }) {
    return api({
        url: hostname + "/event-report/continue",
        method: "post",
        data: payload,
    })
}

export function eventReportExportPdf(payload: { html_content: string; file_name?: string }) {
    return api({
        url: hostname + "/event-report/generate-report/export-pdf",
        method: "post",
        data: payload,
    })
}