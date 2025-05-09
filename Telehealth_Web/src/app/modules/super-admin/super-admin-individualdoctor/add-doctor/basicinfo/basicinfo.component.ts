import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  FormControl,
} from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { CoreService } from "src/app/shared/core.service";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import intlTelInput from "intl-tel-input";
import { MatStepper } from "@angular/material/stepper";
import Validation from "src/app/utility/validation";
import { ActivatedRoute } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as XLSX from 'xlsx';
import { IndiviualDoctorService } from "src/app/modules/individual-doctor/indiviual-doctor.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { DateAdapter } from '@angular/material/core';
@Component({
  selector: "app-basicinfo",
  templateUrl: "./basicinfo.component.html",
  styleUrls: ["./basicinfo.component.scss"],
})
export class BasicinfoComponent implements OnInit {
  @Output() fromChild = new EventEmitter<string>();
  @Output() callParent = new EventEmitter<void>();
  teams = new FormControl("");
  teamList: string[] = ["Team1", "Team2", "Team3", "Team4"];
  specialities = new FormControl("");
  specialityList: string[] = [
    "Speciality1",
    "Speciality2",
    "Speciality3",
    "Speciality4",
  ];
  services = new FormControl("");
  serviceList: string[] = [
    "Service1",
    "Service2",
    "Service3",
    "Service4",
    "Service5",
  ];
  departments = new FormControl("");
  departmentsList: string[] = [
    "Department1",
    "Department2",
    "Department3",
    "Department4",
  ];
  units = new FormControl("");
  unitList: string[] = ["Unit1", "Unit2", "Unit3", "Unit4"];
  experties = new FormControl("");
  expertiesList: string[] = [
    "Expertise1",
    "Expertise2",
    "Expertise3",
    "Expertise4",
    "Expertise5",
  ];

  @Input() public mstepper: MatStepper;
  @ViewChild("mobile") mobile: ElementRef<HTMLInputElement>;
  @ViewChild("address") address!: ElementRef;
  superadminId: any = "";
  basicInfo: any = FormGroup;
  isSubmitted: boolean = false;
  isSubmitted1: boolean = false;
  profileImage: any = "";
  profileImageFile: FormData = null;
  licenseFile: FormData = null;
  minDate: Date = new Date();
  iti: any;
  selectedCountryCode: any = "+966";
  autoComplete: google.maps.places.Autocomplete;
  loc: any = {};

  countryList: any[] = [];

  spokenLanguages: any[] = [];

  pageForAdd: any = true;
  profileDetails: any;
  doctorId: any = "";

  stepper: any;
  id: any;
  overlay: false;
  doctor_id: any;
  langId: any;
  village_id: any;
  speciality_id: any;
  experties_id: any;
  nationalityselected: any = '';
  regionselected: any;
  license_image: any = null;
  titleList: any[] = [];
  deginationList: any[] = [];
  license_picture_: any = "";
  selectedLanguages: any = [];
  selectedcountrycodedb: any = '+966';
  maxDate = new Date();
  isColumnNameCorrect: boolean = false;
  countryCodes: string[];
  selectedSpecialities: any = [];
  selectedCategories: any = [];
  selectedSpeciality: any = [];
  patchCountry: any;
  hide1 = true;
  hide2 = true;

  constructor(
    private toastr: ToastrService,
    private service: IndiviualDoctorService,
    private sadminService: SuperAdminService,
    private coreService: CoreService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private individualDoctorService: IndiviualDoctorService,
    private loader: NgxUiLoaderService,
    private dateAdapter: DateAdapter<Date>
  ) {
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy
    this.basicInfo = this.fb.group(
      {
        profile_picture: [""],
        first_name: ["", [Validators.required,this.coreService.nameValidator()]],
        first_name_arabic: ["", [Validators.required,this.coreService.nameValidator()]],
        middle_name: [""],
        middle_name_arabic: [""],
        last_name: ["", [Validators.required,this.coreService.nameValidator()]],
        last_name_arabic: ["", [Validators.required,this.coreService.nameValidator()]],
        address: ["", [Validators.required]],
        loc: [""],
        neighborhood: [""],
        nationality: ["", [Validators.required]],
        region: [""],
        province: [""],
        department: [""],
        city: [""],
        categoryIds:[""],
        village: [""],
        pincode: ["",[Validators.pattern(/^\d{5,6}$/)]],
        mobile: ["", [Validators.required, Validators.pattern(/^\d{2}-\d{3}-\d{4}$/)]],
        dob: ["", [Validators.required]],
        date_of_join: [""],
        designation: ["", [Validators.required]],       
        experience: ["", [Validators.required]],
        email: [
          "",
          [
            Validators.required,
            Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$"),
          ],
        ],
        gender: ["", [Validators.required]],
        language: [""],
        userName: [""],
        password: [
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
        confirm_password: [null, [Validators.required]],
        aboutDoctor: [""],
        aboutDoctorArabic: [""],
        license_details: this.fb.group({
          license_number: ["",[Validators.required,Validators.pattern(/^[a-zA-Z0-9]{6,}$/)]],
          license_expiry_date: ["",this.coreService.LicenseDateValidator()],
          licence_image: [""],
        }),
        speciality: ["", [Validators.required]],   
        doctorfees: [""],

      },
      { validators: [Validation.match("password", "confirm_password")] }
    );

    this.countryCodes = ["+226(BF)", "+229(BJ)", "+225(CI)", "+223(ML)", "+221(SN)", "+228(TG)"];

  }

  onLicenseNumberInput(event: any) {
    const value = event.target.value;
    const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, '');
    if (value !== alphanumericValue) {
      event.target.value = alphanumericValue; 
    }
  }
  

  onMobileInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value.replace(/\D/g, ''); 
    let formattedNumber = '';
  
    if (input.length <= 2) {
      formattedNumber = input;
    } else if (input.length <= 5) {
      formattedNumber = `${input.slice(0, 2)}-${input.slice(2)}`;
    } else {
      formattedNumber = `${input.slice(0, 2)}-${input.slice(2, 5)}-${input.slice(5, 9)}`;
    }
  
    this.basicInfo.get('mobile')?.setValue(formattedNumber, { emitEvent: false });
  }

  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  };

  getCountryCode() {
    let country_code = '';
    const countryData = (window as any).intlTelInputGlobals.getCountryData();
    for (let i = 0; i < countryData.length; i++) {
      if (countryData[i].dialCode === this.selectedcountrycodedb.split("+")[1]) {
        country_code = countryData[i].iso2;

        break; // Break the loop when the country code is found
      }
    }
    const input = this.mobile?.nativeElement;
    if (input !== undefined) {

      this.iti = intlTelInput(input, {
        initialCountry: country_code,
        separateDialCode: true,
      });
      this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
    }
  }

  ngAfterViewInit() {
    // if (this.doctorId === null) {
    this.getCountryCode()
    // }
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
      this.basicInfo.patchValue({
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


    let paramId = this.activatedRoute.snapshot.paramMap.get("id");
    localStorage.setItem("portal_user",paramId)
    this.doctorId = paramId;
    if (paramId === null) {
      this.pageForAdd = true;
      this.stepper = this.mstepper;
    } else {
      this.pageForAdd = false;
      this.doctorId = paramId;
      sessionStorage.setItem("doctorId", paramId);
      this.getDoctorDetails(this.mstepper);
      this.basicInfo.get("password").clearValidators();
      this.basicInfo.get("confirm_password").clearValidators();
    }
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.superadminId = loginData?._id;
    this.getSpokenLanguage();
    this.getSpecialities();
    this.getCategories();

    this.getAllDesignation();
    // this.getAllTitle();
  }

  testExcelForm: FormGroup = new FormGroup({
    specialization_csv: new FormControl("", [Validators.required]),
  });

  locationData: any;

  getDoctorDetails(fromParent: any) {
    let response = fromParent?.response;
    this.stepper = fromParent?.mainStepper;
    this.profileDetails = response?.data?.result[0];
    this.profileImage = this.profileDetails?.profile_picture_signed_url;
    this.license_picture_ = this.profileDetails?.license_details?.license_image_signed_url;
    this.locationData = this.profileDetails?.in_location;

    if (response.status == true) {
      this.patchValues(this.profileDetails);
    }
  }

  //-----------patch values---------
  patchValues(data: any) {
    this.basicInfo.patchValue({
      ...data,
      ...data?.in_location,
      ...data?.for_portal_user,
      experience: data?.years_of_experience,
      language: data?.spoken_language,
      aboutDoctor: data?.about,
      aboutDoctorArabic: data?.about_arabic,
      license_details: {
        license_number: data?.license_details?.license_number,
        license_expiry_date: data?.license_details?.license_expiry_date,
        licence_image: data?.license_details?.license_image,
      },
      speciality: data?.speciality,
      nationality: data?.in_location?.country,
    });
    
    this.selectedCategories = data.categoryIds;
    this.selectedcountrycodedb = data?.for_portal_user?.country_code;
    
    if (data && data?.speciality && Array.isArray(data?.speciality)) {
      for (let data1 of data?.speciality) {
        if (data1 && data1?._id) {
          this.selectedSpeciality.push(data1?._id);
        }
      }
    }
    this.getCountryCode();

  }

  //For Add Doctor
  async handleSaveBasicInfo() {
    const invalid = [];
    const controls = this.basicInfo.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    this.isSubmitted = true;
    if (this.basicInfo.invalid) {
      const firstInvalidField = document.querySelector(
        'input.ng-invalid, input.ng-invalid'
      );
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth' });
      }
      this.coreService.showError("", "Please fill all required fields.")
      return;

    }
    this.isSubmitted = false;
    if (this.licenseFile) {
      await this.uploadDocument(this.licenseFile).then((res: any) => {
        this.license_picture_ = res.data[0]
        this.basicInfo.patchValue({
          license_details: {
            licence_image: res.data[0],
          },
        });
      });
    }
    
    if (this.profileImageFile) {
      await this.uploadDocument(this.profileImageFile).then((res: any) => {
        this.basicInfo.patchValue({
          profile_picture: res.data[0],
        });
        this.coreService.showSuccess("", res.message);
      });
    }

    let data = this.basicInfo.value;
    var reqData = {
      profile_picture: data?.profile_picture,
      first_name: data?.first_name,
      first_name_arabic: data?.first_name_arabic,
      middle_name: data?.middle_name,
      middle_name_arabic: data?.middle_name_arabic,
      last_name: data?.last_name,
      last_name_arabic: data?.last_name_arabic,
      address: data?.address,
      loc: data?.loc,
      neighborhood: data?.neighborhood,
      country: data?.nationality,
      region: data?.region,
      province: data?.province,
      location_department: data?.department,
      city: data?.city,
      village: data?.village,
      pincode: data?.pincode,
      mobile: data?.mobile,
      country_code: this.selectedCountryCode,
      dob: data?.dob,
      designation: data?.designation,
      // title: data?.title,
      categoryIds:data?.categoryIds,
      years_of_experience: data?.experience,
      email: data?.email?.toLowerCase(),
      gender: data?.gender,
      spoken_language: this.selectedLanguages,
      password: data?.password,
      about: data?.aboutDoctor,
      about_arabic: data?.aboutDoctorArabic,
      license_number: data?.license_details?.license_number,
      license_expiry_date: data?.license_details?.license_expiry_date,
      licence_image: data?.license_details?.licence_image,
      speciality: this.selectedSpecialities,
      doctorfees: data?.doctorfees,
      for_hospital: "",
      id: "",
      isInfoCompleted: true
    };
    
    this.loader.start();
    if (this.pageForAdd) {
      reqData.for_hospital = this.superadminId;
    } else {
      reqData.id = this.doctorId;
    }


    this.service.basicInformation(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.loader.stop();
          this.toastr.success(response.message);
          sessionStorage.setItem("doctorId", response?.data?.PortalUserDetails?._id ? response?.data?.PortalUserDetails?._id : response?.data?.portal_user_id);
          localStorage.setItem("portal_user",response?.data?.portal_user_id)
          this.callParent.emit()
          if (this.pageForAdd) {
            this.fromChild.emit("basicInfo");
          } else {
            this.stepper.next();
          }
        } else {
          this.loader.stop();
          this.coreService.showError("", response.message);
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.loader.stop();
        this.toastr.error(errResponse.message);
      }
    );
  }

  onFileSelected(event, type: "profile" | "license") {
    let file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", "");
    formData.append("docType", type);
    formData.append("serviceType", "doctor");

    if (type === "license") {
      this.licenseFile = formData;
      const reader = new FileReader();
      reader.onload = (event: any) => {
        this.license_picture_ = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }

    if (type === "profile") {
      // Allowed image types
      const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validImageTypes.includes(file.type)) {
        this.coreService.showError("", "Invalid file type. Please select an image file only.");
        event.target.value = "";
        return;
      }

      this.profileImageFile = formData;
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.profileImage = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  private uploadDocument(doc: FormData) {
    return new Promise((resolve, reject) => {
      this.sadminService.uploadFileForPortal(doc).subscribe(
        (res) => {
          const response = this.coreService.decryptObjectData({ data: res });
          if (response.status) {
            resolve(response);
          } else {
            this.coreService.showError("Error", response.message);
            reject(response.message);
          }
        },
        (err) => {
          const errResponse = this.coreService.decryptObjectData({
            data: err.error,
          });
          this.toastr.error(errResponse.message);
          reject(errResponse.message);
        }
      );
    });
  }



  specialityListt: any[] = [];
  categoryListt: any[] = [];


  specialityId: boolean = false;

  getspecialityId(event: any) {
    this.speciality_id = event.value;
    if (this.speciality_id) {
      this.specialityId = true;
    }
  }

  getSpecialities() {

    this.service.getAllSpeciality().subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      const arr = response?.body?.data;
      arr.map((curentval: any) => {
        this.specialityListt.push({
          label: curentval?.specilization,
          value: curentval?._id,
        });
      });
      this.basicInfo.patchValue({
        speciality: this.selectedSpeciality
      });
    });
  }

  getCategories() {
  
    let reqData = {
      searchText:"",
      page:1,
      limit:0,
      status:"active"
    }

    this.service.getAllCategory(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      const arr = response?.body?.result;
      
      arr.map((curentval: any) => {
        this.categoryListt.push({
          label: curentval?.categoryName,
          value: curentval?._id,
        });
      });
      this.basicInfo.patchValue({
        categoryIds: this.selectedCategories
      });

    });
  }


  //------------address component api's-------------
  spokenlang: boolean = false;

  getLangId(event: any) {
    this.langId = event?.value;
    if (this.id) {
      this.spokenlang = true;
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
      this.basicInfo.patchValue({
        language: this.profileDetails?.spoken_language
      })
    });
  }

  get f() {
    return this.basicInfo.controls;
  }
  removeSelectpic(index: any) {

    if (index === 'profileImage') {
      this.profileImage = ""
    } else if (index === 'license_picture_') {
      this.license_picture_ = "";
      this.basicInfo.patchValue({
        license_details: {
          licence_image: null,
        },
      });
    }

  }
  // getAllTitle() {
  //   this.service.getAllTitle().subscribe((res) => {
  //     let response = this.coreService.decryptObjectData({ data: res });

  //     if (response.status) {
  //       const titleList = response?.body?.list
  //       titleList.map((title) => {
  //         this.titleList.push(
  //           {
  //             label: title.title,
  //             value: title._id
  //           }
  //         )
  //       })
  //       // this.basicInfo.get("title").patchValue(this.profileDetails?.title)
  //     }

  //   });
  // }
  getAllDesignation() {
    this.service.getAllDesignation().subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      if (response.status) {
        const deginationList = response?.body?.list
        deginationList.map((designation) => {
          this.deginationList.push(
            {
              label: designation.designation,
              value: designation._id
            }
          )
        })
        this.basicInfo.get("designation").patchValue(this.profileDetails?.designation)

      }

    });
  }


  onSelectionChange(event: any): void {
    this.selectedLanguages = this.basicInfo.value.language;
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.isSubmitted1 = false;
  }


  onSpecialityChange(event: any): void {
    this.selectedSpecialities = this.basicInfo.value.speciality;
  }

  onCategoryChange(event: any): void {
    this.selectedCategories = this.basicInfo.value.categoryIds;
  }

  enforceMaxLength(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.value.length > 7) {
      inputElement.value = inputElement.value.slice(0, 50);
      // Update the form control value to match truncated input
      this.basicInfo.get('license_details.license_number')?.setValue(inputElement.value);
    }
  }

  pinforceMaxLength(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.value.length > 6) {
      inputElement.value = inputElement.value.slice(0, 6);
      this.basicInfo.get('pincode')?.setValue(inputElement.value);
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
