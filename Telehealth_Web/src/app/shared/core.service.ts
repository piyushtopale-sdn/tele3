import { Injectable } from "@angular/core";
import * as CryptoJS from "crypto-js";
import { BehaviorSubject } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { environment } from "src/environments/environment";
import * as fingerprint from "../../assets/js/fingerprint.js";
import { AbstractControl, ValidationErrors } from '@angular/forms';
@Injectable({
  providedIn: "root",
})
export class CoreService {
  fingerprint: any;
  deviceId: any;
  constructor(private readonly toastrService: ToastrService) {

  }

  SharingData = new BehaviorSubject("default");
  SharingMenu = new BehaviorSubject("default");
  SharingProfile = new BehaviorSubject("default");
  SharingInsId = new BehaviorSubject("default");
  SharingEprescriptionData = new BehaviorSubject("default");
  SharingInsObjectId = new BehaviorSubject("default");
  SharingCategory = new BehaviorSubject("default");
  SharingDocumentId = new BehaviorSubject("default");
  SharingRoutingUrl = new BehaviorSubject("default");
  SharingLocation = new BehaviorSubject("default");
  decryptObjectData(response: any) {
    if (environment.apiUrl == "http://localhost:8005")

    return response.data;


    if (!response.data) return false;
    const decPassword = environment.CRYPTOSECRET;
    const decryptedOutput = CryptoJS.AES.decrypt(
      response.data.toString().trim(),
      decPassword.toString().trim()
    ).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedOutput);
  }

  decryptObjectData1(response: any) {
    if (!response) return false;
    const decPassword = environment.CRYPTOSECRET;
    const decryptedOutput = CryptoJS.AES.decrypt(
      response.toString().trim(),
      decPassword.toString().trim()
    ).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedOutput);
  }

  decryptContext(cipherText: any) {
    if (environment.apiUrl == "http://localhost:8005")
      return cipherText;

    if (!cipherText) return false;
    const decPassword = environment.CRYPTOSECRET;
    const decryptedOutput = CryptoJS.AES.decrypt(
      cipherText.toString().trim(),
      decPassword.toString().trim()
    ).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedOutput);
  }
  encryptObjectData(request: any) {
    if (environment.apiUrl == "http://localhost:8005")
    return request;
    const dataToEncrypt = JSON.stringify(request);
    const encPassword = environment.CRYPTOSECRET;
    const encryptedData = CryptoJS.AES.encrypt(
      dataToEncrypt.trim(),
      encPassword.trim()
    ).toString();
    return encryptedData;
  }
  
  createselect2array(array, keyname, keyvalue, firstvalue) {
    let select2array = [{ value: '', label: firstvalue }];

    array.map((curentval: any) => {
      select2array.push({
        label: curentval?.[keyname],
        value: curentval?.[keyvalue],
      });
    });

    return select2array;
  }

  createselect22array(array, keyname, keyvalue, firstvalue) {
    
    let select2array = [{ value: '', label: firstvalue }];
  
    array.forEach((currentval: any) => {
      // Concatenate full name and email
      let label = `${currentval?.full_name} - ${currentval?.for_portal_user?.email}`;
      
      select2array.push({
        label: label,
        value: currentval?.[keyvalue],
      });
    });
  
    return select2array;
  }
  

  setSharingData(data: any) {
    this.SharingData.next(data);
  }

  setDocumentData(data: any) {
    this.SharingDocumentId.next(data);
  }

  setMenuInHeader(data: any) {
    this.SharingMenu.next(data);
  }

  setUrlRoute(data: any) {
    this.SharingRoutingUrl.next(data);
  }

  setProfileDetails(data: any) {
    this.SharingProfile.next(data);
  }

  setInsuranceId(data: any) {
    this.SharingInsId.next(data);
  }

  setEprescriptionData(data: any) {
    this.SharingEprescriptionData.next(data);
  }

  setInsObjectid(data: any) {
    this.SharingInsObjectId.next(data);
  }

  setCategoryForService(data: any) {
    this.SharingCategory.next(data);
  }

  setLocationData(data: any) {
    this.SharingLocation.next(data);
  }

  public showSuccess(message: any, title: any): void {
    this.toastrService.success(message, title);
  }

  public showInfo(message: any, title: any): void {
    this.toastrService.info(message, title);
  }

  public showWarning(message: any, title: any): void {
    this.toastrService.warning(message, title);
  }

  public showError(message: any, title: any): void {
    this.toastrService.error(message, title);
  }

  public setLocalStorage(data: any, key: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  public getLocalStorage(key: any) {
    let getLocalData = localStorage.getItem(key);
    return JSON.parse(getLocalData);
  }

  public removeLocalStorage(key: any) {
    localStorage.removeItem(key);
  }

  public setSessionStorage(data: any, key: any) {
    sessionStorage.setItem(key, JSON.stringify(data));
  }

  public getSessionStorage(key: any) {
    let getSessionData = sessionStorage.getItem(key);
    return JSON.parse(getSessionData);
  }

  public removeSessionStorage(key: any) {
    sessionStorage.removeItem(key);
  }

  public createDate(date: Date) {
    const newDay = `0${date.getDate()}`;
    const newMonth = `0${date.getMonth() + 1}`;
    return `${date.getFullYear()}-${newMonth.length > 2 ? newMonth.slice(1) : newMonth
      }-${newDay.length > 2 ? newDay.slice(1) : newDay}`;
  }

  getUUID() {
    const fpromise = fingerprint.load();

    return fpromise
      .then((fp) => fp.get())
      .then((result) => {
        // This is the visitor identifier:
        const visitorId = result.visitorId;
        return visitorId;

      })
      .catch((error) => console.error(error));
  }

  async getDeviceId() {
    await this.getUUID().then((res) => {
      this.deviceId = res;

    });
  }

  public convertTwentyFourToTwelve(hours: string) {
    if (hours) {
      if (hours != null && hours != undefined) {
        return hours.split(":")[0] + "" + hours.split(":")[1];
      } else {
        return "0000";
      }
    } else if (hours === '0000') {
      return "0000";
    } else {
      return "0000";
    }
  }

  public convertIntohours(hours: string) {
    return hours.slice(0, 2) + ":" + hours.slice(2, 4);
  }
  public getKeyByValue(object: Object, value: string) {
    return Object.keys(object).find((key) => object[key] === value);
  }
  
  //Check Validation
  public isValid(input: string, maxLength: number): boolean {
    const regex = /^[a-zA-Z]*$/;
    return regex.test(input) && input.length <= maxLength;
  }

  //Check Name Validation
  public nameValidator(maxLength: number = 50) {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value || '';
      const regex = /^[a-zA-Z\u0600-\u06FF\s]*$/;  // Arabic + English + space
  
      if (!regex.test(value)) {
        return {
          onlyCharacters: {
            message: 'Please enter letters only.'
          }
        };
      }
  
      if (value.length > maxLength) {
        return {
          maxLength: {
            message: `Maximum allowed length is ${maxLength} characters.`,
            requiredLength: maxLength,
            actualLength: value.length
          }
        };
      }
  
      return null;
    };
  }
  
  
  //Check Email Validation
  public emailValidator() {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value || '';
      return emailRegex.test(value) ? null : { pattern: true };
    };
  }

  //Check Mobile Validation
  public mobileValidator() {
    const pattern = /^\d{2}-\d{3}-\d{4}$/; 
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null; 
      
      const isValid = pattern.test(control.value);
      return isValid ? null : { pattern: true }; 
    };
}

//Checks Number validation
public numberOnlyValidator(maxDigits: number) {
  const pattern = new RegExp(`^\\d{1,${maxDigits}}$`);
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const value = control.value.toString();
    const isValid = pattern.test(value);

    return isValid ? null : { numberOnly: true };
  };
}

//Checks licence validation
public LicenseDateValidator() {
  return (control: AbstractControl): ValidationErrors | null => {
    const inputDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Remove time for accurate comparison

    if (control.value && inputDate <= today) {
      return { notFutureDate: true };
    }

    return null;
  };
}

//Checks Alphanumeric validation
public alphanumericValidator() {
  const alphanumericRegex = /^[a-zA-Z0-9\u0600-\u06FF]*$/; 
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value || '';
    return alphanumericRegex.test(value) ? null : { pattern: true };
  };
}


  
}