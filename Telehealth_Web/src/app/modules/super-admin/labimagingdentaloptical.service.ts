import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/shared/auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LabimagingdentalopticalService {

  constructor(private http: HttpClient, private auth: AuthService) { }

  getHeader(token: any) {
    const httpHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      "role": "superadmin",
      "Authorization": `Bearer ${token}`,
    });
    return httpHeaders;
  }

  getBasePath() {
    return environment.apiUrl;
  }

  labRadioTestsList() {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/labradio-service/lab-radio/get-lab-radio-tests-list`, {
      headers: this.getHeader(token)
    });
  }

  getEachTestPerformedCountByCenter(params:any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/labradio-service/appointment/total-test-Performed-each-center?labRadiologyId=${params.labRadiologyId}&type=${params.type}`, {
      headers: this.getHeader(token)
    });
  }

  getMostUsedLabRadioCenter() {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/labradio-service/appointment/get-most-used-center`, {
      headers: this.getHeader(token)
    });
  }

  laboratoryList(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/labradio-service/lab-radio/get-lab-radio-list`, {
      params,
      headers: this.getHeader(token)
    });
  }

  laboratoryListUser(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/labradio-service/lab-radio/get-lab-radio-list-by-portal-user`, {
      params,
      headers: this.getHeader(token)
    });
  }

  studyTypeList(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/superadmin-service/common-api/get-study-type`, {
      params,
      headers: this.getHeader(token)
    });
  }


  centerProfileView(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/labradio-service/lab-radio/centre-view-profile`, {
      params,
      headers: this.getHeader(token)
    });
  }

  approveOrRejectLabimagingdentaloptical(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      ``, //{}-labimagingdentaloptical/labimagingdentaloptical/approve-or-reject-labimagingdentaloptical
      data,
      { headers: this.getHeader(token) }
    );
  }

  activeLockDeleteLabimagingdentaloptical(data: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      // `/labradio-service/lab-radio/active-lock-delete-labimagingdentaloptical`,
      `/labradio-service/lab-radio/active-lock-delete-labradio`,

      data,
      { headers: this.getHeader(token) }
    );
  }

  getMenus(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/menu/all-menus`, {
      params,
      headers: this.getHeader(token)
    });
  }

  getUserMenus(params: any) {
    let token = this.auth.getToken();
    return this.http.get(this.getBasePath() + `/menu/all-user-menu`, {
      params,
      headers: this.getHeader(token)
    });
  }

  asignMenuSubmit(data: any) {
    let token = this.auth.getToken();
    return this.http.post(this.getBasePath() + `/menu/add-user-menu`, data, {
      params: {
        module_name: 'superadmin',
      },
      headers: this.getHeader(token)
    });
  }

  getLabimagingdentalopticalDetails(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      ``, //"{}-labimagingdentaloptical/labimagingdentaloptical/view-doctor-profile-labimagingdentaloptical
      { params, headers: this.getHeader(token) }
    );
  }

  getLocations(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      ``, //{}-labimagingdentaloptical/labimagingdentaloptical/four-portal-management-get-locations
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  createUnregisteredUser(data) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      ``, //{}-labimagingdentaloptical/labimagingdentaloptical/create-unregister-four-portal
      data,
      {
        headers: this.getHeader(token),
      }
    )
  }
  createUnregisterUserStaff(data) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      ``, //{}-labimagingdentaloptical/labimagingdentaloptical/create-unregister-four-portal-staff
      data,
      {
        headers: this.getHeader(token),
      }
    )
  }

  updateUnregisterUser(data) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      ``, //{}-labimagingdentaloptical/labimagingdentaloptical/update-unregister-four-portal
      data,
      {
        headers: this.getHeader(token),
      }
    )
  }

  getUnregisterUserDetails(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      ``, //{}-labimagingdentaloptical/labimagingdentaloptical/get-unregister-four-portal
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  unregisteredUserList(params: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      ``,//{}-labimagingdentaloptical/labimagingdentaloptical/get-unregister-four-portal-list
      {
        params,
        headers: this.getHeader(token),
      }
    );
  }

  addRadioTestApi(userData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/add-radiology-test`,
      userData,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateRAdioTestApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/edit-radiology-test`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteRAdioTestApi(data: any) {
    let token = this.auth.getToken();
    return this.http.delete(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/delete-radiology-test/${data.id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getRadioTestLIstAPi(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio-management/get-radiology-test-list`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  getRadioTestLIstAPiExport(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio-management/exportsheetlistExport-radioTest`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }
  

  getRadioTestBYID(data: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio-management/get-radiology-test-by-id/${data.id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  listRadioTestForExport(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/exportsheetlist-radioTest?searchText=${data.searchText}&limit=${data.limit}&page=${data.page}&radioId=${data.radioId}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addLabTestConfigApi(userData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/add-lab-test-configuration`,
      userData,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateLabTestConfigApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/edit-lab-test-configuration`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteLabTestConfigApi(data: any) {
    let token = this.auth.getToken();
    return this.http.delete(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/delete-lab-test-configuration/${data.id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getLabTestConfigLIstAPi(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio-management/get-lab-test-configuration-list`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  getLabTestConfigBYID(data: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio-management/get-lab-test-configuration-by-id/${data.id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  addLabTestApi(userData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/add-lab-test`,
      userData,
      {
        headers: this.getHeader(token),
      }
    );
  }

  updateLabTestApi(data: any) {
    let token = this.auth.getToken();
    return this.http.put(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/edit-lab-test`,
      data,
      {
        headers: this.getHeader(token),
      }
    );
  }

  deleteLabTestApi(data: any) {
    let token = this.auth.getToken();
    return this.http.delete(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/delete-lab-test/${data.id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getLabTestLIstAPi(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio-management/get-lab-test-list`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  getLabTestLIstAPiExport(paramData: any) {
    // return of({ status: true });
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio-management/exportsheetlistExport-labTest`,
      {
        params: paramData,
        headers: this.getHeader(token),
      }
    );
  }

  

  listLabTestForExport(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/exportsheetlist-labTest?searchText=${data.searchText}&limit=${data.limit}&page=${data.page}&labId=${data.labId}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getLabTestBYID(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio-management/get-lab-test-by-id/${data.id}`,
      {
        headers: this.getHeader(token),
      }
    );
  }

  getLabManualtestRecords_api(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/appointment/get-test-record`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getLABTestResultDetails_API(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/appointment/get-test-results`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  getLAbRadioUserList(param: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/lab-radio/get-all-labradio`,
      {
        params: param,
        headers: this.getHeader(token),
      }
    );
  }

  labTestConfigForExport(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/exportsheetlist-labTestConfig`,
      {
        params: data,
        headers: this.getHeader(token),
      }
    );
  }

  getLabTestResultById(data: any) {
    let token = this.auth.getToken();
    return this.http.get(
      this.getBasePath() + `/labradio-service/appointment/get-test-results/${data.id}`,

      {

        headers: this.getHeader(token),
      }
    );
  }
  bulkImportLabSubTest(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/upload-labSub-test`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }


  bulkImportLabMainTest(formData: any) {
    let token = this.auth.getToken();
    return this.http.post(
      this.getBasePath() +
      `/labradio-service/lab-radio-management/upload-labMain-test`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }
}
