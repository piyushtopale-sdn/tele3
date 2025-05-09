import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { IResponse } from "src/app/shared/classes/api-response";
import { CoreService } from "src/app/shared/core.service";
import { PharmacyService } from "../../pharmacy.service"
import {
  IProfileRequest,
  IProfileResponse,
} from "../../pharmacy-creatprofile/pharmacy-creatprofile.type";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { Observable } from "rxjs";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import intlTelInput from "intl-tel-input";
import { NgxUiLoaderService } from 'ngx-ui-loader';
@Component({
  selector: "app-editprofile",
  templateUrl: "./editprofile.component.html",
  styleUrls: ["./editprofile.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class EditprofileComponent implements OnInit {
  portalUserId: any;
  pharEmail: any;
  pharMobile: any;
  pharName: any;
  pharmacy_name: any = "";
  pharmacy_name_arabic: any = "";
  profileImage: any = "";
  pharmacyPictures: any[] = [];
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
  selectedcountrycodedb: any = '';
  iti: any;
  selectedCountryCode: string;
  minDate: Date = new Date();
  
  constructor(
    private pharmacyService: PharmacyService,
    private coreService: CoreService,
    private sanitizer: DomSanitizer,
    private route: Router,
    private toastr: ToastrService,
    private loader: NgxUiLoaderService
  ) {
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
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    let adminData = JSON.parse(localStorage.getItem("adminData"));
    this.portalUserId = loginData?._id;
    this.getProfile();
  }

  ngAfterViewInit() {
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
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.profileImage = event.target.result;
      };

      reader.readAsDataURL(event.target.files[0]);
    }
  }

  public locationFields: FormGroup = new FormGroup({
    nationality: new FormControl("", [Validators.required]),
    neighborhood: new FormControl(""),
    region: new FormControl(""),
    province: new FormControl(""),
    department: new FormControl(""),
    city: new FormControl(""),
    village: new FormControl("", []),
    pincode: new FormControl("",[Validators.pattern(/^\d{5,6}$/)]),
  });
  public profileFields: FormGroup = new FormGroup(
    {
      // {value: 'Nancy', disabled: true}
      lisencePic: new FormControl(""),
      address: new FormControl("", [Validators.required]),
      profileImage: new FormControl(""),
      loc: new FormControl(""),
      email: new FormControl("", [Validators.required]),
      pharmacy_name: new FormControl("", [Validators.required,this.coreService.nameValidator()]),
      pharmacy_name_arabic: new FormControl("", [Validators.required,this.coreService.nameValidator()]),
      slogan: new FormControl(""),
      main_phone_number: new FormControl("", [Validators.required, Validators.pattern(/^\d{2}-\d{3}-\d{4}$/)]),
      additional_phone_number: new FormControl("", [Validators.pattern(/^\d{2}-\d{3}-\d{4}$/)]),
      about_pharmacy: new FormControl(""),
      profile_picture: new FormControl("", []),
      licence_details: new FormGroup({
        id_number: new FormControl("", [Validators.required,Validators.pattern(/^[a-zA-Z0-9]{6,}$/)]),
        expiry_date: new FormControl("", [Validators.required,this.coreService.LicenseDateValidator()]),
        licence_picture: new FormControl(""),
      }),
      location_info: this.locationFields,
    },
    { validators: [] }
  );

  licence_doc: FormData = null;
  pharmacypictures: FormData = null;
  profilePicture: FormData = null;
  pharmacyPicUrl: SafeResourceUrl[] = [];
  lisencePic: any = false;

  myFilter = (d: Date | null): boolean => {
    return true;
  };

  onFileSelected(
    event: any,
    type: "licence" | "pharmacypictures" | "profilepicture"
  ) {
    const files: File[] = event.target.files;
    name;
    const formData: FormData = new FormData();
    formData.append("userId", "");
    formData.append("docType", type);
    formData.append("serviceType", 'pharmacy');

    if (type === "pharmacypictures") {
      formData.append("multiple", "true");
    } else {
      formData.append("multiple", "false");
    }
    if (files.length === 1) {
      formData.append("multiple", "false");
    }

    for (const file of files) {
      formData.append("file", file);
      if (type === "pharmacypictures") {
        const imgUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          window.URL.createObjectURL(file)
        );
        this.pharmacyPicUrl.push(imgUrl);
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
    if (type === "pharmacypictures") {
      this.pharmacypictures = formData;
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
      this.pharmacyService.uploadDocument(doc).subscribe({
        next: (result: IResponse<any>) => {
          let response = this.coreService.decryptObjectData({ data: result });
          if(response.status){

            resolve(response);
            reject(response);
          }
          },
          
        error: (err: ErrorEvent) => {
          this.coreService.showError("", err.message);
        },
      });
    });
  }

  numberFunc(event: any = ''): boolean {
    if (event.type === 'paste') {
      // Handle paste action
      const clipboardData = event.clipboardData || (window as any).clipboardData;
      const pastedText = clipboardData.getData('text');
      const regex = new RegExp("^[0-9]+$");

      if (!regex.test(pastedText)) {
        event.preventDefault();
        return false;
      }
    } else {
      // Handle key press action
      const key = event.key;
      const regex = new RegExp("^[0-9]+$");

      if (!regex.test(key)) {
        event.preventDefault();
        return false;
      }
    }

    return true; // Return true for allowed key press or paste
  }

  public async createProfile(): Promise<void> {
    this.isSubmitted = true;

    const isInvalid =
      this.profileFields.invalid ||
      this.locationFields.invalid

    if (isInvalid) {
      const firstInvalidField = document.querySelector(
        'input.ng-invalid, select.ng-invalid'

      );
      this.toastr.error("Please fill all the required fields!")
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (isInvalid) {
      this.profileFields.markAllAsTouched();
      this.locationFields.markAllAsTouched();
      this.toastr.error("Please fill required fields")
      return;
    }

    const invalid = [];
    const controls = this.profileFields.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }

    const invalid2 = [];
    const controls2 = this.locationFields.controls;
    for (const name in controls2) {
      if (controls2[name].invalid) {
        invalid2.push(name);
      }
    }
    this.loader.start();
    if (this.licence_doc) {
      await this.uploadDocument(this.licence_doc).then((res: any) => {
        
        this.license_picture = res.data[0];
        this.profileFields.patchValue({
          license_details: {
            licence_picture: res.data[0],
          },
        });
      });
    }

    if (this.pharmacypictures) {
      await this.uploadDocument(this.pharmacypictures).then((res: any) => {
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

    const profileRequest: IProfileRequest = {
      for_portal_user: JSON.parse(localStorage.getItem("loginData"))._id,

      email: this.getProfileField("email"),
      loc: this.getProfileField("loc"),
      pharmacy_name: this.getProfileField("pharmacy_name"),
      pharmacy_name_arabic: this.getProfileField("pharmacy_name_arabic"),
      slogan: this.getProfileField("slogan"),
      main_phone_number: this.getProfileField("main_phone_number"),
      additional_phone_number: this.getProfileField("additional_phone_number"),
      about_pharmacy: this.getProfileField("about_pharmacy"),
      profile_picture: this.getProfileField("profile_picture"),
      licence_details: {
        // licence_picture: this.license_picture,
        licence_picture: this.getProfileField("licence_details", "licence_picture"),
        id_number: this.getProfileField("licence_details", "id_number"),
        expiry_date:
          this.getProfileField("licence_details", "expiry_date")
      },
      address: this.getProfileField("address"),
      location_info: {
        nationality: this.getLocationField("nationality"),
        neighborhood: this.getLocationField("neighborhood"),
        region: this.getLocationField("region"),
        province: this.getLocationField("province"),
        department: this.getLocationField("department"),
        city: this.getLocationField("city"),
        village: this.getLocationField("village"),
        pincode: this.getLocationField("pincode"),
      },
      pharmacy_picture: this.docArray,
      
    };

    this.pharmacyService.createPharmacyProfile(profileRequest).subscribe({
      next: (result: IResponse<IProfileResponse>) => {
        let response = this.coreService.decryptObjectData({ data: result });
        if (response.status == true) {
          this.loader.stop()
          this.coreService.showSuccess("", response.message);
          this.route.navigate(["/pharmacy/profile"]);
        } else {
          this.loader.stop()
          this.coreService.showError("", response.message);
        }
      },
      error: (err: ErrorEvent) => {
        console.log("err",err);
        
        this.loader.stop()
        this.coreService.showError("Error", err.message);

        if (err.message === "INTERNAL_SERVER_ERROR") {
          this.coreService.showError("", err.message);
        }
      },
    });
  }

  getProfile() {
    let userId = this.portalUserId;
    return new Promise((resolve, reject) => {
      this.pharmacyService.viewProfileById(userId).subscribe({
        next: (result: IResponse<IProfileResponse>) => {
          let response = this.coreService.decryptObjectData({ data: result });
          this.pharmacy_name = response.data.adminData.pharmacy_name;
          this.pharmacy_name_arabic = response.data.adminData.pharmacy_name_arabic;
          this.profileImage = response?.data?.adminData?.profile_picture_signed_url;

          this.lisencePic = response?.data?.licencePicSignedUrl;

          this.license_picture = response?.data?.licence_details?.licencePicSignedUrl

          response?.data?.adminData?.pharmacy_picture_signed_urls.forEach(
            (element) => {
              this.pharmacyPicUrl.push(element);
            }
          );

          response?.data?.adminData?.pharmacy_picture.forEach((element) => {
            //already added pictures
            this.docArray.push(element);
          });
          this.profileData = {
            name: response?.data?.adminData?.pharmacy_name,
            name_arabic: response?.data?.adminData?.pharmacy_name_arabic,
            profile: response?.data?.adminData?.profile_picture_signed_url,
          };


          this.profileFields.patchValue({
            ...response.data.adminData,
            ...response.data.portalUserData,
            main_phone_number: response.data.portalUserData?.phone_number,
            loc: { ...response?.data?.adminData?.in_location?.loc },
          });

          this.locationFields.patchValue({
            ...response.data?.locationData,
          });
          this.selectedcountrycodedb = response?.data?.portalUserData?.country_code
          this.getCountryCode();

          this.selectedcountrycodedb = response?.data?.portalUserData?.country_code
          resolve(true)
        },
        error: (err: ErrorEvent) => {
          reject(true)
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


  pharmacyPics: any[] = [];

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
      this.profileFields.get("profileImage").reset();
    }
    if ((data === "lisencePic")) {
      this.lisencePic = false;
      this.license_picture = "";
      // this.profileFields.get("lisencePic").reset();
    }
    if ((data === "pharmacy_pic")) {
      this.pharmacyPicUrl.splice(index, 1);
      this.docArray.splice(index, 1);
    }
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

    if (input.length <= 2) {
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
  get f() {
    return this.profileFields.controls;
  }
}
