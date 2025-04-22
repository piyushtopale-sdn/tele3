import {
  Component,
  OnInit,
  ViewEncapsulation,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { SuperAdminService } from "../../../super-admin/super-admin.service";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "../../indiviual-doctor.service";
import Validation from "src/app/utility/validation";
import intlTelInput from "intl-tel-input";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { NgxUiLoaderService } from "ngx-ui-loader";
@Component({
  selector: "app-addstaff",
  templateUrl: "./addstaff.component.html",
  styleUrls: ["./addstaff.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AddstaffComponent implements OnInit {
  addStaff: FormGroup;
  isSubmitted: boolean = false;
  staff_profile_file: FormData = null;
  staff_profile: any = "";
  keyURL: any = "";
  selectedCountryCode: any = "+226";
  selectedcountrycodedb: any = '';
  iti: any;
  loc: any = {};
  loginUserId: any = "";
  doctorRole: any = "";
  @ViewChild("countryPhone") countryPhone: ElementRef<HTMLInputElement>;
  @ViewChild("address") address!: ElementRef;
  maxDate = new Date();
  pageSize: number = 10;
  page: any = 1;
  searchText: any = ''
  selectedLanguages: any = [];

  myFilter = (d: Date | null): boolean => {
    return true;
  };
  patchCountry: any;
  selectedSpecialities: any = [];

  hide1 = true;
  hide2 = true;

  constructor(
    private _superAdminService: SuperAdminService,
    private _coreService: CoreService,
    private fb: FormBuilder,
    private _indiviualDoctor: IndiviualDoctorService,
    private route: Router,
    private loader: NgxUiLoaderService
  ) {
    const userData = this._coreService.getLocalStorage("loginData");

    this.loginUserId = userData._id;
    this.doctorRole = userData?.role;

    this.addStaff = this.fb.group(
      {
        staff_name: [""],
        first_name: ["", [Validators.required]],
        middle_name: [""],
        last_name: ["", [Validators.required]],
        first_name_arabic: ["", [Validators.required]],
        middle_name_arabic: [""],
        last_name_arabic: ["", [Validators.required]],
        dob: ["", [Validators.required]],
        language: [""],
        address: ["", [Validators.required]],
        neighborhood: [""],
        city: [""],
        village: [""],
        country: [""],
        pincode: [""],
        degree: [""],
        mobile: ["", [Validators.required, Validators.pattern(/^\d{2}-\d{3}-\d{4}$/)]],
        email: ["", [Validators.required]],
        unit: [""],
        services: [""],
        staffDepartment: [""],
        region: [""],
        province: [""],
        department: [""],
        role: ["", [Validators.required]],
        specialty: ["", [Validators.required]],
        aboutStaff: [""],
        password: ["", [Validators.required]],
        confirmPassword: ["", [Validators.required]],
        doj: [new Date()]
      },
      { validators: [Validation.match("password", "confirmPassword")] }
    );
  }

  getCountryCode() {
    let country_code = 'SA';
    const countryData = (window as any).intlTelInputGlobals.getCountryData();
    for (let i = 0; i < countryData.length; i++) {
      if (countryData[i].dialCode === this.selectedcountrycodedb.split("+")[1]) {
        country_code = countryData[i].iso2;
        break;
      }
    }
    const input = this.countryPhone?.nativeElement;
    if (input !== undefined) {
      this.iti = intlTelInput(input, {
        initialCountry: country_code,
        separateDialCode: true,
      });
      this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
    }
  }

  ngAfterViewInit() {
    this.getCountryCode()
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
      this.addStaff.patchValue({
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

  ngOnInit(): void {
    this.getSpokenLanguage();
    this.getCountryList();
    this.getAllRole();
    this.getSpecialty();
  }

  get addStaffFormControl(): { [key: string]: AbstractControl } {
    return this.addStaff.controls;
  }

  onGroupIconChange(event: any) {
    const formData: any = new FormData();
    formData.append("file", event.target.files[0]);
    formData.append("userId", this.loginUserId);
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
  }

  async onSubmit() {
    this.isSubmitted = true;
    if (this.addStaff.invalid) {
      const firstInvalidField = document.querySelector(
        'input.ng-invalid, input.ng-invalid');
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth' });
      }
      this._coreService.showError("", "Please fill all required fields.")
      const invalid = [];
      const controls = this.addStaff.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          invalid.push(name);
        }
      }
      return;
    }

    this.isSubmitted = false;
    if (this.staff_profile_file != null) {
      this._indiviualDoctor.uploadFileForPortal(this.staff_profile_file).subscribe({
        next: async (res: any) => {
          let result = await this._coreService.decryptObjectData({ data: res });
          this.keyURL = result.data[0];
          this.add_Staff();
        },
        error: (err) => {
          console.log(err);
        },
      });
    } else {
      this.add_Staff();
    }
    this.isSubmitted = false;
  }

  add_Staff() {
    this.loader.start();
    let fields = this.addStaff.value;
    let row = {
      staff_name: fields.first_name + " " + fields.middle_name + " " + fields.last_name,
      first_name: fields.first_name,
      middle_name: fields.middle_name,
      last_name: fields.last_name,
      first_name_arabic: fields.first_name_arabic,
      middle_name_arabic: fields.middle_name_arabic,
      last_name_arabic: fields.last_name_arabic,
      dob: fields.dob,
      language: this.selectedLanguages,
      addressInfo: {
        loc: this.loc,
        address: fields.address,
        neighborhood: fields.neighborhood,
        country: fields.country ? fields.country : null,
        region: fields.region ? fields.region : null,
        province: fields.province ? fields.province : null,
        department: fields.department ? fields.department : null,
        city: fields.city ? fields.city : null,
        village: fields.village ? fields.village : null,
        pincode: fields.pincode,
      },
      email: fields.email?.toLowerCase(),
      role: fields.role,
      assignToDoctor: [],
      password: fields.password,
      assignToStaff: [],
      aboutStaff: fields.aboutStaff,
      specialty: this.selectedSpecialities,
      services: [],
      department: [],
      unit: [],
      expertise: "",
      countryCode: this.selectedCountryCode,
      mobile: fields.mobile,
      profilePic: this.keyURL,
      creatorId: this.loginUserId,
      doj: fields.doj
    };

    this._indiviualDoctor.addStaff(row).subscribe({
      next: async (res) => {
        let result = await this._coreService.decryptObjectData({ data: res });
        if (result.status) {
          this.loader.stop();
          this._coreService.showSuccess(result.message, '');
          this._coreService.setCategoryForService(1);
          this.route.navigateByUrl('individual-doctor/staffmanagement');
        } else {
          this.loader.stop();
          this._coreService.showError(result.message, '');
        }
      },
      error: (err) => {
        this._coreService.showError(err.statusText, '');
        this.loader.stop();
      },
    });
  }

  removeSelectpic() {
    this.staff_profile = "";
  }

  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  };

  // ----------------------------api for dropdown selection---------------------------------------
  autoComplete: google.maps.places.Autocomplete;
  spokenLanguages: any[] = [];
  countryList: any[] = [];
  regionList: any[] = [];
  provienceList: any[] = [];
  departmentList: any[] = [];
  cityList: any[] = [];
  villageList: any[] = [];
  RoleList: any[] = [];
  specialtyList: any[] = [];
  overlay: false;

  getSpokenLanguage() {
    this._superAdminService.spokenLanguage().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      const arr = response.body?.spokenLanguage;
      arr.map((curentval: any) => {
        this.spokenLanguages.push({
          label: curentval?.label,
          value: curentval?.value,
        });
      });
    });
  }

  getCountryList() {
    this._superAdminService.getcountrylist().subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        const countryList = result.body?.list;
        countryList.map((country) => {
          this.countryList.push(
            {
              label: country.name,
              value: country._id
            }
          )
        })
        let data = this.countryList.map((ele) => {
          if (ele.label === "Burkina Faso") {
            this.patchCountry = ele.value;          
          }
        })
        if (this.patchCountry != '') {
          this.getRegionList(this.patchCountry);
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getRegionList(countryID: any) {
    this.regionList = []
    if (!countryID) {
      return;
    }
    this._superAdminService.getRegionListByCountryId(countryID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        const regionList = result.body?.list;
        regionList.map((region) => {
          this.regionList.push(
            {
              label: region.name,
              value: region._id
            }
          )
        })
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getProvienceList(regionID: any) {
    this.provienceList = []
    if (!regionID) {
      return;
    }
    this._superAdminService.getProvinceListByRegionId(regionID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        const provienceList = result.body?.list;
        provienceList.map((province) => {
          this.provienceList.push(
            {
              label: province.name,
              value: province._id
            }
          )
        })
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getDepartmentList(provinceID: any) {
    this.departmentList = []
    if (!provinceID) {
      return;
    }
    this._superAdminService
      .getDepartmentListByProvinceId(provinceID)
      .subscribe({
        next: (res) => {
          let result = this._coreService.decryptObjectData({ data: res });
          const departmentList = result.body?.list;
          departmentList.map((department) => {
            this.departmentList.push(
              {
                label: department.name,
                value: department._id
              }
            )
          })
        },
        error: (err) => {
          console.log(err);
        },
      });
  }

  getCityList(departmentID: any) {
    this.cityList = []
    if (!departmentID) {
      return;
    }
    this._superAdminService.getCityListByDepartmentId(departmentID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        const cityList = result.body.list;
        cityList.map((city) => {
          this.cityList.push(
            {
              label: city.name,
              value: city._id
            }
          )
        })
      },
      error: (err) => {
        console.log(err);
      },
    });

    this._superAdminService
      .getVillageListByDepartmentId(departmentID)
      .subscribe({
        next: (res) => {
          let result = this._coreService.decryptObjectData({ data: res });
          const villageList = result.body.list;
          villageList.map((village) => {
            this.villageList.push(
              {
                label: village.name,
                value: village._id
              }
            )
          })
        },
        error: (err) => {
          console.log(err);
        },
      });
  }

  getAllRole() {
    let param = {
      userId: this.loginUserId,
      page: 1,
      limit: 0,
      searchText: "",
    };

    this._indiviualDoctor.getAllRole(param).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        const RoleList = result?.body?.data;
        RoleList.map((role) => {
          this.RoleList.push(
            {
              label: role?.name,
              value: role?._id
            }
          )
        })
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  
  getSpecialty() {
    this._indiviualDoctor.getAllSpeciality().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      // this.specialityListt = response?.body?.data;
      const arr = response?.body?.data;
      arr.map((curentval: any) => {
        this.specialtyList.push({
          label: curentval?.specilization,
          value: curentval?._id,
        });
      });
    });
  }

  onSelectionChange(event: any): void {
    this.selectedLanguages = this.addStaff.value.language;
  }

  onSpecialityChange(event: any): void {
    this.selectedSpecialities = this.addStaff.value.specialty;
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

    this.addStaff.get('mobile')?.setValue(formattedNumber, { emitEvent: false });
  }

}
