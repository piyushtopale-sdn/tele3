import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { Component, ElementRef, ViewChild, ViewEncapsulation } from "@angular/core";
import {  FormControl, FormGroup, Validators, FormBuilder } from "@angular/forms";
import { CoreService } from "src/app/shared/core.service";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import {  Observable } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import intlTelInput from "intl-tel-input";
import { NgxUiLoaderService } from 'ngx-ui-loader';
import Validation from "src/app/utility/validation";
import { LabimagingdentalopticalService } from "../../labimagingdentaloptical.service";
import { DateAdapter } from '@angular/material/core';
import { IResponse } from "src/app/shared/classes/api-response";

@Component({
  selector: 'app-add-lab', 
  templateUrl: './add-lab.component.html',
  styleUrls: ['./add-lab.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddLabComponent {
  portalUserId: any;
  pharEmail: any;
  pharMobile: any;
  pharName: any;
  centre_name: any = "";
  centre_name_arabic: any = "";
  profileImage: any = "";
  showAddressComponent: any = false;
  myControl = new FormControl("");
  filteredOptions!: Observable<any[]>;
  @ViewChild("mobile") mobile: ElementRef<HTMLInputElement>;
  @ViewChild("address") address!: ElementRef;
  autoComplete: google.maps.places.Autocomplete;
  loc: any = {};
  isSubmitted: any = false;
  profileData: any = "";
  license_picture: any;
  docArray: any[] = [];
  selectedcountrycodedb: any = '+966';
  iti: any;
  selectedCountryCode: string;
  pageSize: number = 0;
  totalLength: number = 0;
  page: any = 1;
  public searchText = "";
  dutyGroupList: any = [];
  dutyControl = new FormControl("");
  // dutyfilteredOptions!: Observable<any[]>;
  dutyfilteredOptions: any = [];
  overlay: false;
  onDutyGroupNo: any;
  onDutyCity: any;
  onDutyValue: any;
  selectedonduty: any = '';
  profile_picture: string;
  countryCodes: string[];
  isSubmited: false
  userID: any;
  superadminId: any;
  hide1 = true;
  hide2 = true;
  minDate: Date = new Date();

  constructor(
    private coreService: CoreService,
    private sanitizer: DomSanitizer,
    private sadminService: SuperAdminService,
    private activatedRoute: ActivatedRoute,
    private route: Router,
    private loader: NgxUiLoaderService,
    private labimagingdentaloptical :LabimagingdentalopticalService,
    private dateAdapter: DateAdapter<Date>
  ) {
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy
  }
  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  };
  getCountryCode() {
    var country_code = '';
    const countryData = (window as any).intlTelInputGlobals.getCountryData();
    for (let i = 0; i < countryData.length; i++) {
      if (countryData[i].dialCode === this.selectedcountrycodedb.split("+")[1]) {
        country_code = countryData[i].iso2;
        break; // Break the loop when the country code is found
      }
    }
    const input = this.mobile.nativeElement;
    this.iti = intlTelInput(input, {
      initialCountry: country_code,
      separateDialCode: true,
    });
    this.selectedcountrycodedb = "+" + this.iti.getSelectedCountryData().dialCode;
  }

  ngOnInit(): void {
    let paramId = this.activatedRoute.snapshot.paramMap.get("id");
    this.userID = paramId;
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.superadminId = loginData?._id;

    if (this.userID !== null) {
      this.getProfile(this.userID)
      this.removePasswordValidators();
    }
    
  }

  removePasswordValidators(): void {
    const passwordControl = this.profileFields.get("password");
    const confirmPasswordControl = this.profileFields.get("confirm_password");

    if (passwordControl && confirmPasswordControl) {
      passwordControl.clearValidators();
      confirmPasswordControl.clearValidators();

      passwordControl.updateValueAndValidity();
      confirmPasswordControl.updateValueAndValidity();

      // Remove the form group validator related to password matching
      this.profileFields.clearValidators();
      this.profileFields.updateValueAndValidity();
    }
  }

  ngAfterViewInit() {
    if (this.userID == null) {
      this.getCountryCode()
    }

    const options = {
      fields: [
        "address_components",
        "geometry.location",
        "icon",
        "name",
        "formatted_address",
      ],
      strictBounds: false,
    };
    this.autoComplete = new google.maps.places.Autocomplete(
      this.address.nativeElement,
      options
    );
    this.autoComplete.addListener("place_changed", (record) => {
      const place = this.autoComplete.getPlace();

      const getAddress = this.getAddressComponents(place.address_components)

      this.loc.type = "Point";
      this.loc.coordinates = [
        place.geometry.location.lng(),
        place.geometry.location.lat(),
      ];
      this.locationFields.patchValue({
        address: place.formatted_address,
        nationality: getAddress.country,
        city: getAddress.city,
        village: getAddress.village,
        region: getAddress.region,
        province: getAddress.province,
        department: getAddress.department,
        pincode: getAddress.pincode,
        loc: this.loc,
      });
      this.profileFields.patchValue({
        address: place.formatted_address 
      });
    });
  }
  getAddressComponents(addressComponents) {
    let result = {
      region: null,
      province: null,
      country: null,
      city: null,
      village: null,
      department: null,
      pincode: null
    };

    for (const component of addressComponents) {
      if (component.types.includes('administrative_area_level_1')) {
        result.region = component.long_name;
      }
      if (component.types.includes('administrative_area_level_2')) {
        result.province = component.long_name;
      }
      if (component.types.includes('country')) {
        result.country = component.long_name;
      }
      if (component.types.includes('locality')) {
        result.city = component.long_name;
      }
      if (component.types.includes('sublocality') || component.types.includes('neighborhood') || component.types.includes('political')) {
        result.village = component.long_name;
      }
      if (component.types.includes('administrative_area_level_3')) {
        result.department = component.long_name;
      }
      if (component.types.includes('postal_code')) {
        result.pincode = component.long_name;
      }
    }

    return result;
  }


  onGroupIconChange(event: any) {
    if (event.target.files && event.target.files[0]) {
      let file = event.target.files[0];
      // this.profilePicture = file;
      // this.profileFields.patchValue({
      //   profile_picture: file,
      // });
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.profileImage = event.target.result;
      };

      reader.readAsDataURL(event.target.files[0]);
    }
  }

  public locationFields: FormGroup = new FormGroup({
    nationality: new FormControl(""),
    neighborhood: new FormControl(""),
    region: new FormControl(""),
    province: new FormControl(""),
    department: new FormControl(""),
    city: new FormControl(""),
    village: new FormControl("", []),
    pincode: new FormControl("",[Validators.pattern(/^\d{5,6}$/)]),
    loc: new FormControl(""),
  });


  public profileFields: FormGroup = new FormGroup(
    {
      lisencePic: new FormControl(""),
      profileImage: new FormControl(""),
      loc: new FormControl(""),
       address: new FormControl("",[Validators.required]),
      email: new FormControl("", [
        Validators.required,
        // Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$"),
        Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$"),
      ]),
      password: new FormControl(null, Validators.compose([
        Validators.required,
        // check whether the entered password has a number
        Validation.patternValidator(/\d/, {
          hasNumber: true,
        }),
        // check whether the entered password has upper case letter
        Validation.patternValidator(/[A-Z]/, {
          hasCapitalCase: true,
        }),
        // check whether the entered password has a lower case letter
        Validation.patternValidator(/[a-z]/, {
          hasSmallCase: true,
        }),
        // check whether the entered password has a special character
        Validation.patternValidator(
          /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
          {
            hasSpecialCharacters: true,
          }
        ),
        Validators.minLength(8),
      ])),
      centre_name: new FormControl("", [Validators.required]),
      centre_name_arabic: new FormControl("", [Validators.required]),
      slogan: new FormControl(""),
      main_phone_number: new FormControl("", [Validators.required, Validators.pattern(/^\d{2}-\d{3}-\d{4}$/)]),
      additional_phone_number: new FormControl("",Validators.pattern(/^\d{2}-\d{3}-\d{4}$/)),
      about_centre: new FormControl(""),
      profile_picture: new FormControl("", []),
      licence_details: new FormGroup({
        id_number: new FormControl("", [Validators.required,Validators.pattern(/^[a-zA-Z0-9]{6,}$/)]),
        expiry_date: new FormControl("", [Validators.required]),
        licence_picture: new FormControl(""),
      }),
      location_info: this.locationFields,
      confirm_password: new FormControl("", [Validators.required]),     
      branchCode: new FormControl("", []),
      branchKey: new FormControl("", [])
     
    },
    { validators: [Validation.match("password", "confirm_password")] }
  );

  licence_doc: FormData = null;
  centrepictures: FormData = null;
  profilePicture: FormData = null;
  centrePicUrl: SafeResourceUrl[] = [];
  lisencePic: any = false;

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  onFileSelected(
    event: any,
    type: "licence" | "centrepictures" | "profilepicture"
  ) {
    const files: File[] = event.target.files;
    name;
    const formData: FormData = new FormData();
    formData.append("userId", this.userID);
    formData.append("docType", type);
    formData.append("serviceType", "laboratory");


    if (type === "centrepictures") {
      formData.append("multiple", "true");
      // this.centrePicUrl = [];
    } else {
      formData.append("multiple", "false");
    }
    if (files.length === 1) {
      formData.append("multiple", "false");
    }

    for (const file of files) {
      formData.append("file", file);
      if (type === "centrepictures") {
        const imgUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          window.URL.createObjectURL(file)
        );
        this.centrePicUrl.push(imgUrl);
      }
    }

    if (type === "licence") {
      this.licence_doc = formData;

      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.lisencePic = event.target.result;

      };
      reader.readAsDataURL(event.target.files[0]);

    }
    if (type === "centrepictures") {
      this.centrepictures = formData;
    }
    if (type === "profilepicture") {
      // Allowed image types
      let file = event.target.files[0];
      const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validImageTypes.includes(file.type)) {
        this.coreService.showError("", "Invalid file type. Please select an image file only.");
        event.target.value = "";
        return;
      }

      this.profilePicture = formData;
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.profileImage = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  private getProfileField(...field: string[]) {
    return this.profileFields.get(field).value;
  }

  private getLocationField(field: string) {
    return this.locationFields.get(field).value;
  }




  private uploadDocument(doc: FormData) {
    return new Promise((resolve, reject) => {
      this.sadminService.uploadFileForPortal(doc).subscribe({
        next: (result: IResponse<any>) => {
          let response = this.coreService.decryptObjectData({ data: result });
          resolve(response);
          reject(response);
        },
        error: (err: ErrorEvent) => {
          this.coreService.showError("", err.message);
          if (err.message === "INTERNAL_SERVER_ERROR") {
            this.coreService.showError("", err.message);
          }
        },
      });
    });
  }


  public async createProfile(): Promise<void> {
    this.isSubmitted = true;

    const isInvalid = this.profileFields.invalid



    if (isInvalid) {
      this.profileFields.markAllAsTouched();

      const firstInvalidField = document.querySelector(
        'input.ng-invalid, input.ng-invalid'
      );
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth' });
      }
      this.coreService.showError("", "Please fill all required fields.")
      return;
    }

    this.loader.start();
    if (this.licence_doc) {
      await this.uploadDocument(this.licence_doc).then((res: any) => {
        if (res?.data?.length) {
          const uploadedLicencePicture = res.data[0];
          this.license_picture = uploadedLicencePicture;
    
          this.profileFields.patchValue({
            licence_details: {
              ...this.profileFields.value.licence_details,
              licence_picture: uploadedLicencePicture,
            },
          });
        } else {
          console.error("Error: Licence document upload failed or returned empty data.");
        }
      }).catch((error: any) => {
        console.error("Error during document upload:", error);
      });
    }

    if (this.centrepictures) {
      await this.uploadDocument(this.centrepictures).then((res: any) => {
        for (let doc of res.data) {
          this.docArray.push(doc);
        }
      });
    }

    if (this.profilePicture) {
      await this.uploadDocument(this.profilePicture).then((res: any) => {
        this.profileFields.patchValue({
          profile_picture: res.data[0],
        });
      });
    }
    let data = this.profileFields.value;

    const profileRequest = {
      for_portal_user: this.userID ? this.userID : "",      
      email: data.email?.toLowerCase(),
      centre_name: data.centre_name,
      centre_name_arabic: data.centre_name_arabic,
      slogan: data.slogan,
      main_phone_number: data.main_phone_number,
      additional_phone_number: data.additional_phone_number,
      about_centre: data.about_centre,
      profile_picture: data.profile_picture,
      // profile_picture:this.profile_picture,
      licence_details: {
        // licence_picture: data.licence_details.license_picture,
        licence_picture: data.licence_details.licence_picture,
        id_number: data.licence_details.id_number,
        expiry_date:
          data.licence_details.expiry_date
      },
      password: data.password,
      location_info: {
        nationality: data.location_info.nationality,
        neighborhood: data.location_info.neighborhood,
        region: data.location_info.region,
        province: data.location_info.province,
        department: data.location_info.department,
        city: data.location_info.city,
        village: data.location_info.village,
        pincode: data.location_info.pincode,
        loc: data.location_info.loc,
        address: data.address,
      },
      centre_picture: this.docArray,
      country_code: this.selectedCountryCode,
      createdBy: this.superadminId,
      portal_type:"Laboratory",
      identifier :{
        branchCode: data.branchCode,
        branchKey: data.branchKey
      }
    };

    this.sadminService.createLAB_RADIOProfile(profileRequest).subscribe({
      next: (result) => {
        let response = this.coreService.decryptObjectData({ data: result });
        if (response.status) {
          this.loader.stop();
          this.coreService.showSuccess("", response.message);
          let id = response.data.userData._id
          if(this.userID !== null){
            this.route.navigate([`/super-admin/laboratory`]);
          }else{
            this.route.navigate([`/super-admin/laboratory/permission/${id}`]);
          }
        
        } else {
          this.loader.stop();
          this.coreService.showError("", response.message);
        }
      },
      error: (err: ErrorEvent) => {
        this.loader.stop();
        this.coreService.showError("Error", err.message);

        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this.coreService.showError("", err.message);
        // }
      },
    });
  }

  getProfile(userId: any) {
    let reqData ={
      id : userId
    }
    return new Promise(async (resolve, reject) => {
      this.labimagingdentaloptical.centerProfileView(reqData).subscribe({
        next: (result) => {
          let response = this.coreService.decryptObjectData({ data: result });
          this.centre_name = response.data.adminData.centre_name;
          this.centre_name_arabic = response.data.adminData.centre_name_arabic;
          this.profileImage =
            response?.data?.adminData?.profile_picture_signed_url;

          this.lisencePic = response?.data?.licencePicSignedUrl;
          this.centrePicUrl = response?.data?.adminData?.centre_picture_signed_urls;

          this.license_picture = response?.data?.adminData?.licence_details?.licence_picture
          this.profile_picture = response?.data?.adminData?.profile_picture;

          response?.data?.adminData?.centre_picture.forEach((element) => {          //already added pictures
            this.docArray.push(element);
          });
          this.profileData = {
            centre_name: response?.data?.adminData?.centre_name,
            centre_name_arabic: response?.data?.adminData?.centre_name_arabic,
            profile: response?.data?.adminData?.profile_picture_signed_url,
          };
          this.profileFields.patchValue({
            ...response.data.adminData,
            ...response.data.portalUserData,
            main_phone_number: response.data.portalUserData?.phone_number,
            address:  response?.data?.locationData?.address,
            // mobile_pay_details: { ...response.data.mobilePayData },
            loc: { ...response?.data?.adminData?.in_location?.loc }
          });

          this.locationFields.patchValue({
            ...response?.data?.locationData,
          });
          this.selectedcountrycodedb = response?.data?.portalUserData?.country_code
          this.getCountryCode();

          resolve(true)
        },
        error: (err: ErrorEvent) => {
          
          reject(true);
          this.coreService.showError("Error", err.message);
        },
      });
    })
  }

  handleSelectChange(event: any) {
    if (event.value === false) {
      this.profileFields.value.name.splice(0);
    }
  }





  readDocument(url: any) {
    let reqData = {
      url: url,
    };
    // this.pharmacyService.signedUrl(reqData).subscribe((res)=>{
    //   let response = this.coreService.decryptObjectData({data:res})
    //   this.profileImage = response?.data

    // })
  }

  removeSelectpic(data: any, index: any = "") {
    if ((data === "profileImage")) {
      this.profileImage = "";
      // this.profilePicture ="";
      this.profile_picture = "";
      // this.profileFields.get("profileImage").reset();
    }
    if ((data === "lisencePic")) {
      this.lisencePic = false;
      this.license_picture = "";
      // this.profileFields.get("licence_picture").reset();
    }
    if ((data === "centre_pic")) {
      this.centrePicUrl.splice(index, 1);
      this.docArray.splice(index, 1);
    }
  }

  get f() {
    return this.profileFields.controls;
  }


  onMobileInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value.replace(/\D/g, ''); // Remove all non-digit characters
    let formattedNumber = '';

    if (input.length <= 2) {
      formattedNumber = input;
    } else if (input.length <= 5) {
      formattedNumber = `${input.slice(0, 2)}-${input.slice(2)}`;
    } else {
      formattedNumber = `${input.slice(0, 2)}-${input.slice(2, 5)}-${input.slice(5, 9)}`;
    }

    this.profileFields.get('main_phone_number')?.setValue(formattedNumber, { emitEvent: false });
  }

  onMobileInput1(event: Event): void {
    const input = (event.target as HTMLInputElement).value.replace(/\D/g, ''); // Remove all non-digit characters
    let formattedNumber = '';

    if (input.length <=2) {
      formattedNumber = input;
    } else if (input.length <= 5) {
      formattedNumber = `${input.slice(0, 2)}-${input.slice(2)}`;
    } else {
      formattedNumber = `${input.slice(0, 2)}-${input.slice(2, 5)}-${input.slice(5, 9)}`;
    }

    this.profileFields.get('additional_phone_number')?.setValue(formattedNumber, { emitEvent: false });
  }

  enforceMaxLength(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.value.length > 7) {
      inputElement.value = inputElement.value.slice(0, 7);
      // Update the form control value to match truncated input
      this.profileFields.get('licence_details.id_number')?.setValue(inputElement.value);
    }
  }
  pinforceMaxLength(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.value.length > 6) {
      inputElement.value = inputElement.value.slice(0, 6);
      this.locationFields.get('pincode')?.setValue(inputElement.value);
    }
  }
  onLicenseNumberInput(event: any) {
    const value = event.target.value;
    const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, '');
    if (value !== alphanumericValue) {
      event.target.value = alphanumericValue; 
    }
  }
  formatDate(event: any) {
    let input = event.target.value;
    input = input.replace(/\D/g, "");
  
    if (input.length > 2) {
      input = input.substring(0, 2) + "/" + input.substring(2);
    }
    if (input.length > 5) {
      input = input.substring(0, 5) + "/" + input.substring(5);
    }
    if (input.length > 10) {
      input = input.substring(0, 10);
    }
    event.target.value = input;
  }
}

