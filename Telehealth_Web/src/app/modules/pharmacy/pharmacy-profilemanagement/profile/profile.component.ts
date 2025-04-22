import { SuperAdminService } from "./../../../super-admin/super-admin.service";
import { Component, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import * as moment from "moment";
import { CoreService } from "src/app/shared/core.service";
import { PharmacyPlanService } from "../../pharmacy-plan.service";
import { PharmacyService } from "../../pharmacy.service";
import Validation from "src/app/utility/validation";
import { ToastrService } from "ngx-toastr";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";
import { Router } from "@angular/router";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { PharmacyStaffResponse } from "../../pharmacy-staffmanagement/addstaff/addstaff.component.type";
import { IEncryptedResponse } from "src/app/shared/classes/api-response";
import intlTelInput from 'intl-tel-input';
@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class ProfileComponent implements OnInit {
  @ViewChild("activateDeactivate") activateDeactivate: TemplateRef<any>;  
  profileIcon: any = '/assets/img/create_profile.png'
  country: any = "";
  region: any = "";
  province: any = "";
  department: any = "";
  city: any = "";
  village: any = "";
  @ViewChild('editstaffcontent') editstaffcontent: TemplateRef<any>;
  editStaff: FormGroup;
  dataOne: any; 
  userId: any;
  profileDetails: any;
  profilePicture: any = "";
  locationData: any;
  loc: any = {};
  pharmacyPictures: any[] = [];
  changePasswordForm: any = FormGroup;
  isSubmitted: any = false;
  userRole: any;
  staffProfileUrl: any;
  selectedCountryCode: any = '+226';
  profileData: any;
  staffInfo: any;
  in_location: any;
  staff_ID: any;
  iti: any;
  license_Picture: any;
  countrycodedb: any;  
  selectedLanguages: any = [];
  notificationData: any;
  notificationStatus: any = "want";

  hide1 = true;
  hide2 = true;
  hide3 = true;
  hide4 = true;
  hide5 = true;
  hide6 = true;
  adminId: any;

  constructor(
    private fb: FormBuilder,
    private coreService: CoreService,
    private pharService: PharmacyPlanService,
    private service: PharmacyService,
    private sadminService: SuperAdminService,
    private toastr: ToastrService,
    private router: Router,
    private modalService: NgbModal,
    private _pharmacyService: PharmacyService,

  ) {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    let adminData = JSON.parse(localStorage.getItem("adminData"));

    this.userRole = loginData?.role;
    this.userId = loginData?._id;
    this.adminId = adminData?._id;    

    this.changePasswordForm = this.fb.group(
      {
        old_password: ["", [Validators.required]],
        new_password: [
          null,
          Validators.compose([
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
          ]),
        ],
        confirm_password: ["", [Validators.required]],
      },
      { validators: [Validation.match("new_password", "confirm_password")] }
    );

    this.editStaff = this.fb.group({
      staff_profile: [""],
      first_name: ["", [Validators.required]],
      middle_name: [""],
      last_name: ["", [Validators.required]],
      dob: ["", [Validators.required]],
      language: [""],
      address: ["", [Validators.required]],
      neighbourhood: [""],
      country: ["", [Validators.required]],
      region: [""],
      province: [""],
      department: [""],
      city: [""],
      village: [""],
      pincode: [""],
      degree: [""],
      phone: ["", [Validators.required]],
      email: ["", [Validators.required]],
      about: [""],
    })
  }

  ngOnInit(): void {
    if (this.userRole === "PHARMACY_ADMIN") {
      this.getProfileDetails(this.userId);
    }
    else if (this.userRole === 'PHARMACY_STAFF') {
      this.getSpecificStaffDetails(this.userId);
    }
  }

  autoComplete: google.maps.places.Autocomplete;
  getCountrycodeintlTelInput() {
    var country_code = '';
    const countryData = (window as any).intlTelInputGlobals.getCountryData();
    for (let i = 0; i < countryData.length; i++) {
      if (countryData[i].dialCode === this.countrycodedb.split("+")[1]) {
        country_code = countryData[i].iso2;
        break; // Break the loop when the country code is found
      }
    }
    const input = document.getElementById('mobile') as HTMLInputElement;
    const adressinput = document.getElementById('address') as HTMLInputElement;
    if (input) {
      this.iti = intlTelInput(input, {
        initialCountry: country_code,
        separateDialCode: true,
      });
      this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
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
        adressinput,
        options
      );
      this.autoComplete.addListener("place_changed", (record) => {
        const place = this.autoComplete.getPlace();
        this.loc.type = "Point";
        this.loc.coordinates = [
          place.geometry.location.lng(),
          place.geometry.location.lat(),
        ];
        this.editStaff.patchValue({
          address: place.formatted_address,
          loc: this.loc,
        });
      })
    }

  }

  handleChangePassword() {
    this.isSubmitted = true;
    if (this.changePasswordForm.invalid) {
      return;
    }
    this.isSubmitted = false;

    let reqData = {
      id: this.userId,
      old_password: this.changePasswordForm.value.old_password,
      new_password: this.changePasswordForm.value.new_password,
    };

    this.service.changePassword(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.toastr.success(response.message)
        this.changePasswordForm.reset();
      } else {
        // this.toastr.error(response.message)
        this.toastr.error(response.message)
      }
    }, err => {
      let errResponse = this.coreService.decryptObjectData({ data: err.error });
      this.toastr.error(errResponse.message)
    })
  }

  get f() {
    return this.changePasswordForm.controls;
  }

  //------------Profile Details----------
  getProfileDetails(id) {
    let reqdata = {
      userId: id
    }
    this.service.viewProfile(reqdata).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      this.profileDetails = response?.data;
      this.profilePicture = response?.data?.adminData?.profile_picture_signed_url;
      this.locationData = response?.data?.locationData;
      // this.license_Picture = response?.data?.adminData?.licence_details?.licence_picture
      this.license_Picture = response?.data?.licencePicSignedUrl;
      response?.data?.adminData?.pharmacy_picture_signed_urls.forEach((element) => {
        this.pharmacyPictures.push(element);
      });      
    });
  }
  sethours(event: MatSlideToggleChange) {
    var reqData = {
      "hoursset": event.checked,
      "for_portal_user": this.userId
    }
    this.service.sethours(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.toastr.success(response.message);
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.messgae);
      }
    );
  }

 

 

  




  /* --------staffDetailsbyid------- */
  getSpecificStaffDetails(id) {

    // throw new Error('Method not implemented.');
    try {
      // let userId = this.userId
      this.service.getStaffDetails(id).subscribe((result: any) => {
        // this.countryCode()
        const staffDetails = this.coreService.decryptObjectData(result);

        if (staffDetails.status == true) {
        }
        this.profileData = staffDetails?.data?.profileData[0]
        this.staffInfo = staffDetails?.data?.staffInfo[0]
        this.selectedLanguages = this.staffInfo.language;
        this.in_location = staffDetails?.data?.staffInfo[0]?.in_location
        let details = staffDetails.data.staffInfo[0];
        const documentInfo = staffDetails?.data?.documentURL
        this.staffProfileUrl = documentInfo
        let address = details.in_location;
        let dateString = this.convertDate(details.dob)
        this.getSpokenLanguage();
        this.editStaff.controls["first_name"].setValue(details?.first_name);
        this.editStaff.controls["middle_name"].setValue(details.middle_name);
        this.editStaff.controls["last_name"].setValue(details?.last_name);
        this.editStaff.controls["dob"].setValue(dateString);
        this.editStaff.controls["language"].setValue(details?.language
        );
        this.editStaff.controls["address"].setValue(details?.in_location?.address);
        this.editStaff.controls["neighbourhood"].setValue(details?.in_location?.neighborhood);
        this.editStaff.controls["country"].setValue(address?.nationality);
        this.editStaff.controls["region"].setValue(address?.region);
        this.editStaff.controls["province"].setValue(address?.province);
        this.editStaff.controls["department"].setValue(address?.department);
        this.editStaff.controls["city"].setValue(address?.city);
        this.editStaff.controls["village"].setValue(address?.village);
        this.editStaff.controls["pincode"].setValue(details?.in_location?.pincode);
        this.editStaff.controls["degree"].setValue(details.degree);
        this.editStaff.controls["phone"].setValue(staffDetails?.data?.profileData[0]?.phone_number);
        this.editStaff.controls["email"].setValue(staffDetails?.data?.profileData[0]?.email);
        this.editStaff.controls["about"].setValue(details?.about);
        this.countrycodedb = staffDetails?.data?.profileData[0]?.country_code;
        this.getCountrycodeintlTelInput();
      })
    } catch (e) {
      throw e
    }
  }
  convertDate(date) {
    let dateString: any = new Date(date);
    let dd = String(dateString.getDate()).padStart(2, "0");
    let mm = String(dateString.getMonth() + 1).padStart(2, "0");
    let yyyy = dateString.getFullYear();
    dateString = yyyy + "-" + mm + "-" + dd;

    return dateString
  }
  handleEditProfile() {
    if (this.userRole == "PHARMACY_ADMIN") {
      this.router.navigate(['/pharmacy/profile/edit'])

    } else if (this.userRole == "PHARMACY_STAFF") {
      let loginData = JSON.parse(localStorage.getItem("loginData"));
      this.staff_ID = loginData?._id
      this.openVerticallyCenterededitstaff(this.editstaffcontent, this.staff_ID);
    }

  }
  openVerticallyCenterededitstaff(editstaffcontent: any, id: any) {

    this.getSpecificStaffDetails(id);
    this.modalService.open(editstaffcontent, {
      centered: true,
      size: "xl",
      windowClass: "edit_staffnew",
    });
  }
  onGroupIconChange(event: any) {
    if (event.target.files && event.target.files[0]) {
      let file = event.target.files[0];
      this.editStaff.patchValue({
        staff_profile: file,
      });
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.profileIcon = event.target.result;
      };

      reader.readAsDataURL(event.target.files[0]);
    }
  }

  public onSubmit() {
    this.isSubmitted = true;
    if (this.editStaff.invalid) {
      return;
    }
    const values = this.editStaff.value
    const formaData = new FormData();
    formaData.append("staff_profile", values.staff_profile)
    formaData.append("staff_name", values.first_name + " " + values.middle_name + " " + values.last_name)
    formaData.append("first_name", values.first_name)
    formaData.append("middle_name", values.middle_name)
    formaData.append("last_name", values.last_name)
    formaData.append("dob", values.dob)
    formaData.append("language", JSON.stringify(this.selectedLanguages))
    formaData.append("address", values.address)
    formaData.append("neighbourhood", values.neighbourhood)
    formaData.append("country", values.country ? values.country : "")
    formaData.append("region", values.region ? values.region : '')
    formaData.append("province", values.province ? values.province : '')
    formaData.append("department", values.department ? values.department : '')
    formaData.append("city", values.city ? values.city : '')
    formaData.append("village", values.village ? values.village : '')
    formaData.append("pincode", values.pincode)
    formaData.append("degree", values.degree)
    formaData.append("phone", values.phone)
    formaData.append("email", values.email)
    formaData.append("about", values.about)
    formaData.append("staff", values.staff)
    formaData.append("id", this.staff_ID)
    formaData.append("country_code", this.selectedCountryCode)

    this._pharmacyService.editStaff(formaData).subscribe({
      next: (result: IEncryptedResponse<PharmacyStaffResponse>) => {
        let decryptedResult = this.coreService.decryptObjectData(result);
        this.coreService.showSuccess("", "Staff updated successfully");
        this.getSpecificStaffDetails(this.staff_ID);
        this.handleClose()

      },
      error: (err: ErrorEvent) => {

        this.coreService.showError("", err.message);
        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this.coreService.showError("", err.message);
        // }
      },
    });
  }
  public handleClose() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.editStaff.reset()
    this.staff_ID = '';
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }
  spokenLanguages: any[] = []
  overlay:false;

  getSpokenLanguage() {
    this.sadminService.spokenLanguage().subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      // this.spokenLanguages = response.body?.spokenLanguage;
      const arr = response.body?.spokenLanguage;
      arr.map((curentval: any) => {
        this.spokenLanguages.push({
          label: curentval?.label,
          value: curentval?.value,
        });
      });  
      this.editStaff.patchValue({
        language: this.selectedLanguages
     });
    });
  }
  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  }

  // countryCode() {
  //   const input = this.countryPhone.nativeElement;
  //   this.iti = intlTelInput(input, {
  //     initialCountry: "fr",
  //     separateDialCode: true
  //   });
  //   this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
  // }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };
  removeSelectpic() {
    this.staffProfileUrl = ''
  }
  
  onSelectionChange(event: any): void {
    this.selectedLanguages = this.editStaff.value.language;

  }


  updateNotificationStatus() {
    this.service.updateNotification(this.notificationData).subscribe((res: any) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.toastr.success(response.message);
        this.modalService.dismissAll("Closed");
      }
    });
  }
}
