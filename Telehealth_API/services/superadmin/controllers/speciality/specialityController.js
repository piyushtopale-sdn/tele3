import { config } from "../../config/constants"
const BASEURL = config.BaseUrl
import axios from "axios"

class SpecialityController {

    async create(req, res) {
        const baseurl = BASEURL.doctorServiceUrl;
        axios({
            method: 'post',
            url: `${baseurl}/doctor2/add-specialty`,
            data: req.body,
            params: req.query,
            headers: { 'Authorization': req.header("Authorization") },
        }).then(async function (response) {
            await res.status(response.status).json(response.data)
        }).catch(async function (error) {
            
            await res.status(200).json(error)
        });
    }

    async update(req, res) {
        const baseurl = BASEURL.doctorServiceUrl;
        axios({
            method: 'post',
            url: `${baseurl}/doctor2/update-specialty`,
            data: req.body,
            params: req.query,
            headers: { 'Authorization': req.header("Authorization") },
        }).then(async function (response) {
            await res.status(response.status).json(response.data)
        }).catch(async function (error) {
            
            await res.status(200).json(error)
        });
    }

    async delete(req, res) {
        const baseurl = BASEURL.doctorServiceUrl;
        axios({
            method: 'post',
            url: `${baseurl}/doctor2/action-on-specialty`,
            data: req.body,
            params: req.query,
            headers: { 'Authorization': req.header("Authorization") },
        }).then(async function (response) {
            await res.status(response.status).json(response.data)
        }).catch(async function (error) {
            
            await res.status(200).json(error)
        });
    }

    async list(req, res) {
        const baseurl = BASEURL.doctorServiceUrl;
        axios({
            method: 'get',
            url: `${baseurl}/doctor2/all-specialty`,
            data: req.body,
            params: req.query,
            headers: { 'Authorization': req.header("Authorization") },
        }).then(async function (response) {
            await res.status(response.status).json(response.data)
        }).catch(async function (error) {
            
            await res.status(200).json(error)
        });
    }

}

module.exports = new SpecialityController()