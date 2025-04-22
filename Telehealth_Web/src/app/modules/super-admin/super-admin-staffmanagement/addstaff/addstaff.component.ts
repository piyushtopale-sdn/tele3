import { Component, OnInit, ViewEncapsulation, ElementRef, ViewChild } from "@angular/core";
import Validation from "src/app/utility/validation";
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { CoreService } from "src/app/shared/core.service";
import intlTelInput from 'intl-tel-input';
import { SuperAdminService } from "../../super-admin.service";
import { IEncryptedResponse } from "src/app/shared/classes/api-response";
import { SuperAdminStaffResponse } from "./addstaff.component.type";
import { NgxUiLoaderService } from "ngx-ui-loader";


@Component({
  selector: 'app-addstaff',
  templateUrl: './addstaff.component.html',
  styleUrls: ['./addstaff.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddstaffComponent implements OnInit {
  isSubmitted: boolean = false;
  addStaff: FormGroup;
  staffRole: any[] = [];
  selectedFiles: any = '';
  selectedCountryCode: any = "+226";
  iti: any;
  userID: any;
  profileIcon: any;
  hide1 = true;
  hide = true;
  page: any = 1;
  pageSize: number = 5;
  searchText: any = "";
  selectedLanguages:any = [];
  @ViewChild('countryPhone') countryPhone: ElementRef<HTMLInputElement>;
  @ViewChild("address") address!: ElementRef;
  patchCountry: any;
  loginID: any;
  userRole: any;
  adminID: any;
  overlay:false;


  constructor(
    private fb: FormBuilder,
    private _route: Router,
    private _superAdminService: SuperAdminService,
    private loader: NgxUiLoaderService,
    private _coreService: CoreService) {

    const userData = this._coreService.getLocalStorage('loginData')

    this.loginID = userData._id
    this.userRole = userData?.role

    
    this.roleList();
 


    this.addStaff = this.fb.group(
      {
        staff_profile: [""],
        staff_name: [""],
        first_name: ["",[Validators.required]],
        middle_name: [""],
        last_name: ["",[Validators.required]],
        dob: ["", [Validators.required]],
        language: ["", [Validators.required]],
        address: ["", [Validators.required]],
        neighborhood: [""],
        country: ["", [Validators.required]],
        region: [""],
        province: [""],
        department: [""],
        city: [""],
        village: [""],
        pincode: [""],
        email: ["", [Validators.required]],
        role: ["", [Validators.required]],
        password: ["", [Validators.required,  Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#\\$%\\^&\\*]).{8,}$') ]],
        confirmPassword: ["", [Validators.required]],
        about_staff: [""],
        phone: ["", [Validators.required]],

      },
      { validators: [Validation.match("password", "confirmPassword")] }
    );
  }

  ngOnInit(): void {  

    this.getCountryList();
    this.getSpokenLanguage()
  }

  get addStaffFormControl(): { [key: string]: AbstractControl } {
    return this.addStaff.controls;
  }

  onGroupIconChange(event: any) {
    if (event.target.files && event.target.files[0]) {
      let file = event.target.files[0];
      this.addStaff.patchValue({
        staff_profile: file,
      });
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.profileIcon = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  /*     code for country code starts
  */
  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  }
  autoComplete: google.maps.places.Autocomplete
  loc: any = {};

  ngAfterViewInit() {
    const input = this.countryPhone.nativeElement

    this.iti = intlTelInput(input, {
      initialCountry: "BF",
      separateDialCode: true
    });
    this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode

    const options = {
      fields: ["address_components", "geometry.location", "icon", "name", "formatted_address"],
      strictBounds: false,
    };
    this.autoComplete = new google.maps.places.Autocomplete(this.address.nativeElement, options)
    this.autoComplete.addListener("place_changed", (record) => {
      const place = this.autoComplete.getPlace();
      this.loc.type = "Point";
      this.loc.coordinates = [place.geometry.location.lng(), place.geometry.location.lat()]
      this.addStaff.patchValue({ address: place.formatted_address })
    })
  }

  /*
     code for country code ends
  */


     roleList() {
      this.staffRole = [];
      let reqData = {
        page: 1,
        limit: 0,
        searchText: "",
        userId: this.loginID,       
      };
      this._superAdminService.allRoleSuperAdmin(reqData).subscribe(
        (res: any) => {
          let encryptedData = { data: res };
          let response = this._coreService.decryptObjectData(encryptedData);
          const staffRole = response?.body?.data
          staffRole.map((role)=>{
          this.staffRole.push(
            {
              label : role?.name,
              value : role?._id
            }
          )
          })
        })
  
    }

  onSubmit() {
    this.isSubmitted = true;
    const values = this.addStaff.value

    if (this.addStaff.invalid) {
      return;
    }
    this.isSubmitted = false;;
    const userAdminData = this._coreService.getLocalStorage('adminData')

    if(this.userRole === 'STAFF_USER'){
      this.adminID = userAdminData?.for_staff
    }else{
      this.adminID = this.loginID
    }
    this.loader.start();
    const formData: any = new FormData();
    formData.append("staff_profile", values.staff_profile);
    formData.append("staff_name", values.first_name+" "+values.middle_name+" "+values.last_name);
    formData.append("first_name", values.first_name);
    formData.append("middle_name", values.middle_name);
    formData.append("last_name", values.last_name);
    formData.append("dob", values.dob);
    formData.append("language", JSON.stringify(this.selectedLanguages));
    formData.append("address", values.address);
    formData.append("neighborhood", values.neighborhood);
    formData.append("country", values.country);
    formData.append("region", values.region);
    formData.append("province", values.province);
    formData.append("department", values.department);
    formData.append("city", values.city);
    formData.append("village", values.village);
    formData.append("pincode", values.pincode);
    // formData.append("degree", values.degree);
    // formData.append("phone",values.phone)
    formData.append("mobile", values.phone);
    formData.append("email", values.email?.toLowerCase());
    formData.append("staff_role", values.role);
    formData.append("password", values.password);
    formData.append("confirmPassword", values.confirmPassword);
    formData.append("about_staff", values.about_staff);
    formData.append("userId", this.adminID )
    formData.append("country_code", this.selectedCountryCode)
    formData.append("createdBy", this.loginID)
    // formData.append("state",values.state);

    for (let [key, value] of formData) {
    }

    this._superAdminService.addStaff(formData).subscribe({
      next: (result: IEncryptedResponse<SuperAdminStaffResponse>) => {
        let decryptedResult = this._coreService.decryptObjectData(result);

        if (decryptedResult.status) {
          this.loader.stop();
          this._coreService.showSuccess("", "Staff Added Successfully");
          this._route.navigate(['super-admin/staffmanagement']);
        } else {
          this.loader.stop();
          this._coreService.showError("", decryptedResult.message);
        }
      },
      error: (err: ErrorEvent) => {
          let errResponse = this._coreService.decryptObjectData({
          data: err.error,
        });
        this.loader.stop();
        this._coreService.showError("", errResponse.message)
      }
    })
    //Serivce call here
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  reset() {
    this.addStaff.reset();
    this._route.navigate([`/super-admin/staffmanagement`])
  }

  //-----Calling address API's---------------

  countryList: any[] = [];
  regionList: any[] = [];
  provienceList: any[] = [];
  cityList: any[] = [];
  villageList: any[] = [];
  departmentList: any[] = [];
  spokenLanguages: any[] = [];

  getCountryList() {
    this._superAdminService.getcountrylist().subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        const countryList = result.body?.list;
        countryList.map((country)=>{
          this.countryList.push(
            {
              label :country.name,
              value :country._id
            }
          )
        })
        let data =    this.countryList.map((ele)=>{
          if(ele.label === "Burkina Faso"){
            this.patchCountry = ele.value;
          }
          
        })
        if(this.patchCountry!='')
        {
          this.getRegionList(this.patchCountry);
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getSpokenLanguage() {
    this._superAdminService.spokenLanguage().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });

      this.spokenLanguages = response.body?.spokenLanguage;
    });
  }
  getRegionList(countryID: any) {
    this.regionList = []
    if(!countryID) return
    this._superAdminService.getRegionListByCountryId(countryID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        const regionList = result.body?.list;
        regionList.forEach(region => {
          const exists = this.regionList.findIndex(item => item.label === region?.name && item.value === region?._id) !== -1;
          if (!exists) {
            this.regionList.push({
              label: region?.name,
              value: region?._id,
            });
          }
        });
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getProvienceList(regionID: any) {
    this.provienceList =[]
  if(!regionID) return
    this._superAdminService.getProvinceListByRegionId(regionID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
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
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getDepartmentList(provinceID: any) {
    this.departmentList = []
    if(!provinceID) return
    this._superAdminService.getDepartmentListByProvinceId(provinceID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
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
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getCityList(departmentID: any) {
    this.villageList = []
    this.cityList = []
    if(!departmentID) return
    this._superAdminService.getCityListByDepartmentId(departmentID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
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
      },
      error: (err) => {
        console.log(err);
      },
    });

    this._superAdminService.getVillageListByDepartmentId(departmentID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
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
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  handleRemoveLogo(){
    this.profileIcon=''
  }

  onSelectionChange(event: any): void {
    this.selectedLanguages = this.addStaff.value.language;
    
  }

}

