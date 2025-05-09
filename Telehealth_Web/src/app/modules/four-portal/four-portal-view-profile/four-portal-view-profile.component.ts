import { Component, ElementRef, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { CoreService } from "src/app/shared/core.service";
import Validation from "src/app/utility/validation";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import intlTelInput from "intl-tel-input";
import { FourPortalService } from "../four-portal.service";

@Component({
  selector: 'app-four-portal-view-profile',
  templateUrl: './four-portal-view-profile.component.html',
  styleUrls: ['./four-portal-view-profile.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FourPortalViewProfileComponent implements OnInit {
  @ViewChild("activateDeactivate") activateDeactivate: TemplateRef<any>;
  @ViewChild("address") address!: ElementRef;

  displayedColumns: string[] = [
    "patientname",
    "dateandtime",
    "appointmentstype",
    // "reasonforappt",
    // "fee",
    // "status",
    "action",
  ];
  dataSource: any = [];
  adminId: any = "";
  userRole: any = "";
  locationData: any;
  profileDetails: any;
  availabilityArray: any;
  profileImage: any = "";
  pharmacyPictures: any[] = [];
  profilePicture: any = "";

  country: any = "";
  region: any = "";
  province: any = "";
  department: any = "";
  city: any = "";
  village: any = "";
  spokenLanguages: any[] = [];

  availability: any = {};
  selected: any = "online";
  iti: any;
  selectedCountryCode: any;
  changePasswordForm: any = FormGroup;
  isSubmitted: any = false;
  inHospitalLocations: any = [];

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
  assign_doctor: any;
  department_forStaff: any;
  service_forStaff: any;
  unit_forStaff: any;
  showDocument: any;
  countrycodedb: any;
  designation: any;
  title: any;
  selectedLanguages: any = [];
  hospitalId: any;
  userType: any;
  route_type: string;
  pathologyTests: any = [];
  updatedPathologyTests: any = [];
  notificationStatus: any = "want";
  notificationData: any;
  overlay:false;
  locationDatas : any = {}
  hide1 = true;
  hide2 = true;
  hide3 = true;
  hide4 = true;
  hide5 = true;
  hide6 = true;
  license_Picture: any;
  constructor(
    private readonly toastr: ToastrService,
    private readonly sadminService: SuperAdminService,
    private readonly coreService: CoreService,
    private readonly fb: FormBuilder,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly modalService: NgbModal,
    private readonly fourportalService: FourPortalService

  ) {
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
      dob: ["", [Validators.required]],
      language: ["", [Validators.required]],
      address: ["", [Validators.required]],
      neighbourhood: [""],
      country: ["", [Validators.required]],
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
      unit: [""],
      services: [""],
      staffDepartment: [""],
      specialty: [""],
    });
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      this.route_type = params.get('path');
    });


    let loginData = JSON.parse(localStorage.getItem("loginData"));

    this.userRole = loginData?.role;
    this.userType = loginData?.type
    this.adminId = loginData?._id;

    this.getSpokenLanguage();

    // view_profile_Data
    if (this.userRole === 'STAFF') {

      this.getstaffdetails(this.adminId);
    }
    else {
    this.getProfileDetails(this.adminId);
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
    if (this.userRole == "INDIVIDUAL" || this.userRole == "ADMIN") {
      // this.router.navigate([`/portals/viewProfile/${this.route_type}`])
      this.router.navigate([`/portals/editProfile/${this.route_type}`])
     

    } else if (this.userRole == "STAFF") {
      let loginData = JSON.parse(localStorage.getItem("loginData"));
      this.staff_ID = loginData?._id
      this.openVerticallyCenterededitstaff(this.editstaffcontent, this.staff_ID);
    }
  }
  onGroupIconChange(event: any) {
    let file = event.target.files[0];
    const formData: FormData = new FormData();
    formData.append("portal_user_id",this.adminId);
    formData.append("docType", "four_portal_staff");
    formData.append("multiple", "false");
    formData.append("documents", file);
    formData.append("portalType", this.userType);

      this.staff_profile_file = formData;
      let reader = new FileReader();
      reader.onload = (event: any) => {
        this.staff_profile = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
  }

  keyURL: any = "";
  uploadDocument() {
    if (this.staff_profile_file != null) {
    this.fourportalService.uploadFileForPortal(this.staff_profile_file).subscribe({
      next: async (res: any) => {
        let result = await this.coreService.decryptObjectData({ data: res });
        this.keyURL = result.data[0];
        this.editStaffDetails();
      },
      error: (err) => {
        console.log(err);
      },
    });
  } else {
    this.editStaffDetails();
  }
  }
  editStaffDetails() {
    this.isSubmitted = true;
    if (this.editStaff.invalid) {
      this.coreService.showError("", "Please Fill all the Fields")
      return;
    }
    this.isSubmitted = false;
    let fields = this.editStaff.value;
    let row = {
      staffId: this.adminId,
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
      assignToDoctor: [this.adminId],
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
      creatorId: this.adminId,
      type:this.userType
    };

    this.fourportalService.editStaff(row).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        if(result.status){
          this.toastr.success("Update successfully")
          this.getstaffdetails(this.adminId);
          this.handleClose();
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  public handleClose() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
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
      staffId: id,
      type:this.userType
    };

    this.fourportalService.getStaffDetails(pararm).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        this.staff_details = result?.body
        this.selectedLanguages = this.staff_details?.in_profile?.language;

        this.staff_ID = result.body.in_profile._id
        let in_profile = result.body.in_profile;
        let location = result?.body?.in_profile?.in_location;
        this.staff_profile = in_profile.profile_picture;
        
        if (location?.country) {
          this.getCountryList(location?.country);
          this.getRegionList(location?.country, location?.region);
          this.getProvienceList(location?.region, location?.province);
          this.getDepartmentList(location?.province, location?.department);
          this.getCityList(location?.department, location?.city, location?.village);
        }

        this.editStaff.controls["staff_name"].setValue(in_profile?.name);
        this.editStaff.controls["first_name"].setValue(
          in_profile.first_name
        ); this.editStaff.controls["middle_name"].setValue(
          in_profile.middle_name
        );
        this.editStaff.controls["last_name"].setValue(
          in_profile.last_name
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
          in_profile?.in_location?.country
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
  getProfileDetails(id) {
    let reqdata = {
      id: id
    }
    this.fourportalService.centerProfileView(reqdata).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      if(response.status){
        this.profileDetails = response?.data;
        
        this.profilePicture = response?.data?.adminData?.profile_picture_signed_url;
        this.locationData = response?.data?.locationData;
        this.license_Picture = this.profileDetails?.licencePicSignedUrl;
        response?.data?.adminData?.centre_picture_signed_urls.forEach((element) => {
          this.pharmacyPictures.push(element);
        });      
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


  getTitleList(_id: any) {
    this.sadminService.getByIdTitle(_id).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        this.title = result?.body?.list[0]?.title;
      },
      error: (err) => {
        console.log(err);
      },
    });
  } 

  handleLocationChange(locationId) {
    this.selectedLocation = locationId;

    this.availabilityArray.forEach((element) => {
      if (
        element.appointment_type === this.appointmenType &&
        element?.location_id === locationId
      ) {
        this.arrangAvailability(element?.week_days);
      }
    });
  }
 
  selected_Location: any
  handleSelectedLocationChangeFees(location_id) {
    this.selected_Location = location_id
    this.selected_hospitalLocation = this.feeDetails.filter(ele => ele.location_id === location_id)
    this.handleSelectConsulation('online')
  }

  handleSelectConsulation(event: any) {
    this.selected = event
    this.selectedData = this.selected_hospitalLocation[0][event]
  }

  handleSelectAvailabilty(event) {
    let obj: any;
    this.appointmenType = event.value;

    this.availabilityArray.forEach((element) => {
      if (
        element.appointment_type === event.value &&
        element?.location_id === this.selectedLocation
      ) {

        this.arrangAvailability(element?.week_days);
      }
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
    let getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  };
  //Calling address api's
  autoComplete: google.maps.places.Autocomplete;
  getCountrycodeintlTelInput() {
    let country_code = '';
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

  countryList: any[] = [];
  regionList: any[] = [];
  provienceList: any[] = [];
  departmentList: any[] = [];
  cityList: any[] = [];
  villageList: any[] = [];
  unitList: any[] = [];
  serviceList: any[] = [];
  specialtyList: any[] = [];

  getCountryList(country_id = '') {
    this.countryList = []
    this.sadminService.getcountrylist().subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
             const countryList = result.body?.list;
        countryList.map((country)=>{
          this.countryList.push(
            {
              label :country.name,
              value :country._id
            }
          )
        })
        this.editStaff.get("country").patchValue(this.staff_details?.in_profile?.in_location?.country)
        result.body?.list.forEach((element) => {

          if (element?._id === country_id) {
            this.country = element?.name;
          }
        });
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  getRegionList(countryID: any, regionId = '') {
    this.regionList = []
    if (!countryID) {
      return;
    }
    this.sadminService.getRegionListByCountryId(countryID).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        const regionList = result.body?.list;
        // regionList.map((region)=>{
        //   this.regionList.push(
        //     {
        //       label : region.name,
        //       value : region._id
        //     }
        //   )
          
        // })
        regionList.forEach(region => {
          const exists = this.regionList.findIndex(item => item.label === region?.name && item.value === region?._id) !== -1;
          if (!exists) {
            this.regionList.push({
              label: region?.name,
              value: region?._id,
            });
          }
        });
        this.editStaff.get("region").patchValue(this.staff_details?.in_profile?.in_location?.region)
        if(!this.editStaff.get("region").value){
          this.editStaff.get("department").patchValue("")
          this.editStaff.get("city").patchValue("")
          this.editStaff.get("village").patchValue("")
          this.editStaff.get("province").patchValue("")
          }


        result.body?.list.forEach((element) => {
          if (element?._id === regionId) {
            this.region = element?.name;
          }
        });
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getProvienceList(regionID: any, provinceId = '') {
    this.provienceList = []
    if (!regionID) {
      return;
    }
    this.sadminService.getProvinceListByRegionId(regionID).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        const provienceList = result.body?.list;
        provienceList.forEach(province => {
          const exists = this.provienceList.findIndex(item => item.label === province?.name && item.value === province?._id) !== -1;
          if (!exists) {
            this.provienceList.push({
              label: province?.name,
              value: province?._id,
            });
          }
        });
        this.editStaff.get("province").patchValue(this.staff_details?.in_profile?.in_location?.province)
        if(!this.editStaff.get("province").value){
          this.editStaff.get("department").patchValue("")
          this.editStaff.get("city").patchValue("")
          this.editStaff.get("village").patchValue("")
          }
        result.body?.list.forEach((element) => {
          if (element?._id === provinceId) {
            this.province = element?.name;
          }
        });
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getDepartmentList(provinceID: any, departmentId = '') {
    this.departmentList = []
    if (!provinceID) {
      return;
    }
    this.sadminService.getDepartmentListByProvinceId(provinceID).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        const departmentList = result.body?.list;
        departmentList.forEach(department => {
          const exists = this.departmentList.findIndex(item => item.label === department?.name && item.value === department?._id) !== -1;
          if (!exists) {
            this.departmentList.push({
              label: department?.name,
              value: department?._id,
            });
          }
        });
        this.editStaff.get("department").patchValue(this.staff_details?.in_profile?.in_location?.department)
        if(!this.editStaff.get("department").value){
          this.editStaff.get("city").patchValue("")
          this.editStaff.get("village").patchValue("")
          }
        result.body?.list.forEach((element) => {
          if (element?._id === departmentId) {
            this.department = element?.name;
          }
        });
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getCityList(departmentID: any, cityId = '', villageId = '') {
    this.villageList = [];
    this.cityList = []
    if (!departmentID) {
      return;
    }
    this.sadminService.getCityListByDepartmentId(departmentID).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        const cityList = result.body.list;
        cityList.forEach(city => {
          const exists = this.cityList.findIndex(item => item.label === city?.name && item.value === city?._id) !== -1;
          if (!exists) {
            this.cityList.push({
              label: city?.name,
              value: city?._id,
            });
          }
        });
        this.editStaff.get("city").patchValue(this.staff_details?.in_profile?.in_location?.city)
        result.body?.list.forEach((element) => {
          if (element?._id === cityId) {
            this.city = element?.name;
          }
        });
      },
      error: (err) => {
        console.log(err);
      },
    });

    this.sadminService.getVillageListByDepartmentId(departmentID).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        const villageList = result.body.list;
        villageList.forEach(village => {
          const exists = this.villageList.findIndex(item => item.label === village?.name && item.value === village?._id) !== -1;
          if (!exists) {
            this.villageList.push({
              label: village?.name,
              value: village?._id,
            });
          }
        });
        this.editStaff.get("village").patchValue(this.staff_details?.in_profile?.in_location?.village)
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

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

  returnWithAmPm(data: any) {
    let filterValue = this.coreService.convertTwentyFourToTwelve(data);
    if (parseInt(filterValue) > 1200 || parseInt(filterValue) === 1200) {
      let format = filterValue.slice(0, 2);
      let after12 = parseInt(format) - 12;

      let finalTime =
        after12 != 0
          ? after12 + ":" + filterValue.slice(2, 4) + " PM"
          : data + " PM";
      return finalTime;
    } else {
      let am = data + " AM";
      return am;
    }
  }

  handleChangePassword() {
    this.isSubmitted = true;
    if (this.changePasswordForm.invalid) {
      return;
    }
    this.isSubmitted = false;

    let reqData = {
      id: this.adminId,
      old_password: this.changePasswordForm.value.old_password,
      new_password: this.changePasswordForm.value.new_password,
      type: this.userType
    };

    this.fourportalService.changePassword(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.toastr.success(response.message);
          this.changePasswordForm.reset();
        } else {
          this.toastr.error(response.message);
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
      id: notificationData?._id,
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
    this.fourportalService.updateNotification(this.notificationData).subscribe((res: any) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.toastr.success(response.message);
        this.modalService.dismissAll("Closed");
      }
    });
  }
}
