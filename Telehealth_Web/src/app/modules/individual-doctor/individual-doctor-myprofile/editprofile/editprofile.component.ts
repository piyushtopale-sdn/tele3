import { IndiviualDoctorService } from "src/app/modules/individual-doctor/indiviual-doctor.service";
import { Component, ElementRef, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { CoreService } from "src/app/shared/core.service";
import Validation from "src/app/utility/validation";
import { responsiveLayout } from "@igniteui/material-icons-extended";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import intlTelInput from "intl-tel-input";
import { DatePipe } from "@angular/common";
import { DateAdapter } from "@angular/material/core";

@Component({
  selector: "app-editprofile",
  templateUrl: "./editprofile.component.html",
  styleUrls: ["./editprofile.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class EditprofileComponent implements OnInit {
  @ViewChild("address") address!: ElementRef;
  @ViewChild("activateDeactivate") activateDeactivate: TemplateRef<any>;
  @ViewChild("picker") picker: any;
  doctorId: any = "";
  doctorRole: any = "";
  locationData: any;
  profileDetails: any;
  availabilityArray: any;
  profileImage: any = "";
  dateFilter:any ='';
  spokenLanguages: any[] = [];

  availability: any = {};
  selected: any = "online";
  iti: any;
  selectedCountryCode: any;
  changePasswordForm: any = FormGroup;
  isSubmitted: any = false;

  appointmenType: any = "ONLINE";
  selectedLocation: any = "";
  locationList: any;
  feeDetails: any;
  selected_hospitalLocation: any = "";
  selectedData: any;
  staff_profile: any;
  editStaff: any;
  staff_profile_file: any;
  staff_ID: any;
  @ViewChild('editstaffcontent') editstaffcontent: TemplateRef<any>;
  for_portal_user: any;
  staff_details: any;
  loc: any;  
  showDocument: any;
  countrycodedb: any;
  designation: any;
  selectedLanguages:any = [];
  hospitalId: any;
  doctorAvailableTimeSlot: any[] = [];

  pathologyTests: any = [];
  updatedPathologyTests: any = [];
  overlay:false;
  notificationData: any;
  notificationStatus: any = "want";
  specialityValue: any;
  setDocToView: any = "";
  locationDetails : any = {}
  slot_interval_time: any;
  unavaliabledate_time: any;
  hide1 = true;
  hide2 = true;
  hide3 = true;
  hide4 = true;
  hide5 = true;
  hide6 = true;
  categoryValues: any;
  showFullAbout1: boolean = false;
  showFullAbout2: boolean = false;
  
  constructor(
    private toastr: ToastrService,
    private sadminService: SuperAdminService,
    private coreService: CoreService,
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private indiviualDoctorService: IndiviualDoctorService,
    private router: Router,
    private modalService: NgbModal,
     private dateAdapter: DateAdapter<Date>,

  ) {
    this.dateAdapter.setLocale('en-GB');

    let today = new Date();
    this.dateFilter = this.datePipe.transform(today, "YYYY-MM-dd");
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
      staff_name: [""],
      first_name: ["", [Validators.required]],
      middle_name: [""],
      last_name: ["", [Validators.required]],
      first_name_arabic: ["", [Validators.required]],
      middle_name_arabic: [""],
      last_name_arabic: ["", [Validators.required]],
      dob: ["", [Validators.required]],
      language: ["", [Validators.required]],
      address: ["", [Validators.required]],
      neighbourhood: [""],
      country: [""],
      region: [""],
      province: [""],
      department: [""],
      city: [""],
      village: [""],
      pincode: [""],
      mobile: ["", [Validators.required]],
      email: ["", [Validators.required]],
      role: [""],
      about_staff: [""],
      specialty: [""],
    });

  }

  ngOnInit(): void {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    let adminData = JSON.parse(localStorage.getItem("adminData"));

    this.doctorRole = loginData?.role;
    this.doctorId = loginData?._id;

    this.getSpokenLanguage();

    // view_profile_Data
    if (this.doctorRole === 'INDIVIDUAL_DOCTOR_STAFF') {

      this.getstaffdetails(this.doctorId);
    }
    else {
      this.getDoctorDetails();
    }

  }

  getSpokenLanguage() {
    this.sadminService.spokenLanguage().subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
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
  /* Staff Edit profile */
  handleEditProfile() {
    if (this.doctorRole == "INDIVIDUAL_DOCTOR" || this.doctorRole == "INDIVIDUAL_DOCTOR_ADMIN") {
      this.router.navigate(["/individual-doctor/myprofile/0"])

    } else if (this.doctorRole == "INDIVIDUAL_DOCTOR_STAFF") {
      let loginData = JSON.parse(localStorage.getItem("loginData"));
      this.staff_ID = loginData?._id
      this.openVerticallyCenterededitstaff(this.editstaffcontent, this.staff_ID);
    }
  }
  onGroupIconChange(event: any) {
    const formData: any = new FormData();
    formData.append("file", event.target.files[0]);
    formData.append("userId", "");
    formData.append("docType", "profile");
    formData.append("serviceType", "doctor");

    this.staff_profile_file = formData;

    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.staff_profile = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }
    this.uploadDocument();
  }

  keyURL: any = "";
  uploadDocument() {
    this.indiviualDoctorService.uploadFileForPortal(this.staff_profile_file).subscribe({
      next: async (res: any) => {
        let result = await this.coreService.decryptObjectData({ data: res });
        
        this.keyURL = result.data[0];
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  editStaffDetails() {
    this.isSubmitted = true;
    if (this.editStaff.invalid) {
      this.coreService.showError("","Please Fill all the Fields")
      return;
    }
    this.isSubmitted = false;
    let fields = this.editStaff.value;
    let row = {
      staffId: this.doctorId,
      staffName: fields.first_name + " " + fields.middle_name + " " + fields.last_name,
      first_name: fields.first_name,
      middle_name: fields.middle_name,
      last_name: fields.last_name,
      dob: fields.dob,
      language: this.selectedLanguages,
      addressInfo: {
        loc: {
          type: "Point",
          coordinates: [],
        },
        address: fields.address,
        neighborhood: fields.neighbourhood,
        country: fields.country,
        region: fields.region,
        province: fields.province,
        department: fields.department,
        city: fields.city,
        village: fields.village,
        pincode: fields.pincode,
      },
      assignToDoctor: [this.doctorId],
      assignToStaff: [],
      aboutStaff: fields.about_staff,
      specialty: fields.specialty,
      services: [],
      department: [],
      unit: [],
      expertise: "",
      countryCode: this.selectedCountryCode,
      mobile: fields.mobile,
      profilePic: this.keyURL,
      creatorId: this.doctorId,
    };


    this.indiviualDoctorService.editStaff(row).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        this.toastr.success("Update successfully")
        this.getstaffdetails(this.doctorId);
        this.handleClose();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  public handleClose() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    // this.staffID = "";
  }

  openVerticallyCenterededitstaff(editstaffcontent: any, id: any) {
    this.getstaffdetails(id);
    this.modalService.open(editstaffcontent, {
      centered: true,
      size: "xl",
      windowClass: "edit_staffnew",
    });
  }
  getstaffdetails(id: any) {
    let pararm = {
      hospitalStaffId: id,
    };
    this.indiviualDoctorService.getStaffDetails(pararm).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        this.staff_details = result?.body
        this.selectedLanguages = this.staff_details?.in_profile?.language;

        this.staff_ID = result.body.in_profile._id
        let in_profile = result.body.in_profile;
        let location = result?.body?.in_profile?.in_location;
        this.locationDetails = {...location}      
        this.staff_profile = in_profile?.profile_picture;      

        this.editStaff.controls["staff_name"].setValue(in_profile?.name);
        this.editStaff.controls["first_name"].setValue(
          in_profile.first_name
        ); this.editStaff.controls["middle_name"].setValue(
          in_profile.middle_name
        );
        this.editStaff.controls["last_name"].setValue(
          in_profile.last_name
        );
        this.editStaff.controls["first_name_arabic"].setValue(
          in_profile.first_name_arabic
        ); this.editStaff.controls["middle_name_arabic"].setValue(
          in_profile.middle_name_arabic
        );
        this.editStaff.controls["last_name_arabic"].setValue(
          in_profile.last_name_arabic
        );
        this.editStaff.controls["dob"].setValue(in_profile.dob);
        this.editStaff.controls["language"].setValue(in_profile.language);
        this.editStaff.controls["address"].setValue(
          in_profile.in_location.address
        );
        this.editStaff.controls["neighbourhood"].setValue(
          in_profile.in_location.neighborhood
        );
        this.editStaff.controls["pincode"].setValue(
          in_profile.in_location.pincode
        );
        this.editStaff.controls["mobile"].setValue(
          in_profile.in_location.for_portal_user.mobile
        );
        this.editStaff.controls["email"].setValue(
          in_profile.in_location.for_portal_user.email
        );
        this.editStaff.controls["country"].setValue(
          in_profile.in_location.country
        );
        this.editStaff.controls["city"].setValue(in_profile.in_location.city);
        this.editStaff.controls["department"].setValue(
          in_profile.in_location.department
        );
        this.editStaff.controls["region"].setValue(location.region);
        this.editStaff.controls["province"].setValue(location.province);
        this.editStaff.controls["village"].setValue(location.village);
        this.editStaff.controls["role"].setValue(result.body.role);
        this.editStaff.controls["about_staff"].setValue(in_profile.about);
        this.editStaff.controls["specialty"].setValue(in_profile.specialty);
        this.countrycodedb = in_profile.in_location.for_portal_user.country_code;

        this.getCountrycodeintlTelInput();

      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  getDoctorDetails() {
    this.indiviualDoctorService.getDoctorProfileDetails(this.doctorId).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });   
         
      if (response.status == true) {                
        this.profileDetails = response?.data?.result[0];
        this.specialityValue=  response?.data?.specilizationValues;
        this.categoryValues=  response?.data?.categories;
        this.profileImage = this.profileDetails?.profile_picture_signed_url;
        this.availabilityArray = response?.data?.availabilityArray;
        // this.showDocument = this.profileDetails?.in_document_management?.document_details[0]?.image_url
        this.getDesignationList(response?.data?.result[0]?.designation)

       
        response?.data?.availabilityArray.forEach((element) => {         
           this.slot_interval_time = element.slot_interval
           this.unavaliabledate_time = element.unavailability_slot            
            this.handleSelectAvailabilty();        
        });

        this.doctorAvailableSlot();
      }
    });
  }

  getDesignationList(_id: any) {
    this.sadminService.getByIdDesignation(_id).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        this.designation = result?.body?.list[0]?.designation;

      },
      error: (err) => {
        console.log(err);
      },
    });
  }


 

  handleSelectAvailabilty() {
    let obj: any;   
    this.availabilityArray.forEach((element) => {
    this.arrangAvailability(element?.week_days);     
    });
  }


  arrangAvailability(weekArray: any) {
    let Sun = [];
    let Mon = [];
    let Tue = [];
    let Wed = [];
    let Thu = [];
    let Fri = [];
    let Sat = [];
    weekArray.forEach((element) => {
      let data = this.arrangeWeekDaysForPatch(element);
      Sun.push({
        start_time: data?.sun_start_time,
        end_time: data?.sun_end_time,
      });
      Mon.push({
        start_time: data?.mon_start_time,
        end_time: data?.mon_end_time,
      });
      Tue.push({
        start_time: data?.tue_start_time,
        end_time: data?.tue_end_time,
      });
      Wed.push({
        start_time: data?.wed_start_time,
        end_time: data?.wed_end_time,
      });
      Thu.push({
        start_time: data?.thu_start_time,
        end_time: data?.thu_end_time,
      });
      Fri.push({
        start_time: data?.fri_start_time,
        end_time: data?.fri_end_time,
      });
      Sat.push({
        start_time: data?.sat_start_time,
        end_time: data?.sat_end_time,
      });
    });

    let obj = {
      Sun: Sun,
      Mon: Mon,
      Tue: Tue,
      Wed: Wed,
      Thu: Thu,
      Fri: Fri,
      Sat: Sat,
    };

    this.availability = obj;
  }
  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  };
  //Calling address api's
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
        const getAddress = this.getAddressComponents(place.address_components);

        this.loc.type = "Point";
        this.loc.coordinates = [
          place.geometry.location.lng(),
          place.geometry.location.lat(),
        ];
        this.editStaff.patchValue({
          address: place.formatted_address,
          country: getAddress.country,
          city: getAddress.city,
          village: getAddress.village,
          region: getAddress.region,
          province: getAddress.province,
          department: getAddress.department,
          pincode: getAddress.pincode,
          loc: this.loc,
        });
      })
    }
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
  ngAfterViewInit() {

  }

  specialtyList: any[] = [];



  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  arrangeWeekDaysForPatch(element: any) {
    let wkD = {
      sun_start_time:
        element.sun_start_time.slice(0, 2) +
        ":" +
        element.sun_start_time.slice(2, 4),

      sun_end_time:
        element.sun_end_time.slice(0, 2) +
        ":" +
        element.sun_end_time.slice(2, 4),

      mon_start_time:
        element.mon_start_time.slice(0, 2) +
        ":" +
        element.mon_start_time.slice(2, 4),

      mon_end_time:
        element.mon_end_time.slice(0, 2) +
        ":" +
        element.mon_end_time.slice(2, 4),

      tue_start_time:
        element.tue_start_time.slice(0, 2) +
        ":" +
        element.tue_start_time.slice(2, 4),

      tue_end_time:
        element.tue_end_time.slice(0, 2) +
        ":" +
        element.tue_end_time.slice(2, 4),

      wed_start_time:
        element.wed_start_time.slice(0, 2) +
        ":" +
        element.wed_start_time.slice(2, 4),

      wed_end_time:
        element.wed_end_time.slice(0, 2) +
        ":" +
        element.wed_end_time.slice(2, 4),

      thu_start_time:
        element.thu_start_time.slice(0, 2) +
        ":" +
        element.thu_start_time.slice(2, 4),

      thu_end_time:
        element.thu_end_time.slice(0, 2) +
        ":" +
        element.thu_end_time.slice(2, 4),

      fri_start_time:
        element.fri_start_time.slice(0, 2) +
        ":" +
        element.fri_start_time.slice(2, 4),

      fri_end_time:
        element.fri_end_time.slice(0, 2) +
        ":" +
        element.fri_end_time.slice(2, 4),

      sat_start_time:
        element.sat_start_time.slice(0, 2) +
        ":" +
        element.sat_start_time.slice(2, 4),

      sat_end_time:
        element.sat_end_time.slice(0, 2) +
        ":" +
        element.sat_end_time.slice(2, 4),
    };

    return wkD;
  }

  // returnWithAmPm(data: any) {
  //   let filterValue = this.coreService.convertTwentyFourToTwelve(data);
  //   if (parseInt(filterValue) > 1200 || parseInt(filterValue) === 1200) {
  //     let format = filterValue.slice(0, 2);
  //     let after12 = parseInt(format) - 12;

  //     let finalTime =
  //       after12 != 0
  //         ? after12 + ":" + filterValue.slice(2, 4) + " PM"
  //         : data + " PM";
  //     return finalTime;
  //   } else {
  //     let am = data + " AM";
  //     return am;
  //   }
  // }


  returnWithAmPm(data: any) {
    if (!data) return "Invalid time"; 
    let timeStr = data.toString(); 
    if (timeStr.length === 4) {
      return timeStr.slice(0, 2) + ":" + timeStr.slice(2, 4); 
    }
  
    return timeStr;
  }


  handleChangePassword() {
    this.isSubmitted = true;
    if (this.changePasswordForm.invalid) {
      return;
    }
    this.isSubmitted = false;

    let reqData = {
      id: this.doctorId,
      old_password: this.changePasswordForm.value.old_password,
      new_password: this.changePasswordForm.value.new_password,
    };

    this.indiviualDoctorService.changePassword(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.toastr.success(response.message);
          this.changePasswordForm.reset();
        } else {
          this.toastr.error(response.message);
          // this.toastr.error("Current Password is incorrect");
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.message);
      }
    );
  }

  get f() {
    return this.changePasswordForm.controls;
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
  removeSelectpic() {
    this.staff_profile = ''
  }
  onSelectionChange(event: any): void {
    this.selectedLanguages = this.editStaff.value.language;
    
  }

  handleToggleChangeForActive(notificationData: any, event: any) {
    this.notificationData = {
      id: notificationData?.for_portal_user?._id,
      notification: event,
    };
    if (event === false) {
      this.notificationStatus = "don't want";
    } else {
      this.notificationStatus = "want";
    }
    this.modalService.open(this.activateDeactivate);
  }

  updateNotificationStatus() {
    this.indiviualDoctorService.updateNotification(this.notificationData).subscribe((res: any) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.toastr.success(response.message);
        this.modalService.dismissAll("Closed");
      }
    });
  }

  openVerticallyCenteredquickview(quick_view: any, image_url: any) {
    this.setDocToView = image_url;
    this.modalService.open(quick_view, {
      centered: true,
      size: "lg",
      windowClass: "quick_view",
    });
  }

  handleSelectDateFilter(event: any) {
    let date = this.datePipe.transform(event.value, "YYYY-MM-dd");
    this.dateFilter = date;
    this.doctorAvailableSlot();
  }

  doctorAvailableSlot() {
    let param = {
      date:  this.dateFilter,
      doctorId: this.doctorId,
    };

    this.indiviualDoctorService.doctorAvailableSlot(param).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });        
        this.doctorAvailableTimeSlot = result.body.allAvailableSlots;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getLimitedText1(text: string, wordLimit: number): string {
    if (!text) return '-';
    const words = text.split(' ');
    if (words.length <= wordLimit) {
      return text;
    }
    return words.slice(0, wordLimit).join(' ') + '...';
  }
  
  isViewMoreVisible1(text: string, wordLimit: number): boolean {
    if (!text) return false;
    return text.split(' ').length > wordLimit;
  }
  
  toggleAbout1() {
    this.showFullAbout1 = !this.showFullAbout1;
  }

  getLimitedText2(text: string, wordLimit: number): string {
    if (!text) return '-';
    const words = text.split(' ');
    if (words.length <= wordLimit) {
      return text;
    }
    return words.slice(0, wordLimit).join(' ') + '...';
  }
  
  isViewMoreVisible2(text: string, wordLimit: number): boolean {
    if (!text) return false;
    return text.split(' ').length > wordLimit;
  }
  
  toggleAbout2() {
    this.showFullAbout2 = !this.showFullAbout2;
  }

}
