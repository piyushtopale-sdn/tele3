import {
  Component,
  OnInit,
  ViewEncapsulation,
  ElementRef,
  ViewChild,
} from "@angular/core";
import Validation from "src/app/utility/validation";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { CoreService } from "src/app/shared/core.service";
import intlTelInput from "intl-tel-input";
import { IEncryptedResponse, IResponse } from "src/app/shared/classes/api-response";
import { PharmacyStaffResponse } from "./addstaff.component.type";
import { PharmacyService } from "../../pharmacy.service";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { DateAdapter } from "@angular/material/core";
@Component({
  selector: "app-addstaff",
  templateUrl: "./addstaff.component.html",
  styleUrls: ["./addstaff.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AddstaffComponent implements OnInit {
  isSubmitted: boolean = false;
  addStaff: FormGroup;
  staffRole: any[] = []; 
  staffRole2 : any[] = [];
  selectedFiles: any = "";
  selectedCountryCode: any = "+966";
  iti: any;
  userID: any;
  spokenLanguages: any[] = [];
  pageSize: number = 10
  page: any = 1;
  @ViewChild("countryPhone") countryPhone: ElementRef<HTMLInputElement>;
  @ViewChild("address") address!: ElementRef;
  staff_profile_file: FormData = null;
  staff_profile: any = "";

  searchText: any = '';
  patchCountry: any;
  selectedLanguages:any = [];
  hide1 = true;
  hide2 = true;
  maxDate = new Date();
  profilePicture: FormData = null;


  constructor(
    private fb: FormBuilder,
    private _route: Router,
    private _pharmacyService: PharmacyService,
    private _superAdminService: SuperAdminService,
    private _coreService: CoreService,
    private loader: NgxUiLoaderService,
    private dateAdapter: DateAdapter<Date>,

  ) {
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy
    const userData = this._coreService.getLocalStorage("loginData");
    this.userID = userData._id;
    this._pharmacyService.allRole(userData._id).subscribe((res) => {
      let result = this._coreService.decryptObjectData(res);
      if (result.status) {
        this.staffRole = result?.body;
      }
    });

    this.addStaff = this.fb.group(
      {
        staff_profile: [""],
        staff_name: [""],
        first_name: ["", [Validators.required]],
        middle_name: [""],
        last_name: ["", [Validators.required]],
        first_name_arabic: ["", [Validators.required]],
        middle_name_arabic: [""],
        last_name_arabic: ["", [Validators.required]],
        dob: ["",[Validators.required]],
        language: [""],
        address: ["", [Validators.required]],
        neighborhood: [""],
        country: [""],
        region: [""],
        province: [""],
        department: [""],
        city: [""],
        village: [""],
        pincode: [""],
        degree: [""],
        email: ["", [Validators.required]],
        role: ["", [Validators.required]],
        userName: [""],
        password: ["", [Validators.required,  Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#\\$%\\^&\\*]).{8,}$') ] ],
        confirmPassword: ["", [Validators.required], ],
        about: [""],
        phone_number: ["",[Validators.required, Validators.pattern(/^\d{2}-\d{3}-\d{4}$/)]],
        doj:[new Date()]
      },
      { validators: [Validation.match("password", "confirmPassword")] }
    );
  }

  ngOnInit(): void {
    let admin = this._coreService.getLocalStorage("loginData");
    this.userID = admin._id;
    this.getAllRole();
    this.getSpokenLanguage();
  }

  get addStaffFormControl(): { [key: string]: AbstractControl } {
    return this.addStaff.controls;
  }

  selectFile(file: any) {
    let image = file.target.files[0];
    this.addStaff.patchValue({
      staff_profile: image,
    });
  }

  /* Call Spoken language API */
  getSpokenLanguage() {
    this._superAdminService.spokenLanguage().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      this.spokenLanguages = response.body?.spokenLanguage;
    });
  }

  private getAllRole() {
    let param = {
      userId: this.userID,
      page: 1,
      limit: 0,
      searchText: "",
    };
    this._pharmacyService.allRoles(param).subscribe((res) => {
      let result = this._coreService.decryptObjectData({data:res});
      if (result?.status) {
        const staffRole = result?.body?.data
        staffRole.map((role)=>{
         this.staffRole2.push(
          {
            label : role.name,
            value : role._id
          }
         )
        })
      }
    })
  }

  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  };

  autoComplete: google.maps.places.Autocomplete;
  loc: any = {};

  ngAfterViewInit() {
    const input = this.countryPhone.nativeElement;
    this.iti = intlTelInput(input, {
      initialCountry: "SA",
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
      this.addStaff.patchValue({ address: place.formatted_address,
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
  
  

  async onSubmit() {
    this.isSubmitted = true;

    if (this.addStaff.invalid) {
     
      this._coreService.showError("Please fill all required fields", '')    
      return;
      
    }

    this.isSubmitted = false; 
    // this.staff_profile_file.forEach((value, key) => {
    //     console.log(`key--->${key}: ${value}`);
    //   });
    if (this.staff_profile_file != null) {

      this._pharmacyService.uploadDocument(this.staff_profile_file).subscribe({
        next: async (res: any) => {
          let result = await this._coreService.decryptObjectData({ data: res });
          if(result.status){

            this.keyURL = result.data[0];
            this.add_Staff();
          }

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

  add_Staff(){
    const values = this.addStaff.value;

    let reqData = {
    staff_profile: this.keyURL, 
    staff_name: values.first_name+" "+values.middle_name+" "+values.last_name,
    first_name: values.first_name,
    middle_name: values.middle_name,
    last_name: values.last_name,
    first_name_arabic: values.first_name_arabic,
    middle_name_arabic: values.middle_name_arabic,
    last_name_arabic: values.last_name_arabic,
    dob: values.dob,
    language: JSON.stringify(this.selectedLanguages),
    address: values.address,
    neighborhood: values.neighborhood,
    country: values.country,
    region: values.region,
    province: values.province,
    department: values.department,
    city: values.city,
    village: values.village,
    pincode: values.pincode,
    degree: values.degree,
    phone_number: values.phone_number,
    email: values.email?.toLowerCase(),
    role: values.role,
    password: values.password,
    confirmPassword: values.confirmPassword,
    about: values.about,
    userId: this.userID,
    country_code: this.selectedCountryCode,
    doj: values.doj,     
    }
    this.loader.start()   

    this._pharmacyService.addStaff(reqData).subscribe({
      next: (result: IEncryptedResponse<PharmacyStaffResponse>) => {
        let decryptedResult = this._coreService.decryptObjectData(result);

        if (decryptedResult.status) {
          this.loader.stop()
          this._coreService.showSuccess("", decryptedResult.message);
          this._route.navigate(["pharmacy/staffmanagement"]);
        } 
        else {
          this.loader.stop()
          this._coreService.showError("", decryptedResult.message);
        }
      },
      error: (err: ErrorEvent) => {
        let decryptedResult = this._coreService.decryptObjectData({
          data: err.error,
        });
        this.loader.stop()
        this._coreService.showError("", decryptedResult.message);
      },
    });
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  reset() {
    // this.addStaff.reset();
    this._route.navigate(['/pharmacy/staffmanagement']);
  }

  onGroupIconChange(event: any) {
    let file = event.target.files[0];
    const formData: FormData = new FormData();
    formData.append("userId", this.userID);
    formData.append("docType", "profile");
    formData.append("file", file);
    formData.append("serviceType", 'pharmacy');

      this.staff_profile_file = formData;
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.staff_profile = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
  }
  keyURL: any = "";



  removeSelectpic(){
    this.staff_profile=""

  }


  onSelectionChange(event: any): void {
    this.selectedLanguages = this.addStaff.value.language;
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

    this.addStaff.get('phone_number')?.setValue(formattedNumber, { emitEvent: false });
  }

  private uploadDocument(doc: FormData) {
    return new Promise((resolve, reject) => {
      this._pharmacyService.uploadDocument(doc).subscribe({
        next: (result: IResponse<any>) => {
          let response = this._coreService.decryptObjectData({ data: result });
          if(response.status){

            resolve(response);
            reject(response);
          }
          },
          
        error: (err: ErrorEvent) => {
          this._coreService.showError("", err.message);
        },
      });
    });
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