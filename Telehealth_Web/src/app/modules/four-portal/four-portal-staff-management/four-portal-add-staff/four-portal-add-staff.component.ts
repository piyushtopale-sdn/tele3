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
// import { IndiviualDoctorService } from "../../indiviual-doctor.service";
import Validation from "src/app/utility/validation";
import intlTelInput from "intl-tel-input";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { DateAdapter } from "@angular/material/core";
import { FourPortalService } from "../../four-portal.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
@Component({
  selector: 'app-four-portal-add-staff',
  templateUrl: './four-portal-add-staff.component.html',
  styleUrls: ['./four-portal-add-staff.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FourPortalAddStaffComponent implements OnInit {

  addStaff: FormGroup;
  isSubmitted: boolean = false;
  staff_profile_file: FormData = null;
  staff_profile: any = "";

  selectedCountryCode: any = "+966";
  iti: any;
  loc: any = {};
  loginUserId: any = "";
  @ViewChild("countryPhone") countryPhone: ElementRef<HTMLInputElement>;
  @ViewChild("address") address!: ElementRef;
  maxDate = new Date();
  pageSize: number = 10;
  page: any = 1;
  searchText :any =''
  selectedLanguages:any = [];

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };
  patchCountry: any;
  userType: any;
  overlay:false;
  hide1 = true;
  hide2 = true;
  spokenLanguages: any[] = [];  
  RoleList: any[] = [];
  docUserType: string;
  constructor(
    private _superAdminService: SuperAdminService,
    private _coreService: CoreService,
    private fb: FormBuilder,
    private dateAdapter: DateAdapter<Date>,
    private fourPortalService: FourPortalService,
    private route: Router,
    private loader: NgxUiLoaderService
  ) {
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy
    const userData = this._coreService.getLocalStorage("loginData");

    this.loginUserId = userData._id;
    this.userType = userData?.type
  

    if(this.userType === 'Laboratory'){
      this.docUserType = 'laboratory';
    }else{
      this.docUserType = 'radiology';
    }
    this.addStaff = this.fb.group(
      {
        first_name: ["", [Validators.required]],
        middle_name: [""],
        last_name: ["", [Validators.required]],
        first_name_arabic: ["", [Validators.required]],
        middle_name_arabic: [""],
        last_name_arabic: ["", [Validators.required]],
        dob: ["", [Validators.required]],
        language: [""],
        address: ["",[Validators.required]],
        neighborhood: [""],
        city: [""],
        village: [""],
        country: [""],
        pincode: [""],
        degree: [""],
        mobile: ["",[Validators.required, Validators.pattern(/^\d{2}-\d{3}-\d{4}$/)]],
        email: ["", [Validators.required]],     
        region: [""],
        province: [""],
        department: [""],
        role: ["", [Validators.required]],
        aboutStaff: [""],
        password: ["", [Validators.required,  Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#\\$%\\^&\\*]).{8,}$') ]],
        confirmPassword: ["", [Validators.required]],
        doj:[new Date()]
      },
      { validators: [Validation.match("password", "confirmPassword")] }
    );
  }

  ngOnInit(): void {
    this.getSpokenLanguage();   
    this.getAllRole();

  }
  get addStaffFormControl(): { [key: string]: AbstractControl } {
    return this.addStaff.controls;
  }

  // onGroupIconChange(event: any) {
  //   const formData: any = new FormData();
  //   formData.append("docName", event.target.files[0]);
  //   formData.append("userId", this.loginUserId);
  //   formData.append("docType", "individual_doctor_pic");
  //   formData.append("multiple", "false");

  //   this.staff_profile_file = formData;

  //   if (event.target.files && event.target.files[0]) {
  //     var reader = new FileReader();
  //     reader.onload = (event: any) => {
  //       this.staff_profile = event.target.result;
  //     };
  //     reader.readAsDataURL(event.target.files[0]);
  //   }
  // }

  onGroupIconChange(event: any) {
    let file = event.target.files[0];
    const formData: FormData = new FormData();
    formData.append("userId", this.loginUserId);
    formData.append("docType", "profile");
    formData.append("file", file);
    formData.append("serviceType", this.docUserType);

      this.staff_profile_file = formData;
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.staff_profile = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
  }
  keyURL: any = "";
  async onSubmit() {
    this.isSubmitted = true;

    if (this.addStaff.invalid) {
     
      this._coreService.showError("Please fill all required fields", '')    
      return;
      
    }

    this.isSubmitted = false; 
    // this.staff_profile_file.forEach((value, key) => {
    //   });
    if (this.staff_profile_file != null) {

      this.fourPortalService.uploadFileForPortal(this.staff_profile_file).subscribe({
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

  add_Staff() {
    let fields = this.addStaff.value;
    let row = {
      first_name:fields.first_name,
      middle_name:fields.middle_name,
      last_name:fields.last_name,
      first_name_arabic:fields.first_name_arabic,
      middle_name_arabic:fields.middle_name_arabic,
      last_name_arabic:fields.last_name_arabic,
      dob: fields.dob,
      language: this.selectedLanguages,
      addressInfo: {
        loc: this.loc,
        address: fields.address,
        neighborhood: fields.neighborhood,
        country: fields.country,
        region: fields.region,
        province: fields.province,
        department: fields.department,
        city: fields.city,
        village: fields.village,
        pincode: fields.pincode,
      },
      email: fields?.email?.toLowerCase(),
      role: fields.role,
      password: fields.password,
      aboutStaff: fields.aboutStaff,
      countryCode: this.selectedCountryCode,
      mobile: fields.mobile,
      profilePic: this.keyURL,
      creatorId: this.loginUserId,
      type:this.userType,
      doj: fields.doj
    };

    this.loader.start();
    this.fourPortalService.addStaff(row).subscribe({
      next: async (res) => {
        let result = await this._coreService.decryptObjectData({ data: res });
        if (result.status) {
          this.loader.stop();
          this._coreService.showSuccess(result.message, '');
          this._coreService.setCategoryForService(1);
          this.route.navigate([`portals/staffmanagement/${this.userType}`]);

          

        } else {
          this.loader.stop();
          this._coreService.showError(result.message, '');
        }

      },
      error: (err) => {
        console.log(err);
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

  autoComplete: google.maps.places.Autocomplete;
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
        nationality: getAddress.country,
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
  
  getSpokenLanguage() {
    this._superAdminService.spokenLanguage().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      // this.spokenLanguages = response.body?.spokenLanguage;
      const arr = response.body?.spokenLanguage;
      arr.map((curentval: any) => {
        this.spokenLanguages.push({
          label: curentval?.label,
          value: curentval?.value,
        });
      });  
    });
  }

  getAllRole() {
    this.RoleList = []
    let param = {
      userId: this.loginUserId,
      page: 1,
      limit: 0,
      searchText: "",
      type:this.userType
    };
    
    this.fourPortalService.getAllRoles(param).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        const RoleList = result?.body?.data;
         RoleList.map((role)=>{
          this.RoleList.push(
            {
              label : role.name,
              value : role._id
            }
          )
         })
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  onSelectionChange(event: any): void {
    this.selectedLanguages = this.addStaff.value.language;
  }

  routeBack(){
    this.route.navigate([`portals/staffmanagement/${this.userType}`]);
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

