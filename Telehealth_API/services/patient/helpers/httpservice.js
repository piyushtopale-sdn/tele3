
"use strict";

import axios from "axios";
import { decryptionData } from "./crypto";
import { config } from "../config/constants";
const BaseUrl = config.BaseUrl;
class Http {

    get(path, data, headers, service){
        const baseurl = BaseUrl[service];
        return new Promise((resolve, reject) => {
            axios({
                method: 'get',
                url: `${baseurl}/${path}`,
                params: data,
                headers
            }).then(async function (response) {
                resolve(response.data)
            }).catch(async function (error) {
                reject(error)
            });
        })
    }
    getStaging(path, data, headers, service) {
        const baseurl = BaseUrl[service];
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
                    const decryData = decryptionData(response.data)
                    const obj = JSON.parse(decryData);
                    resolve(obj)
                }
            }).catch(async function (error) {
                reject(error)
            });
        })
    }
    post(path, data, headers, service){
        const baseurl = BaseUrl[service];
        return new Promise((resolve, reject) => {
            axios({
                method: 'post',
                url: `${baseurl}/${path}`,
                data,
                headers
            }).then(async function (response) {
                resolve(response.data)
            }).catch(async function (error) {
                reject(error)
            });
        })
    }
    postStaging(path, data, headers, service) {
        const baseurl = BaseUrl[service];
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
                    const decryData = decryptionData(response.data)
                    const obj = JSON.parse(decryData);
                    resolve(obj)
                }
            }).catch(async function (error) {
                reject(error)
            });
        })
    }
}

module.exports = Http