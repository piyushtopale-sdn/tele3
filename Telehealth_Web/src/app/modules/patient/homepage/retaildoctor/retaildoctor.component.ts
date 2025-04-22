import { PatientService } from "src/app/modules/patient/patient.service";
import { SuperAdminService } from "./../../../super-admin/super-admin.service";
import { IndiviualDoctorService } from "../../../individual-doctor/indiviual-doctor.service";
import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  HostListener,
} from "@angular/core";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { CoreService } from "src/app/shared/core.service";
import { PharmacyService } from "src/app/modules/pharmacy/pharmacy.service";
import { IResponse } from "src/app/shared/classes/api-response";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";


const ELEMENT_DATA = [
  { name: "", prescribed: "", frequency: "", duration: "", action: "" },
];

@Component({
  selector: "app-retaildoctor",
  templateUrl: "./retaildoctor.component.html",
  styleUrls: ["./retaildoctor.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class RetaildoctorComponent implements OnInit {
  hospital_Name: any;

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value) + "CFS";
    }

    return `${value}`;
  }


  formatLabelDistance(value: number): string {

    if (value >= 0.1) {
      return Math.round(value) + "KM";
    }

    return `${value}`;
  }

  myControl = new FormControl("");
  loginUserID: string = "";
  portalUserID: string = "";
  options: string[] = ["One", "Two", "Three"];
  simpleOptions: any;
  filteredOptions!: Observable<any[]>;
  medicineList: any = [];
  medicineName: string = "";
  prescriptionSignedUrl: string = "";
  medicineIDObject: any = {};
  medicineNameObject: any = {};
  exludeMedicineAmount: any = {};
  newMedicineArray: any = {};
  availableMedicineList: string[] = [];
  total_doctor: any = 0;
  overlay: false;
  currentPage: any = 1;

  // displayedColumns: string[] = [
  //   "name",
  //   "prescribed",
  //   "frequency",
  //   "duration",
  //   "action",
  // ];
  dataSource: MatTableDataSource<AbstractControl>;
  prescription_doc: FormData = null;
  prescription_url: any = [];
  prescription_key: Array<string> = [];
  requestType: any = "NA";
  selectedTabOrder: number = 0;
  fileNamePrescription: string = "";

  searchParams: any;
  doctor_list: any[] = [];
  searchBarForm: any = FormGroup;
  advanceSearchBarForm: any = FormGroup;

  provinceList: any[] = [];
  departmentList: any[] = [];
  cityList: any[] = [];
  provinceID: any = "";
  departmentID: any = "";
  insuranceList: any[] = [];
  selected: any = true;
  AppoinmentType: any[] = [];
  sliderValue: any;
  doctorGender: any[] = [];

  isLoading: boolean = false;
  scrolled: boolean = false;
  scrollDebounceInterval = null;

  @ViewChild("medicinepaymentcontent", { static: false })
  medicinepaymentcontent: any;
  @ViewChild("approved", { static: false }) approved: any;
  @ViewChild("requestmedicinecontent", { static: false })
  requestmedicinecontent: any;
  @ViewChild("requestmedicinepaymentcontent", { static: false })
  requestmedicinepaymentcontent: any;
  @ViewChild("requestapproved", { static: false }) requestapproved: any;
  @ViewChild("requestmedicineavailabilitycontent", { static: false })
  requestmedicineavailabilitycontent: any;
  @ViewChild("requestmedicinepaymentavailabilitycontent", { static: false })
  requestmedicinepaymentavailabilitycontent: any;
  @ViewChild("requestapprovedavailability", { static: false })
  requestapprovedavailability: any;
  @ViewChild("orderMedicineTab") orderMedicineTab: any;
  @ViewChild("nearby") nearby!: ElementRef;
  @ViewChild("loginRequiredWarningModal", { static: false }) loginRequiredWarningModal: any;
  noRecord: any = 0;
  mindate: Date = new Date();
  staticFirstOption: any;
  autoComplete: any
  constructor(
    private modalService: NgbModal,
    private patientService: PatientService,
    private coreService: CoreService,
    private pharmacyService: PharmacyService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private superAdminService: SuperAdminService,
    private router: Router,
    private service: PatientService,
    private toastr: ToastrService,
    private _IndiviualDoctorService: IndiviualDoctorService
  ) {
    this.searchBarForm = this.fb.group({
      doctor_name: [""],
      nearby: [""],
      province: [],
      department: [""],
      city: [""],
      neighborhood: [""],
      insuranceAccept: [""],
      onDutyDoctor: [""],
      openNow: [""],
      lng: [""],
      lat: [""],
      sliderDistance: [5]
    });

    this.advanceSearchBarForm = this.fb.group({
      rating: [""],
      // doctorGender: [""],
      // AppointmentType: [""],
      partner: [""],
      spokenLang: [""],
      consultationFeeSort: [""],
      silder: [""],
      doctorYearOfExperienceSort: [""],
      avalibility: [""],
      availabilityData: [""],
    });
    //this.getDoctorList();
    this.searchOnValueChange();
    let userData = this.coreService.getLocalStorage("loginData");
    if (userData) {
      this.loginUserID = userData._id;
    }
    this.formValueChanges();
  }
  // autoComplete: google.maps.places.Autocomplete;
  loc: any = {};
  ngAfterViewInit() {
    var element = document.querySelector('.pac-container.pac-logo');
    if (element) {
        element.remove();
    } else {
    }
    this.staticFirstOption= {
      description: 'Autour de moi!', // Description you want to display
      place_id: 'static_first_option', // Unique identifier for the static option
      matched_substrings: [], // Empty array for the required property
      reference: '', // Empty string for the required property
      structured_formatting: {
        main_text: '',
        main_text_matched_substrings: [],
        secondary_text: ''
      }, // Empty object for the required property
      terms: [], // Empty array for the required property
      types: [] // Empty array for the required property
    };
    const options = {
      // bounds: defaultBounds,
      // componentRestrictions: { country: "IN" },
      fields: [
        "address_components",
        "geometry.location",
        "icon",
        "name",
        "formatted_address",
      ],
      strictBounds: false,
      // types: ["establishment"],
    };
    this.autoComplete = new google.maps.places.Autocomplete(
      this.nearby.nativeElement,
      options
    );
    const autocompleteService = new google.maps.places.AutocompleteService();

    const inputElement = this.nearby.nativeElement
    const otherElement = document.getElementById('otherElementdoctor');
 
    otherElement.addEventListener('click', function() {
      // Focus on the input element to open the dropdown
      var event = new Event('input', { bubbles: true });
      inputElement.dispatchEvent(event);
  });

    this.nearby.nativeElement.addEventListener('input', () => {

      // Get the user input
      const input = this.nearby.nativeElement.value;

      // Request predictions from AutocompleteService
      autocompleteService.getPlacePredictions({ input }, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {

          // Add the static first option to the predictions array
          predictions.unshift(this.staticFirstOption);

          // Render the predictions
          this.renderPredictions(predictions);
        } else {
          // Handle error or empty predictions
        }
      });
    });

    this.nearby.nativeElement.addEventListener('click', () => {
 
      // Get the user input
      var input = this.nearby.nativeElement.value;

      if(input === ''){
        input = 'aroundme'
      }
 
      // Request predictions from AutocompleteService
      autocompleteService.getPlacePredictions({ input }, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
 
          // Add the static first option to the predictions array
          predictions.unshift(this.staticFirstOption);
 
          // Render the predictions
          this.renderPredictions(predictions);
        } else {
          // Handle error or empty predictions
        }
      });
    });

    this.autoComplete.addListener("place_changed", (record) => {
      // const place = this.autoComplete?.getPlace()
      const place = this.autoComplete.getPlace();
      this.loc.type = "Point";
      this.loc.coordinates = [
        place.geometry.location.lng(),
        place.geometry.location.lat(),
      ];
      this.searchBarForm.patchValue({
        lng: this.loc.coordinates[0],
        lat: this.loc.coordinates[1],
      });
      const pacLogoDiv11 = document.querySelector('.pac-container.pac-logo') as HTMLElement;
      pacLogoDiv11.style.setProperty('display', 'none', 'important');
    });
    


  }
  // Function to render predictions
  renderPredictions(predictions: google.maps.places.AutocompletePrediction[]) {
    // Render predictions in your UI, e.g., dropdown menu

    this.clearDropdown();

    const pacLogoDiv = document.querySelector('.pac-container.pac-logo');

    if (pacLogoDiv) {
      // Render the static option before the pac-container pac-logo div
      const staticOptionElement = document.createElement('div');
      staticOptionElement.className = 'pac-item around'; // add a custom class for styling
  
      // Create and append the image element
      const imgElement = document.createElement('img');
      imgElement.src = '../../../../../assets/img/homepage/sidebar/nearby.svg';
      staticOptionElement.appendChild(imgElement);
  
      // Append the text content
      const textElement = document.createElement('span');
      textElement.textContent = this.staticFirstOption.description;
      staticOptionElement.appendChild(textElement);
  
      pacLogoDiv.appendChild(staticOptionElement);
      const pacLogoDiv11 = document.querySelector('.pac-container.pac-logo') as HTMLElement;
      pacLogoDiv11.style.setProperty('display', 'block', 'important');

      // Add click event listener to the "Around Me" option
      staticOptionElement.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default action
        event.stopPropagation(); // Stop event propagation
        this.getCurrentLocation(); // Call getCurrentLocation function
        // pacLogoDiv11.style.display = 'none !important';
        pacLogoDiv11.style.setProperty('display', 'none', 'important');
      });
    }
  
    // // Render other predictions
    // predictions.forEach(prediction => {
    //   const predictionElement = document.createElement('div');
    //   predictionElement.className = 'pac-item';
    //   predictionElement.textContent = prediction.description;
    //   this.nearby.nativeElement.parentNode.appendChild(predictionElement);
    // });
  }

  clearDropdown() {
    const dropdownItems = document.querySelectorAll('.pac-item');
    dropdownItems.forEach(item => item.parentNode.removeChild(item));
  }
  closeModal() {
    this.modalService.dismissAll();
  }

  ngOnInit() {
    this.getProvinceList();
    this.getParamsValue();
    this.getInsuranceList();

    this.getDepartmentList();
    this.getCitytList();
    this.getSpokenLanguage();
    this.onScroll();

  }
  @HostListener("window:scroll", [])

  onScroll(): void {
    this.scrolled = true;

    if (!this.isLoading) {
      if (this.scrollDebounceInterval) {
        clearTimeout(this.scrollDebounceInterval);
      }

      this.scrollDebounceInterval = setTimeout(() => {
        const scrollPosition = window.innerHeight + window.scrollY;
        const documentHeight = document.body.scrollHeight;
        const scrollThreshold = 1100;

        if (scrollPosition >= documentHeight - scrollThreshold) {
          if (this.noRecord == 0) {
            this.currentPage++;

            this.isLoading = true;

            this.getDoctorList();
          }
          else {
            this.currentPage = 1;
          }

        }
      }, 200);
    }
  }


  getParamsValue() {
    this.route.queryParams.subscribe((res) => {
      this.searchParams = res;
    });

    // Set other form values inside the subscription block
    // if (this.searchParams["fd_onDuty"] === "true") {
    //   this.searchBarForm.patchValue({
    //     onDutyDoctor: true,
    //   });
    // }
    // if (this.searchParams["fd_onDuty"] === "false") {
    //   this.searchBarForm.patchValue({
    //     onDutyDoctor: false,
    //   });
    // }
    // if (this.searchParams["fd_openNow"] === "true") {
    //   this.searchBarForm.patchValue({
    //     openNow: true,
    //   });
    // }
    // if (this.searchParams["fd_openNow"] === "false") {
    //   this.searchBarForm.patchValue({
    //     openNow: false,
    //   });
    // }


    if (this.searchParams) {
      if (this.searchParams["fd_openNow"] == "true") {
        this.searchBarForm.patchValue({
          openNow: true,
        });
      }
      else if (this.searchParams["fd_openNow"] == "false") {
        this.searchBarForm.patchValue({
          openNow: false,
        });
      }

      if (this.searchParams["fd_onDuty"] == "true") {
        this.searchBarForm.patchValue({
          onDutyDoctor: true,
        });
      }
      else if (this.searchParams["fd_onDuty"] == "false") {
        this.searchBarForm.patchValue({
          onDutyDoctor: false,
        });
      }

      this.searchBarForm.patchValue({
        doctor_name: this.searchParams["doctor_name"],
        nearby: this.searchParams["fd_nearby"],
        //province: this.searchParams["fd_province"],
        //department: this.searchParams["fd_department"],
        //city: this.searchParams["fd_city"],
        //insuranceAccept: this.searchParams["fd_insuranceAccept"],
        neighborhood: this.searchParams["fd_neighborhood"],
        //openNow: this.searchParams["fd_openNow"] == "true" ? true : this.searchParams["fd_openNow"],
        //onDutyDoctor: this.searchParams["fd_onDuty"] == "true" ? true : this.searchParams["fd_onDuty"],
        lng: this.searchParams["lng"],
        lat: this.searchParams["lat"],
      });
    }
  }

  getDoctorList(type: any = "") {
    let data = {
      searchText: this.searchBarForm.value.doctor_name
        ? this.searchBarForm.value.doctor_name
        : "",
      city: this.searchBarForm.value.city ? this.searchBarForm.value.city : "",

      department: this.searchBarForm.value.department
        ? this.searchBarForm.value.department
        : "",
      long: this.searchBarForm.value.lng ? this.searchBarForm.value.lng : "",
      lat: this.searchBarForm.value.lat ? this.searchBarForm.value.lat : "",
      province: this.searchBarForm.value.province
        ? this.searchBarForm.value.province
        : "",
      neighborhood: this.searchBarForm.value.neighborhood
        ? this.searchBarForm.value.neighborhood
        : "",
      insuranceAccepted: this.searchBarForm.value.insuranceAccept
        ? this.searchBarForm.value.insuranceAccept
        : "",
      consultationFeeStart: 0,
      consultationFeeEnd: this.advanceSearchBarForm.value.silder,
      consultationFeeSort: this.advanceSearchBarForm.value.consultationFeeSort,
      appointmentType: this.AppoinmentType,
      ratingSort: this.advanceSearchBarForm.value.rating
        ? this.advanceSearchBarForm.value.rating
        : "",
      doctorYearOfExperienceSort: this.advanceSearchBarForm.value
        .doctorYearOfExperienceSort,
      consultationFee: "",
      online: "",
      hospitalClinicVisit: "",
      homeVisit: "",
      doctorAvailability:
        this.advanceSearchBarForm.value.availabilityData == ""
          ? this.advanceSearchBarForm.value.avalibility != ""
            ? this.advanceSearchBarForm.value.avalibility
            : ""
          : this.advanceSearchBarForm.value.availabilityData,
      doctorGender: this.doctorGender,
      spokenLanguage: this.advanceSearchBarForm.value.spokenLang,
      page: this.currentPage,
      limit: 4,
      openNow: this.searchBarForm.value.openNow,
      onDutyDoctor: this.searchBarForm.value.onDutyDoctor,
      maxDistance: this.searchBarForm.value.sliderDistance,
      currentTimeStamp: new Date().toISOString()
    };


    this._IndiviualDoctorService.serachFilterdoctor(data).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });

        const result = response?.data.result;
        this.total_doctor = response?.data?.totalRecords

        //this.doctor_list = JSON.parse(JSON.stringify(response?.data?.result));
        const formValues = Object.values(this.searchBarForm.value);
        const hasValue = formValues.some(value => !!value);

        const adformValues = Object.values(this.advanceSearchBarForm.value);
        let adhasValue = adformValues.some(value => !!value);
        if (this.doctorGender.length > 0) {
          adhasValue = true;
        }


        if (hasValue || adhasValue) {
          this.noRecord = 0;
          if (type == "search") {
            this.doctor_list = []
            this.currentPage = 1;


          }

          const uniqueResult = result.filter((newItem) => {
            const isDuplicate = this.doctor_list.some(existingItem => {
              const isMatching = existingItem._id === newItem._id;
              if (isMatching) {
              }
              return isMatching;
            });
            return !isDuplicate;
          });

          // If the result is not empty, update the doctor_list and isLoading
          this.doctor_list = [...this.doctor_list, ...uniqueResult];

          this.isLoading = false;
        } else if (result.length === 0 && this.currentPage > 1) {
          this.toastr.error("No Any More List To Fetch!");
          this.isLoading = false;
          this.noRecord = 1;
          this.currentPage = 1;
        } else {
          const uniqueResult = result.filter((newItem) => {
            const isDuplicate = this.doctor_list.some(existingItem => {
              const isMatching = existingItem._id === newItem._id;
              if (isMatching) {
              }
              return isMatching;
            });
            return !isDuplicate;
          });

          // If the result is not empty, update the doctor_list and isLoading
          this.doctor_list = [...this.doctor_list, ...uniqueResult];

          this.isLoading = false;
          this.noRecord = 0;

        }

        /*  this.total_doctor = response?.data?.result?.length;
         this.doctor_list = JSON.parse(JSON.stringify(response?.data?.result));
          */

      },
      (err) => {
        let errorResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
      }
    );
  }

  handleRouting(index: any, _id: any) {
    sessionStorage.setItem("tabIndex", index);
    this.router.navigate([`/patient/homepage/retaildoctordetail/${_id}`]);
  }


  searchOnValueChange() {
    this.searchBarForm.valueChanges.subscribe((val) => {
      const hasNonUndefinedValue = Object.values(val).some(value => value !== undefined && value !== '');
      if (hasNonUndefinedValue) {
        this.currentPage = 1;
        this.getDoctorList("search");
      } else {
        this.currentPage = 1;
        this.doctor_list = [];
        this.getDoctorList();
      }
    });
  }
  formValueChanges() {
    this.advanceSearchBarForm.valueChanges.subscribe((selectedValue) => {
      this.currentPage = 1;
      this.getDoctorList("search");

    });
  }

  public handleBtnClick() {
    localStorage.setItem("status","true")
    this.modalService.dismissAll();
    this.router.navigate(["/patient/login"]);
  }
  createOppintment(data: any) {
    if (!this.loginUserID) {
      this.modalService.open(this.loginRequiredWarningModal, {
        centered: true,
        size: "lg",
        windowClass: "order_medicine",
      });
      // this.toastr.error("please login first ");
    } else {
      this.router.navigate(["/patient/homepage/retailappointmentdetail"], {
        queryParams: data,
      });
    }
  }

  public updateMySelection(option: any, i: any) {
    this.medicineIDObject[i] = option.medicine_id;
    this.medicineNameObject[i] = option.medicine_name;
  }

  public clearText() {
    this.medicineName = "";
  }

  handleClearFilter() {
    this.searchBarForm.reset();
    this.getDoctorList();
  }

  getInsuranceList() {
    this.service.getInsuanceList().subscribe((res) => {
      let response = this.coreService.decryptObjectData(res);
      const arr = response?.body?.result;
      arr.unshift({ for_portal_user: { _id: '' }, company_name: 'Select Insurance Company' });
      arr.map((curentval: any) => {
        this.insuranceList.push({
          label: curentval?.company_name,
          value: curentval?.for_portal_user?._id,
        });
      });
      // this.insuranceList = response.body.result;

      if (this.searchParams["fd_insuranceAccept"]) {

        this.searchBarForm.patchValue({
          insuranceAccept: this.searchParams["fd_insuranceAccept"],
        })
      }


    });
  }
  getProvinceList() {
    this.superAdminService.getProvinceListByRegionId("").subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        // this.provinceList = response.body?.list;
        const arr = response?.body?.list;
        arr.unshift({ _id: '', name: 'Select Provinces' });
        arr.map((curentval: any) => {
          this.provinceList.push({
            label: curentval?.name,
            value: curentval?._id,
          });
        });

        if (this.searchParams["fd_province"]) {
          this.searchBarForm.patchValue({
            province: this.searchParams["fd_province"]
          })
        }
      }
    });
  }
  getDepartmentList() {
    this.superAdminService
      .getDepartmentListByProvinceId(this.provinceID || '')
      .subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          // this.departmentList = response.body?.list;
          const arr = response?.body?.list;
          this.departmentList = []
          arr.unshift({ _id: '', name: 'Select Department' });
          arr.map((curentval: any) => {
            this.departmentList.push({
              label: curentval?.name,
              value: curentval?._id,
            });
          });

          if (this.searchParams["fd_department"]) {
            this.searchBarForm.patchValue({
              department: this.searchParams["fd_department"],
            })
          }
        }
      });
  }
  getCitytList() {
    this.superAdminService
      .getCityListByDepartmentId(this.departmentID || '')
      .subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.cityList = []
          // this.cityList = response.body?.list;
          const arr = response?.body?.list;
          arr.unshift({ _id: '', name: 'Select City' });
          arr.map((curentval: any) => {
            this.cityList.push({
              label: curentval?.name,
              value: curentval?._id,
            });
          });

          if (this.searchParams["fd_city"]) {
            this.searchBarForm.patchValue({
              city: this.searchParams["fd_city"],
            })
          }
        }
      });
  }
  handleSelectProvince(event: any) {
    this.provinceID = event.value;
    this.getDepartmentList();
  }
  handleSelectDepartment(event: any) {
    this.departmentID = event.value;
    this.getCitytList();
  }
  handleSelectCity(event: any) {
    this.getDoctorList();
  }
  spokenLanguages: any[] = [];
  getSpokenLanguage() {
    this.service.spokenLanguage().subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      // this.spokenLanguages = response.body?.spokenLanguage;
      const arr = response?.body?.spokenLanguage;
      arr.unshift({ value: '', label: 'Select spoken language' });
      arr.map((curentval: any) => {
        this.spokenLanguages.push({
          label: curentval?.label,
          value: curentval?.value,
        });
      });
    });
  }

  clearAdvanceFilter() {
    // this.advanceSearchBarForm.reset();
  }

  locationRoute(data: any) {
    this.toastr.info("route");
    if (!this.loginUserID) {
      this.toastr.error("please login first ");
    } else {
      this.router.navigate([`patient/homepage/retaildoctordetail/`], {
        queryParams: data,
      });
    }
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  handletypeofAppBox(event: any, changeFor: any) {
    if (event.checked) {
      this.AppoinmentType.push(changeFor);
    } else {
      let result = this.AppoinmentType.filter((ele) => ele !== changeFor);
      this.AppoinmentType = result;
    }
    this.getDoctorList();

  }

  selectGender(event: any, changeFor: any) {
    if (event.checked) {
      this.doctorGender.push(changeFor);
    } else {
      let result = this.doctorGender.filter((ele) => ele !== changeFor);
      this.doctorGender = result;
    }

    this.currentPage = 1;
    this.getDoctorList("search");
  }


  handleroute(_id: any, date: any) {
    if (this.loginUserID) {
      let dateEncrypt = this.coreService.encryptObjectData(date)

      this.router.navigate([`/patient/homepage/retailappointmentdetail`], { queryParams: { appointment_type: 'ONLINE', doctor_id: _id, date: dateEncrypt } })
    } else {
      this.modalService.open(this.loginRequiredWarningModal, {
        centered: true,
        size: "lg",
        windowClass: "order_medicine",
      });
    }

  }
  hidesearch(controlName: string, event: Event)
  {
    event.stopPropagation();
    setTimeout(() => {
      const pacLogoDiv111 = document.querySelector('.pac-container.pac-logo') as HTMLElement;
      
      pacLogoDiv111.style.setProperty('display', 'none', 'important');
    }, 100);
  
  }
  clearSearch(controlName: string, event: Event) {
    event.stopPropagation();
    this.searchBarForm.get(controlName)?.setValue('');
    if (controlName == 'nearby') {
      this.searchBarForm.get('lat')?.setValue('');
      this.searchBarForm.get('lng')?.setValue('');
      const pacLogoDiv11 = document.querySelector('.pac-container.pac-logo') as HTMLElement;
      pacLogoDiv11.style.setProperty('display', 'none', 'important');
    }
  }

  clearAdvSearch(controlName: string, controlName2: string, event: Event) {
    event.stopPropagation();
    if (controlName) {
      this.advanceSearchBarForm.get(controlName)?.setValue('');
    }
    if (controlName2) {
      this.advanceSearchBarForm.get(controlName2)?.setValue('');
    }
  }
  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {

        this.searchBarForm.patchValue({
          nearby: "Autour de moi!",
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        });
        this.getDoctorList();
      });
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
  }

  getDirection(direction: any) {
    if (!direction)
    {
      this.toastr.error("Location coordinates not found")
      return 
    }
    const lat = direction[1];
    const lng = direction[0];
    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(mapUrl, "_blank");

  }
}
