
"use strict";

import axios from "axios";
import { decryptionData } from "./crypto";
import { config } from "../config/constants";
const BASEURL = config.BaseUrl;
const validateHeaders = (req, isAuth) => {
    let response = {
        error: false,
        message: "",
    };
    if (isAuth) {
        if (req.header('Authorization') === undefined && req.header('role') === undefined) {
            response = {
                error: true,
                message: "Athorization token and role in header is required",
            }
        } else if (req.header('Authorization') === undefined) {
            response = {
                error: true,
                message: "Athorization token is required",
            }
        } else if (req.header('role') === undefined) {
            response = {
                error: true,
                message: "role in header is required",
            }
        }
    } else {
        if (req.header('role') === undefined) {
            response = {
                error: true,
                message: "role in header is required",
            }
        }
    }
    return response;
}
class Http {
    getStaging(path, data, headers, service) {
        const baseurl = BASEURL[service];
        return new Promise((resolve, reject) => {
            axios({
                method: 'get',
                url: `${baseurl}/${path}`,
                params: data,
                headers
            }).then(async function (response) {
                if (config.NODE_ENV == "local") {
                    resolve(response.data)
                } else {
                    const decryData = await decryptionData(response.data)
                    const obj = JSON.parse(decryData);
                    resolve(obj)
                }
            }).catch(async function (error) {
                
                reject(error)
            });
        })
    }
    postStaging(path, data, headers, service) {
        const baseurl = BASEURL[service];
        return new Promise((resolve, reject) => {
            axios({
                method: 'post',
                url: `${baseurl}/${path}`,
                data,
                headers
            }).then(async function (response) {
                if (config.NODE_ENV == "local") {
                    resolve(response.data)
                } else {
                    const decryData = await decryptionData(response.data)
                    const obj = JSON.parse(decryData);
                    resolve(obj)
                }
            }).catch(async function (error) {
                reject(error)
            });
        })
    }

    putStaging(path, data, headers, service) {
        const baseurl = BASEURL[service];
        return new Promise((resolve, reject) => {
            axios({
                method: 'put',
                url: `${baseurl}/${path}`,
                data,
                headers
            }).then(async function (response) {
                if (config.NODE_ENV == "local") {
                    resolve(response.data)
                } else {
                    const decryData = decryptionData(response.data)
                    const obj = JSON.parse(decryData);
                    resolve(obj)
                }
            }).catch(async function (error) {
                
                reject(error)
            });
        })
    }

    postStagingChat(path, data, headers, service) {        
        const baseurl = BASEURL[service];
        return new Promise((resolve, reject) => {
            axios({
                method: 'post',
                url: `${baseurl}/${path}`,
                data,
                headers
            }).then(async function (response) {
                if (config.NODE_ENV == "local") {
                    resolve(response.data)
                } else {
                    const decryData = await decryptionData(response.data)
                    const obj = JSON.parse(decryData);
                    resolve(obj)
                }
            }).catch(async function (error) {
                reject(error)
            });
        })
    }

    getTotalMessagesCount(path, data, headers, service) {        
        const baseurl = BASEURL[service];
        return new Promise((resolve, reject) => {
            axios({
                method: 'get',
                url: `${baseurl}/${path}`,
                data,
                headers
            }).then(async function (response) {
                if (config.NODE_ENV == "local") {
                    resolve(response.data)
                } else {
                    const decryData = await decryptionData(response.data)
                    const obj = JSON.parse(decryData);
                    resolve(obj)
                }
            }).catch(async function (error) {
                reject(error)
            });
        })
    }

    readMessagesCount(path, data, headers, service) {        
        const baseurl = BASEURL[service];
        return new Promise((resolve, reject) => {
            axios({
                method: 'get',
                url: `${baseurl}/${path}`,
                data,
                headers
            }).then(async function (response) {
                if (config.NODE_ENV == "local") {
                    resolve(response.data)
                } else {
                    const decryData = await decryptionData(response.data)
                    const obj = JSON.parse(decryData);
                    resolve(obj)
                }
            }).catch(async function (error) {
                reject(error)
            });
        })
    }

    async getWithAuth(req, res, endpoint, service) {
        const baseurl = BASEURL[service];
        const checkHeaders = validateHeaders(req, true)
        if (checkHeaders.error) {
            return res.status(500).json(checkHeaders.message)
        }
        const token = req.header("Authorization");
        const role = req.header("role");
        try {
            axios({
                method: 'get',
                url: `${baseurl}/${endpoint}`,
                params: req.query,
                headers: { 'Authorization': token || '', role },
            }).then(async function (response) {
                await res.status(200).json({ data: response.data })
            }).catch(async function (error) {
                console.log(error, "getWithAuth>>>>>>>>>>")
                await res.status(error.response.status).json(error.response.data)
            });
        } catch (error) {
            await res.status(error.response.status).json(error.response.data)
        }
    }
    async getWithoutAuth(req, res, endpoint, service) {
        const baseurl = BASEURL[service];
        const checkHeaders = validateHeaders(req, false)
        if (checkHeaders.error) {
            return res.status(500).json(checkHeaders.message)
        }
        const role = req.header("role");
        try {
            axios({
                method: 'get',
                url: `${baseurl}/${endpoint}`,
                params: req.query,
                headers: { role },
            }).then(async function (response) {
                await res.status(200).json({ data: response.data })
            }).catch(async function (error) {
                await res.status(error.response.status).json(error.response.data)
            });
        } catch (error) {
            await res.status(error.response.status).json(error.response.data)
        }
    }
    async postWithAuth(req, res, endpoint, service, formData = null) {
        const baseurl = BASEURL[service];
        const checkHeaders = validateHeaders(req, true)
        if (checkHeaders.error) {
            return res.status(500).json(checkHeaders.message)
        }
        const token = req.header("Authorization");
        const role = req.header("role");
        try {
            axios({
                method: 'post',
                url: `${baseurl}/${endpoint}`,
                data: formData ? formData : req.body,
                headers: { 'Authorization': token || '', role },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }).then(async function (response) {
                await res.status(200).json({ data: response.data })
            }).catch(async function (error) {
                 
                await res.status(error.response.status).json(error.response.data)
            });
        } catch (error) {
            await res.status(error.response.status).json(error.response.data)
        }
    }
    async postWithoutAuth(req, res, endpoint, service) {
        const baseurl = BASEURL[service];
        let role;
        let uuid;
        const checkHeaders = validateHeaders(req, false)
        if (checkHeaders.error) {
            return res.status(500).json(checkHeaders.message)
        }
        role = req.header("role");
        uuid = req.header("uuid");
        try {
            axios({
                method: 'post',
                url: `${baseurl}/${endpoint}`,
                data: req.body,
                headers: { role, uuid },
            }).then(async function (response) {
                await res.status(200).json({ data: response.data })
            }).catch(async function (error) {
                
                await res.status(error.response.status).json(error.response.data)
            });
        } catch (error) {
            await res.status(error.response.status).json(error.response.data)
        }
    }
}

module.exports = new Http()