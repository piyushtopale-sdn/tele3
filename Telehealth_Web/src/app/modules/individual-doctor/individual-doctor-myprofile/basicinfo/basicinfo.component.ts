import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  FormControl,
  AbstractControl,
} from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { CoreService } from "src/app/shared/core.service";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import intlTelInput from "intl-tel-input";
import { MatStepper } from "@angular/material/stepper";
import Validation from "src/app/utility/validation";
import { ActivatedRoute } from "@angular/router";
import { IndiviualDoctorService } from "../../indiviual-doctor.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as XLSX from 'xlsx';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { DateAdapter } from "@angular/material/core";
@Component({
  selector: "app-basicinfo",
  templateUrl: "./basicinfo.component.html",
  styleUrls: ["./basicinfo.component.scss"],
})
export class BasicinfoComponent implements OnInit {
  @Output() callParent = new EventEmitter<void>();

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
  basicInfo: any = FormGroup;
  isSubmitted: boolean = false;
  profileImage: any = "";
  license_picture_: any = "";
  profileImageFile: FormData = null;
  licenseFile: FormData = null;
  selectedCategories: any = [];
  categoryListt: any[] = [];

  iti: any;
  selectedCountryCode: any;
  autoComplete: google.maps.places.Autocomplete;
  loc: any = {};

  locationData: any;

  spokenLanguages: any[] = [];
  pageForAdd: any = true;
  profileDetails: any;
  doctorId: any = "";
  doctorRole: any = "";
  minDate: Date = new Date();
  stepper: any;
  selectedcountrycodedb: any = '';
  license_picture: any = null;
  deginationList: any[] = [];
  designation: any;
  selectedLanguages: any = [];

  isSubmitted1: Boolean = false;
  countryCodes: string[];
  selectedSpecialities: any = [];
  selectedSpeciality: any = [];
  overlay: false;
  basicDetails: any = {};
  maxDate = new Date();
  constructor(
    private toastr: ToastrService,
    private sadminService: SuperAdminService,
    private coreService: CoreService,
    private fb: FormBuilder,    
    private dateAdapter: DateAdapter<Date>,
    private individualDoctorService: IndiviualDoctorService,
    private modalService: NgbModal,
    private loader: NgxUiLoaderService
  ) {
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy
    this.setMinDate();
    this.basicInfo = this.fb.group({
      profile_picture: [""],
      first_name: ["", [Validators.required]],
      first_name_arabic: ["", [Validators.required]],
      middle_name: [""],
      middle_name_arabic: [""],
      last_name: ["", [Validators.required]],
      last_name_arabic: ["", [Validators.required]],
      address: ["", [Validators.required]],
      loc: [""],
      neighborhood: [""],
      nationality: ["", [Validators.required]],
      region: [""],
      province: [""],
      department: [""],
      city: [""],
      village: [""],
      pincode: ["",[Validators.pattern(/^\d{5,6}$/)]],
      mobile: [
        "",
        [Validators.required, Validators.pattern(/^\d{2}-\d{3}-\d{4}$/)],
      ],
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
      language: ["", [Validators.required]],
      userName: [""],
      aboutDoctor: [""],
      aboutDoctorArabic: [""],

      license_details: this.fb.group({
        license_number: ["", [Validators.required,Validators.pattern(/^[a-zA-Z0-9]{6,}$/)]],
        license_expiry_date: [""],
        licence_image: [""],
      }),

      speciality: ["", [Validators.required]],
      slogan: [""],
      categoryIds:[""],

    });
    this.countryCodes = ["+226(BF)", "+229(BJ)", "+225(CI)", "+223(ML)", "+221(SN)", "+228(TG)"];
  }
  setMinDate() {
    // Set minDate to tomorrow
    const today = new Date();
    this.minDate = new Date(today.setDate(today.getDate() + 1));
  }
  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  };

  ngAfterViewInit() {
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
      this.loc.type = "Point";
      this.loc.coordinates = [
        place.geometry.location.lng(),
        place.geometry.location.lat(),
      ];
      const getAddress = this.getAddressComponents(place.address_components)
      this.basicInfo.patchValue({
        address: place.formatted_address,
        loc: this.loc,
        nationality: getAddress.country,
        city: getAddress.city,
        village: getAddress.village,
        region: getAddress.region,
        province: getAddress.province,
        department: getAddress.department,
        pincode: getAddress.pincode,
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
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    
    this.doctorId = loginData?._id;
    this.doctorRole = loginData?.role;

    this.getSpokenLanguage();
    this.getDoctorDetails(this.mstepper);
    this.getSpecialities();
    this.getAllDesignation();
    this.getCategories();

  }

  testExcelForm: FormGroup = new FormGroup({
    specialization_csv: new FormControl("", [Validators.required]),
  });

  //For Edit Doctor
  getDoctorDetails(fromParent: any) {
    let response = fromParent?.response;
    this.stepper = fromParent?.mainStepper;

    this.profileDetails = response?.data?.result[0];

    this.selectedLanguages = this.profileDetails.spoken_language;

    this.profileImage = response?.data?.result[0]?.profile_picture_signed_url;
    this.license_picture_ = this.profileDetails?.license_details?.license_image_signed_url;
    this.patchValues(this.profileDetails);
    this.basicDetails = { ...this.profileDetails }
    this.locationData = response?.data?.result[0]?.in_location;
  }

  //-----------patch values---------
  patchValues(data: any) {
    this.selectedcountrycodedb = data?.for_portal_user?.country_code
    this.license_picture = data?.license_details?.license_image_signed_url,
    this.selectedCategories = data.categoryIds;
   
    this.basicInfo.patchValue({
        ...data,
        ...data?.in_location,
        ...data?.for_portal_user,
        experience: data?.years_of_experience,
        language: this.selectedLanguages,
        aboutDoctor: data?.about,
        aboutDoctorArabic: data?.about_arabic,
        license_details: {
          license_number: data?.license_details?.license_number,
          license_expiry_date: data?.license_details?.license_expiry_date,
          licence_image: data?.license_details?.license_image,
        },


        nationality: data?.in_location?.country,
        profilePicture: data?.profile_picture?._id,
        // bank_details: data?.in_bank,

      });

    for (let data1 of data?.speciality) {
      this.selectedSpeciality.push(data1?._id)
    }

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

  //For Add Doctor
  async handleSaveBasicInfo(isNext: any = "") {
    this.isSubmitted = true;
    if (this.basicInfo.invalid) {
      const firstInvalidField = document.querySelector(
        'input.ng-invalid, input.ng-invalid');
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth' });
      }
      this.coreService.showError("", "Please fill all required fields.")
      const invalid = [];
      const controls = this.basicInfo.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          invalid.push(name);
        }
      }
      return;
    }
    this.isSubmitted = false;
    this.loader.start();
    if (this.licenseFile) {
      await this.uploadDocument(this.licenseFile).then((res: any) => {
        this.license_picture_ = res.data[0],
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
      years_of_experience: data?.experience,
      email: data?.email?.toLowerCase(),
      gender: data?.gender,
      spoken_language: this.selectedLanguages,
      about: data?.aboutDoctor,
      about_arabic: data?.aboutDoctorArabic,
      license_number: data?.license_details?.license_number,
      license_expiry_date: data?.license_details?.license_expiry_date,
      licence_image: data?.license_details?.licence_image,
      speciality: this.selectedSpecialities,
      for_hospital: "",
      id: this.doctorId,
    };

    this.individualDoctorService.basicInformation(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });

        if (response.status) {
          this.loader.stop();
          this.callParent.emit()
          if (isNext === 'yes') {
            this.stepper.next();
          }
        } else {
          this.loader.stop();
          this.coreService.showError("", response.message);
        }
      },
      (err) => {
        this.loader.stop();
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.message);
      }
    );
  }

  onFileSelected(event, type: "profile" | "license") {
    let file = event.target.files[0];
    const formData: FormData = new FormData();
    formData.append("userId", this.doctorId);
    formData.append("docType", type);
    formData.append("file", file);
    formData.append("serviceType", "doctor");

    if (type === "license") {
      this.licenseFile = formData;
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.license_picture = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }

    if (type === "profile") {
      // Allowed image types
      let file = event.target.files[0];
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
      this.individualDoctorService.uploadFileForPortal(doc).subscribe(
        (res) => {
          let response = this.coreService.decryptObjectData({ data: res });
          if(response.status){
            resolve(response);
          }else{
            this.coreService.showError("Error",response.message)
          }
        },
        (err) => {
          let errResponse = this.coreService.decryptObjectData({
            data: err.error,
          });          
          this.toastr.error(errResponse.message);
        }
      );
    });
  }
  //----------------------------------------------------------------------------
  specialityListt: any[] = [];
  getSpecialities() {
    this.individualDoctorService.getAllSpeciality().subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      // this.specialityListt = response?.body?.data;
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

  //------------address component api's-------------
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
      this.basicInfo.patchValue({
        language: this.selectedLanguages
      });
    });
  }
  get f() {
    return this.basicInfo.controls;
  }
  removeSelectpic(data: any) {
    if (data === "profileImage") {
      this.profileImage = "";
    }
    else if (data === "license_picture") {
      this.license_picture = "";
    }

  }
  getAllDesignation() {
    this.individualDoctorService.getAllDesignation().subscribe((res) => {
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
        this.basicInfo.get("designation").patchValue(this.basicDetails.designation)

      }

    });
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  onSelectionChange(event: any): void {
    this.selectedLanguages = this.basicInfo.value.language;
  }

  onSpecialityChange(event: any): void {
    this.selectedSpecialities = this.basicInfo.value.speciality;
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.isSubmitted1 = false;
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

    this.basicInfo.get('mobile')?.setValue(formattedNumber, { emitEvent: false });
  }


  onCategoryChange(event: any): void {
    this.selectedCategories = this.basicInfo.value.categoryIds;
  }

  getCategories() {    
      let reqData = {
        searchText:"",
        page:1,
        limit:0,
        status:"active"
      }
  
      this.individualDoctorService.getAllCategory(reqData).subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });  
          if(response.status){        
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
        }
      });
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
