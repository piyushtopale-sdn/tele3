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
import { Observable, of } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { CoreService } from "src/app/shared/core.service";
import { PharmacyService } from "src/app/modules/pharmacy/pharmacy.service";
import { IResponse } from "src/app/shared/classes/api-response";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { MatTableDataSource } from "@angular/material/table";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { filter } from "rxjs/operators";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { FourPortalService } from "src/app/modules/four-portal/four-portal.service";

const ELEMENT_DATA = [
  { name: "", prescribed: "", frequency: "", duration: "", action: "" },
];

@Component({
  selector: 'app-list-lab-dental-imaging-optical',
  templateUrl: './list-lab-dental-imaging-optical.component.html',
  styleUrls: ['./list-lab-dental-imaging-optical.component.scss']
})
export class ListLabDentalImagingOpticalComponent implements OnInit {
  myControl = new FormControl("");

  hospital_Name: any;
  route_type: string;
  eprescription_number: any;
  userDetails: any;
  selectedinfo: any;
  orderType: any = 'NA';
  staticFirstOption: {
    description: string; // Description you want to display
    place_id: string; // Unique identifier for the static option
    matched_substrings: any[]; // Empty array for the required property
    reference: string; // Empty string for the required property
    structured_formatting: { main_text: string; main_text_matched_substrings: any[]; secondary_text: string; }; // Empty object for the required property
    terms: any[]; // Empty array for the required property
    types: any[]; // Empty array for the required property
  };

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


  loginUserID: string = "";
  portalUserID: string = "";
  options: string[] = ["One", "Two", "Three"];
  simpleOptions: any;
  filteredOptions!: Observable<any[]>;
  list_data: any = [];
  listName: string = "";
  prescriptionSignedUrl: string = "";
  iDObject: any = {};
  nameObject: any = {};
  exludeMedicineAmount: any = {};
  newlistArray: any = {};
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
  prescription_urlData : any = [];
  prescription_key: Array<string> = [];
  requestType: any = "NA";
  appointment_type: any = 'NA'
  selectedTabOrder: number = 0;
  fileNamePrescription: string = "";
  selectedPdfUrl: SafeResourceUrl [] = [];
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
  portalGender: any[] = [];

  isLoading: boolean = false;
  scrolled: boolean = false;
  scrollDebounceInterval = null;
  SubscribersPatientList: any = [];

  isSubmitted: boolean = false;

  selectedPurmission: any[] = []

  @ViewChild("paymentcontent", { static: false })
  paymentcontent: any;
  @ViewChild("approved", { static: false }) approved: any;
  @ViewChild("requestcontent", { static: false })
  requestcontent: any;
  @ViewChild("requestpaymentcontent", { static: false })
  requestpaymentcontent: any;
  @ViewChild("requestapproved", { static: false }) requestapproved: any;
  @ViewChild("requestavailabilitycontent", { static: false })
  requestavailabilitycontent: any;
  @ViewChild("requestpaymentavailabilitycontent", { static: false })
  requestpaymentavailabilitycontent: any;
  @ViewChild("requestapprovedavailability", { static: false })
  requestapprovedavailability: any;
  @ViewChild("orderTab") orderTab: any;
  @ViewChild("nearby") nearby!: ElementRef;
  @ViewChild("loginRequiredWarningModal", { static: false }) loginRequiredWarningModal: any;
  noRecord: any = 0;
  mindate: Date = new Date();

  displayedColumns: string[] = [
    "name",
    "prescribed",
    // "delivered",
    "frequency",
    "duration",
    "action",
  ];

  imgOptDntlList: any = [];
  totalFourPortalRecords: any = 0;


  public orderListTest: FormGroup = new FormGroup({
    subscriber_id: new FormControl("", []),
    eprescription_no: new FormControl("", []),
    listtest_details: new FormArray(
      [
        new FormGroup({
          name: new FormControl("", []),
          frequency: new FormControl("", []),
          duration: new FormControl("", []),
          prescribed: new FormControl("", []),
          // delivered: new FormControl("", []),
          action: new FormControl("", []),
        }),
      ],
      []
    ),
  });

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
    private _IndiviualDoctorService: IndiviualDoctorService,
    private activatedRoute: ActivatedRoute,
    private fourPortalService: FourPortalService
  ) {
    this.searchBarForm = this.fb.group({
      portal_name: [""],
      nearby: [""],
      province: [""],
      department: [""],
      city: [""],
      neighborhood: [""],
      insuranceAccept: [""],
      onDutyPortal: [""],
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
      portalYearOfExperienceSort: [""],
      avalibility: [""],
      availabilityData: [""],
    });
    this.searchOnValueChange();
    let userData = this.coreService.getLocalStorage("loginData");
    if (userData) {
      this.loginUserID = userData._id;
    }
    this.formValueChanges();
  }
  autoComplete: google.maps.places.Autocomplete;
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

    const autocompleteService = new google.maps.places.AutocompleteService();

    const inputElement = this.nearby.nativeElement
    const otherElement = document.getElementById('otherElement'+this.route_type);
 
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

    this.autoComplete = new google.maps.places.Autocomplete(
      this.nearby.nativeElement,
      options
    );
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
  closeModal() {
    this.modalService.dismissAll();  
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.route_type = params.get('path');

      // Call other functions here
      let userData;
      this.imgOptDntlList = [];
      this.filteredOptions = of([]);
      if (this.coreService.getLocalStorage("profileData") && this.coreService.getLocalStorage("loginData")) {
        this.userDetails = this.coreService.getLocalStorage("profileData").full_name;
        userData = this.coreService.getLocalStorage("loginData");
        this.loginUserID = userData._id;
      }
      //this.getPortalList();

      this.getProvinceList();
      this.getParamsValue();
      this.getInsuranceList();
      this.getDepartmentList();
      this.getCitytList();
      this.getSpokenLanguage();
      this.onScroll();
    });
    this.dataSource = new MatTableDataSource(
      (this.orderListTest.get("listtest_details") as FormArray).controls
    );

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

            this.getPortalList();
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

    if (this.searchParams["onDutyPortal"] === "true") {
      this.searchBarForm.patchValue({
        onDutyPortal: true,
      });
    }
    if (this.searchParams["onDutyPortal"] === "false") {
      this.searchBarForm.patchValue({
        onDutyPortal: false,
      });
    }
    if (this.searchParams["openNow"] === "true") {
      this.searchBarForm.patchValue({
        openNow: true,
      });
    }
    if (this.searchParams["openNow"] === "false") {
      this.searchBarForm.patchValue({
        openNow: false,
      });
    }


    if (this.searchParams) {
     
      if(this.searchParams["openNow"] == "true") {
        this.searchBarForm.patchValue({
              openNow: true,
             });
      }
      else if(this.searchParams["openNow"] == "false"){
        this.searchBarForm.patchValue({
          openNow: false,
         });
      }

      if(this.searchParams["onDutyPortal"] == "true") {
        this.searchBarForm.patchValue({
          onDutyPortal: true,
             });
      }
      else if(this.searchParams["onDutyPortal"] == "false"){
        this.searchBarForm.patchValue({
          onDutyPortal: false,
         });
      }


      this.searchBarForm.patchValue({
        portal_name: this.searchParams["portal_name"],
        nearby: this.searchParams["nearby"],
        // province: this.searchParams["province"],
        // department: this.searchParams["department"],
        //city: this.searchParams["city"],
        //insuranceAccept: this.searchParams["insuranceAccept"],
        neighborhood: this.searchParams["neighborhood"],
        // openNow: this.searchParams["openNow"] == "true" ? true : false,
        // onDutyPortal: this.searchParams["onDutyPortal"] == "true" ? true : false,
        lng: this.searchParams["lng"],
        lat: this.searchParams["lat"],
      });
    }
  }

  getPortalList(type: any = "") {

    /* let data = {
      searchText: this.searchBarForm.value.portal_name
        ? this.searchBarForm.value.portal_name
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
      currentTimeStamp: new Date().toISOString()
    }; */

    //New Four Portals`
    let dataNew = {
      long: this.searchBarForm.value.lng ? this.searchBarForm.value.lng
        : "",
      lat: this.searchBarForm.value.lat ? this.searchBarForm.value.lat
        : "",
      searchText: this.searchBarForm.value.portal_name
        ? this.searchBarForm.value.portal_name
        : "",
      province: this.searchBarForm.value.province
        ? this.searchBarForm.value.province
        : "",
      department: this.searchBarForm.value.department
        ? this.searchBarForm.value.department
        : "",
      city: this.searchBarForm.value.city ? this.searchBarForm.value.city : "",
      neighborhood: this.searchBarForm.value.neighborhood
        ? this.searchBarForm.value.neighborhood
        : "",
      insuranceAccepted: this.searchBarForm.value.insuranceAccept
        ? this.searchBarForm.value.insuranceAccept
        : "",
      portalYearOfExperienceSort: this.advanceSearchBarForm.value
        .portalYearOfExperienceSort,
      portalGender: this.portalGender,
      spokenLanguage: this.advanceSearchBarForm.value.spokenLang,
      appointmentType: this.AppoinmentType,
      openNow: this.searchBarForm.value.openNow,
      onDutyPortal: this.searchBarForm.value.onDutyPortal,
      currentTimeStamp: new Date().toISOString(),
      portalAvailability:
        this.advanceSearchBarForm.value.availabilityData == ""
          ? this.advanceSearchBarForm.value.avalibility != ""
            ? this.advanceSearchBarForm.value.avalibility
            : ""
          : this.advanceSearchBarForm.value.availabilityData,
      ratingSort: this.advanceSearchBarForm.value.rating
        ? this.advanceSearchBarForm.value.rating
        : "",
      consultationFeeStart: 0,
      consultationFeeEnd: this.advanceSearchBarForm.value.silder,
      consultationFeeSort: this.advanceSearchBarForm.value.consultationFeeSort,
      type: this.route_type,
      limit: 2,
      page: this.currentPage,
      maxDistance: this.searchBarForm.value.sliderDistance
    }


    /*  this.fourPortalService.serachFilterForFourPortals(dataNew).subscribe((res:any)=>{
       this.imgOptDntlList = res.data.result[0].paginatedResults
     }) */

    // this.fourPortalService.serachFilterForFourPortals(dataNew).subscribe(
    //   (res) => {
    //     let response = this.coreService.decryptObjectData({ data: res });

    //     const result = response?.data?.result;

    //     this.totalFourPortalRecords = response?.data?.totalRecords;

    //     //this.doctor_list = JSON.parse(JSON.stringify(response?.data?.result));
    //     const formValues = Object.values(this.searchBarForm.value);
    //     const hasValue = formValues.some(value => !!value);

    //     const adformValues = Object.values(this.advanceSearchBarForm.value);
    //     let adhasValue = adformValues.some(value => !!value);
    //     if (this.portalGender.length > 0) {
    //       adhasValue = true;
    //     }


    //     if (hasValue || adhasValue) {
    //       this.noRecord = 0;
    //       if (type == "search") {
    //         this.imgOptDntlList = []
    //         this.currentPage = 1;


    //       }

    //       const uniqueResult = result.filter((newItem) => {
    //         const isDuplicate = this.imgOptDntlList.some(existingItem => {
    //           const isMatching = existingItem._id === newItem._id;
    //           if (isMatching) {
    //           }
    //           return isMatching;
    //         });
    //         return !isDuplicate;
    //       });

    //       // If the result is not empty, update the imgOptDntlList
    //       this.imgOptDntlList = [...this.imgOptDntlList, ...uniqueResult];

    //       this.isLoading = false;
    //     } else if (result.length === 0 && this.currentPage > 1) {
    //       this.toastr.error("No Any More List To Fetch!");
    //       this.isLoading = false;
    //       this.noRecord = 1;
    //       this.currentPage = 1;
    //     } else {
    //       const uniqueResult = result.filter((newItem) => {
    //         const isDuplicate = this.imgOptDntlList.some(existingItem => {
    //           const isMatching = existingItem._id === newItem._id;
    //           if (isMatching) {
    //           }
    //           return isMatching;
    //         });
    //         return !isDuplicate;
    //       });

    //       // If the result is not empty, update the imgOptDntlList and isLoading
    //       this.imgOptDntlList = [...this.imgOptDntlList, ...uniqueResult];

    //       this.isLoading = false;
    //       this.noRecord = 0;

    //     }

    //   },
    //   (err) => {
    //     let errorResponse = this.coreService.decryptObjectData({
    //       data: err.error,
    //     });
    //   }
    // );


    /*   this._IndiviualDoctorService.serachFilterdoctor(data).subscribe(
        (res) => {
          let response = this.coreService.decryptObjectData({ data: res });
  
          const result = response?.data.result;
          this.total_doctor = response?.data?.totalRecords
  
          //this.doctor_list = JSON.parse(JSON.stringify(response?.data?.result));
          const formValues = Object.values(this.searchBarForm.value);
          const hasValue = formValues.some(value => !!value);
  
          const adformValues = Object.values(this.advanceSearchBarForm.value);
          let adhasValue = adformValues.some(value => !!value);
          if(this.doctorGender.length>0){
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
  
        },
        (err) => {
          let errorResponse = this.coreService.decryptObjectData({
            data: err.error,
          });
        }
      ); */
  }

  handleRouting(index: any, _id: any) {
    sessionStorage.setItem("tabIndex", index);
    this.router.navigate([`/patient/homepage/details/${this.route_type}/${_id}`]);
  }


  searchOnValueChange() {
    this.searchBarForm.valueChanges.subscribe((val) => {

      const hasNonUndefinedValue = Object.values(val).some(value => value !== undefined && value !== '');
      if (hasNonUndefinedValue) {
        this.currentPage = 1;
        this.getPortalList("search");
      } else {
        this.currentPage = 1;
        this.imgOptDntlList = [];
        this.getPortalList();
      }
    });
  }

  formValueChanges() {
    this.advanceSearchBarForm.valueChanges.subscribe((selectedValue) => {
      this.currentPage = 1;
      this.getPortalList("search");

    });
  }

  public handleBtnClick() {
    localStorage.setItem("status","true")
    this.modalService.dismissAll();
    this.router.navigate(["/patient/login"]);
  }
  createOppintment(data: any,) {

    if (data.appointment_type === undefined) {
      this.coreService.showError("", 'Please select an Appointment For before booking.');
      return;
    }

    if (!this.loginUserID) {
      this.modalService.open(this.loginRequiredWarningModal, {
        centered: true,
        size: "lg",
        windowClass: "order_medicine",
      });
      // this.toastr.error("please login first ");
    } else {
      this.router.navigate(["/patient/homepage/portal-book-appointment"], {
        queryParams: data,
      });
      
    }
  }

  public updateMySelection(option: any, i: any) {
    this.iDObject[i] = option._id;
    this.nameObject[i] = option.test_name;
  }

  public clearText() {
    this.listName = "";
  }

  handleClearFilter() {
    this.searchBarForm.reset();
    this.getPortalList();
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
      
      if(this.searchParams["insuranceAccept"]){
  
            this.searchBarForm.patchValue({
              insuranceAccept: this.searchParams["insuranceAccept"],
            })
             } 
      
      // this.insuranceList = response.body.result;
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

         if(this.searchParams["province"]){
          this.searchBarForm.patchValue({
            province: this.searchParams["province"],
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

          if(this.searchParams["department"]){
            this.searchBarForm.patchValue({
              department: this.searchParams["department"],
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
          if(this.searchParams["city"]){
            this.searchBarForm.patchValue({
              city: this.searchParams["city"],
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
    this.getPortalList();
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
    this.getPortalList();

  }

  selectGender(event: any, changeFor: any) {
    if (event.checked) {
      this.portalGender.push(changeFor);
    } else {
      let result = this.portalGender.filter((ele) => ele !== changeFor);
      this.portalGender = result;
    }

    this.currentPage = 1;
    this.getPortalList("search");
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



  /*********************************** Order flow **************************************/
  openCommentPopup(labtestcontent: any, testId: any, portal_type: any) {

    if (portal_type === "Paramedical-Professions") {
      this.labOpenPopup(testId, labtestcontent);
    } else if (portal_type === "Dental") {
      this.Others_Openpopup(testId, labtestcontent)
    } else if (portal_type === "Optical") {
      this.eyeglasses_Openpopup(testId, labtestcontent)
    } else if (portal_type === "Laboratory-Imaging") {
      this.imaging_Openpopup(testId, labtestcontent)
    }


  }

  /* *********Info PopUp API's********* */

  labOpenPopup(testId: any, labtestcontent: any) {
    let reqData = {
      labTestId: [testId],
    };

    this.patientService.getLabTestId(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      this.selectedinfo = response?.data[0];

      this.modalService.open(labtestcontent, {
        centered: true,

        size: "lg",

        windowClass: "claim_successfully medicine-modal-list",
      });
    });
  }

  Others_Openpopup(testId: any, labtestcontent: any) {
    let reqData = {
      othersId: [testId],
    };

    this.patientService.getOthersTestId(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      this.selectedinfo = response?.data[0];

      this.modalService.open(labtestcontent, {
        centered: true,

        size: "lg",

        windowClass: "claim_successfully medicine-modal-list",
      });
    });
  }

  imaging_Openpopup(testId: any, labtestcontent: any) {
    let reqData = {
      imagingId: [testId],
    };

    this.patientService.getImagingTestId(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      this.selectedinfo = response?.data[0];

      this.modalService.open(labtestcontent, {
        centered: true,

        size: "lg",

        windowClass: "claim_successfully medicine-modal-list",
      });
    });
  }

  eyeglasses_Openpopup(testId: any, labtestcontent: any) {
    let reqData = {
      eyeglasesId: [testId],
    };

    this.patientService.getEyeglassesTestId(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      this.selectedinfo = response?.data[0];

      this.modalService.open(labtestcontent, {
        centered: true,

        size: "lg",

        windowClass: "claim_successfully medicine-modal-list",
      });
    });
  }



  public handleChange(target: any, index: any, portal_type: any): void {

    this.listName = '';
    if (target.value) {
      this.listName = target.value;
    } else {
      // this.newlistArray = [];
      // this.iDObject = {};
    }
    if (portal_type === "Paramedical-Professions") {
      this.lab_List(this.listName);
    } else if (portal_type === "Dental") {
      this.Others_List(this.listName)
    } else if (portal_type === "Optical") {
      this.eyeglasses_List(this.listName)
    } else if (portal_type === "Laboratory-Imaging") {
      this.Imaging_List(this.listName)
    }
  }

  /* ****************Test API's******************* */

  lab_List(query) {
    let param = {
      query: query,
    };
    this.patientService.getLabListDataWithoutPagination(param).subscribe(
      (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        const listArray = []

        for (const lab of result.body.labtestArray
        ) {
          listArray.push({
            test_name: lab.lab_test,
            _id: lab._id,
          });
        }
        this.list_data = listArray;

        this.filteredOptions = this.myControl.valueChanges.pipe(
          startWith(""),
          map((value) => this._filter(value || ""))

        );

      },
      (err: ErrorEvent) => {
        console.log(err.message, "error");
      }
    );
  }

  Imaging_List(query) {
    let param = {
      query: query,
    };
    this.patientService.getIamgingListDataWithoutPagination(param).subscribe(
      (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        const listArray = []

        for (const img of result.body.imagingArray

        ) {
          listArray.push({
            test_name: img.imaging,
            _id: img._id,
          });
        }
        this.list_data = listArray;

        this.filteredOptions = this.myControl.valueChanges.pipe(
          startWith(""),
          map((value) => this._filter(value || ""))

        );

      },
      (err: ErrorEvent) => {
        console.log(err.message, "error");
      }
    );
  }


  Others_List(query) {
    let param = {
      query: query,
    };
    this.patientService.getOthersListDataWithoutPagination(param).subscribe(
      (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        const listArray = []

        for (const other of result.body.othersTestArray

        ) {
          listArray.push({
            test_name: other.others,
            _id: other._id,
          });
        }
        this.list_data = listArray;

        this.filteredOptions = this.myControl.valueChanges.pipe(
          startWith(""),
          map((value) => this._filter(value || ""))

        );

      },
      (err: ErrorEvent) => {
        console.log(err.message, "error");
      }
    );
  }


  eyeglasses_List(query) {
    let param = {
      query: query,
    };
    this.patientService.getEyeglassesListDataWithoutPagination(param).subscribe(
      (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        const listArray = []

        for (const eye of result.body.eyeTestArray

        ) {
          listArray.push({
            test_name: eye.eyeglass_name,
            _id: eye._id,
          });
        }
        this.list_data = listArray;

        this.filteredOptions = this.myControl.valueChanges.pipe(
          startWith(""),
          map((value) => this._filter(value || ""))

        );

      },
      (err: ErrorEvent) => {
        console.log(err.message, "error");
      }
    );
  }

  SubscribersList() {
    let param = {
      patientId: this.loginUserID
    }
    this.patientService.SubscribersList(param).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        this.SubscribersPatientList = result?.data?.all_subscriber_ids
      },
      error: (err) => {
        console.log(err)
      }
    })


  }

  tabChangedOrderMedicine(tabChangeEvent: MatTabChangeEvent): void {
    this.selectedTabOrder = tabChangeEvent.index;
  }

  onFileSelected($event, type: "prescription") {
    const files: File[] = $event.target.files;

    const formData: any = new FormData();
    formData.append("portal_user_id", this.loginUserID);
    formData.append("portalType", this.route_type);
    formData.append(
      "docType",
      (type + "/" + sessionStorage.getItem("portal-user-id")) as string
    );
    if (files.length > 1) {
      formData.append("multiple", "true");
    } else {
      formData.append("multiple", "false");
    }
    let imageUrlArray = [];
    let pdfurlArray = []
    for (const file of files) {

      formData.append("documents", file);
   

      if (file.type === 'application/pdf') {
        const pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          window.URL.createObjectURL(file)
        );

        pdfurlArray.push(pdfUrl);
        this.fileNamePrescription = file.name;
        this.selectedPdfUrl = pdfurlArray

      }
      else{
        const imgUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          window.URL.createObjectURL(file)
        );
        imageUrlArray.push(imgUrl);
        this.fileNamePrescription = file.name;
        this.prescription_url = imageUrlArray;
      }
    }

    if (type === "prescription") {
      this.prescription_doc = formData;
      for (let [key, value] of formData) {

      }
    }
  }
  

  removeImageFromPrescriptionArray(index: any): void {
    const updatedArray = [];
    for (const key in this.prescription_url) {
      if (index != key) {
        updatedArray.push(this.prescription_url[key]);
      }
    }
    this.prescription_url = updatedArray;
  }

  handleEprescription(event: any) {
    this.eprescription_number = event.target.value
  }

  private getOrderField(...field: string[]) {

    return this.orderListTest.get(field).value;
  }


  //Start medicine filter
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    if (this.list_data.length > 0) {
      var result = this.list_data.filter((option: any) => {

        return option?.test_name.toLowerCase().includes(filterValue);
      });
      return result != "" ? result : ["No data"];
    }
    return ["No data"];
  }
  //Add new medcine for the superadmin
  public handleAddClick(idx: any) {
    this.newlistArray[idx] = this.listName;
    this.nameObject[idx] = this.listName;
    this.list_data.push({ test_name: this.listName });
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(""),
      map((value) => this._filter(value || ""))
    );

  }

  get medicineData(): FormArray {
    return this.orderListTest.get("listtest_details") as FormArray;
  }

  addNewLabtest() {
    const newRow: FormGroup = new FormGroup({
      name: new FormControl("", []),
      frequency: new FormControl("", []),
      duration: new FormControl("", []),
      prescribed: new FormControl("", []),
      // delivered: new FormControl("", []),
      action: new FormControl("", []),
    });
    (this.orderListTest.get("listtest_details") as FormArray).push(newRow);
    this.dataSource = new MatTableDataSource(
      (this.orderListTest.get("listtest_details") as FormArray).controls
    );
  }

  removeLabtest(index: number) {
    (this.orderListTest.get("listtest_details") as FormArray).removeAt(index);
    this.dataSource = new MatTableDataSource(
      (this.orderListTest.get("listtest_details") as FormArray).controls
    );
  }

  resetModalService() {
    this.selectedTabOrder = 0;
    this.prescription_doc = null;
    this.prescription_url = [];
    this.prescription_key = [];
    this.requestType = "NA";
    this.selectedTabOrder = 0;
    this.fileNamePrescription = "";
    this.orderListTest = new FormGroup({
      subscriber_id: new FormControl("", [Validators.required]),
      eprescription_no: new FormControl("", []),
      listtest_details: new FormArray(
        [
          new FormGroup({
            name: new FormControl("", []),
            frequency: new FormControl("", []),
            duration: new FormControl("", []),
            prescribed: new FormControl("", []),
            // delivered: new FormControl("", []),
            action: new FormControl("", []),
          }),
        ],
        []
      ),
    });
    this.dataSource = new MatTableDataSource(
      (this.orderListTest.get("listtest_details") as FormArray).controls
    );
  }

  closeAllModal() {
    this.modalService.dismissAll();
    this.selectedPdfUrl = []
    this.resetModalService();

  }

  openVerticallyCenteredordermedicine(
    ordercontent: any, for_portal_user: any, orderType:any

  ) {   
    
    if (orderType === undefined) {
      this.coreService.showError("", 'Please select an Order For before booking.');
      return;
    }

    if (this.loginUserID == '') {
      this.modalService.open(this.loginRequiredWarningModal, {
        centered: true,
        size: "lg",
        windowClass: "order_medicine",
      });
      return;
    }
    this.portalUserID = for_portal_user;
    this.orderType = orderType,
    this.modalService.open(ordercontent, {
      centered: true,
      size: "lg",
      windowClass: "order_medicine",
    });
    this.SubscribersList();
  }


  getSubscriberDetails(loginModal: any) {

    if (this.getOrderField("subscriber_id") == '') {

      this.openVerticallyCenteredpaymentmedicine(
        this.paymentcontent
      );
    } else {
      this.uploadFilePrescription(loginModal);
    }
  }

  //  Payment Medicine modal
  openVerticallyCenteredpaymentmedicine(paymentcontent: any) {
    this.modalService.open(paymentcontent, {
      centered: true,
      size: "md",
      windowClass: "payment_medicine",
    });
  }

  uploadFilePrescription(loginModal: any) {
    
    if (this.selectedTabOrder === 0) {
      this.uploadDocument(this.prescription_doc, loginModal);
    } else {
      this.createNewOrder();
    }
  }

  uploadDocument(doc: any = new FormData(), loginModal: any) {
    if (!this.loginUserID) {
      this.modalService.open(loginModal, {
        centered: true,
        size: "md",
        windowClass: "payment_medicine",
      });
      return;
    }
    for (let [key, value] of doc) {

    }
    this.fourPortalService.uploadFileForPortal(doc).subscribe({
      next: (result) => {
        let encryptedData = { data: result };
        let result1 = this.coreService.decryptObjectData(encryptedData);

        const prescriptionIDArray = [];
        for (const data of result1.data) {
          prescriptionIDArray.push(data._id);
        }
        this.prescription_urlData = prescriptionIDArray;


        this.coreService.showSuccess("", "File Uploaded Successful");
        this.createNewOrder();

      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this.coreService.showError("", err.message);
        // }
      },
    });
  }

  /* *************************added new test api's************************** */
  private addlabForSuperadmin() {
    return new Promise((resolve, reject) => {

      const labTestArray = [];
      for (const name of Object.values(this.newlistArray)) {
        labTestArray.push({

          category: "",
          lab_test: name,
          description: "",
          contributing_factors_to_abnormal_values:
            "",
          normal_value: {
            blood: "",
            urine: "",
          },
          possible_interpretation_of_abnormal_blood_value: {
            high_levels: "",
            low_levels: "",
          },
          possible_interpretation_of_abnormal_urine_value: {
            high_levels: "",
            low_levels: "",
          },
          blood_procedure: {
            before: "",
            during: "",
            after: "",
          },
          urine_procedure: {
            before: "",
            during: "",
            after: "",
          },

          clinical_warning: "",
          other: "",
          link: "",
          active: false,

        });
      }
      if (labTestArray.length > 0) {
        let added_by = {
          user_id: this.loginUserID,
          user_type: this.route_type,
        };

        let reqData = {
          labTestArray: labTestArray,
          added_by: added_by,
        };

        this.superAdminService.labAddTest(reqData).subscribe((res: any) => {
          let response = this.coreService.decryptObjectData({ data: res });

          if (response.status) {
            for (const lab of response.data) {

              let index = this.coreService.getKeyByValue(
                this.newlistArray,
                lab.lab_test
              );

              this.iDObject[index] = lab._id;
            }
            resolve(true);
          } else {
            // this.toastr.error("Somthing went wrong while adding medicine");
            resolve(false);
          }
        });
      }
    });
  }

  private addimagingForSuperadmin() {
    return new Promise((resolve, reject) => {

      const ImagingTestArray = [];
      for (const name of Object.values(this.newlistArray)) {
        ImagingTestArray.push({
          imaging: name,
          category: "",
          description: "",
          clinical_consideration: "",
          normal_values: "",
          abnormal_values: "",
          contributing_factors_to_abnormal: "",
          procedure: {
            before: "",
            during: "",
            after: "",
          },
          clinical_warning: "",
          contraindications: "",
          other: "",
          link: "",
          active: false,
        });
      }
      if (ImagingTestArray.length > 0) {
        let added_by = {
          user_id: this.loginUserID,
          user_type: this.route_type,
        };

        let reqData = {
          ImagingTestArray: ImagingTestArray,
          added_by: added_by,
        };

        this.superAdminService.addImagingApi(reqData).subscribe((res: any) => {
          let response = this.coreService.decryptObjectData({ data: res });

          if (response.status) {
            for (const img of response.data) {

              let index = this.coreService.getKeyByValue(
                this.newlistArray,
                img.imaging
              );

              this.iDObject[index] = img._id;
            }
            resolve(true);
          } else {
            // this.toastr.error("Somthing went wrong while adding medicine");
            resolve(false);
          }
        });
      }
    });
  }

  private adddentalForSuperadmin() {
    return new Promise((resolve, reject) => {

      const OthersTestArray = [];
      for (const name of Object.values(this.newlistArray)) {
        OthersTestArray.push({

          category: "",
          others: name,
          description: "",
          clinical_consideration: "",
          normal_values: "",
          abnormal_values: "",
          contributing_factors_to_abnormal: "",
          procedure: {
            before: "",
            during: "",
            after: "",
          },
          clinical_warning: "",
          contraindications: "",
          other: "",
          link: "",
          active: false,

        });
      }
      if (OthersTestArray.length > 0) {
        let added_by = {
          user_id: this.loginUserID,
          user_type: this.route_type,
        };

        let reqData = {
          OthersTestArray: OthersTestArray,
          added_by: added_by,
        };

        this.superAdminService.addOthersApi(reqData).subscribe((res: any) => {
          let response = this.coreService.decryptObjectData({ data: res });

          if (response.status) {
            for (const img of response.data) {

              let index = this.coreService.getKeyByValue(
                this.newlistArray,
                img.imaging
              );

              this.iDObject[index] = img._id;
            }
            resolve(true);
          } else {
            // this.toastr.error("Somthing went wrong while adding medicine");
            resolve(false);
          }
        });
      }
    });
  }
  private addOpticalForSuperadmin() {
    return new Promise((resolve, reject) => {

      const eyeglassData = [];
      for (const name of Object.values(this.newlistArray)) {
        eyeglassData.push({
          eyeglass_name: name,
          status: false,
        });
      }
      if (eyeglassData.length > 0) {
        let added_by = {
          user_id: this.loginUserID,
          user_type: this.route_type,
        };

        let reqData = {
          eyeglassData: eyeglassData,
          added_by: added_by,
        };

        this.superAdminService.addEyeglassessApi(reqData).subscribe((res: any) => {
          let response = this.coreService.decryptObjectData({ data: res });

          if (response.status) {
            for (const img of response.data) {

              let index = this.coreService.getKeyByValue(
                this.newlistArray,
                img.imaging
              );

              this.iDObject[index] = img._id;
            }
            resolve(true);
          } else {
            // this.toastr.error("Somthing went wrong while adding medicine");
            resolve(false);
          }
        });
      }
    });
  }

  async createNewOrder() {
    if (this.selectedTabOrder === 2) {
      if (Object.values(this.newlistArray).length > 0) {
        if (this.route_type === "Paramedical-Professions") {
          const addlab = await this.addlabForSuperadmin();
        } else if (this.route_type === "Dental") {
          const addlab = await this.adddentalForSuperadmin();
        } else if (this.route_type === "Optical") {
          const addeye = await this.addOpticalForSuperadmin();
        } else if (this.route_type === "Laboratory-Imaging") {
          const addimg = await this.addimagingForSuperadmin();
        }
      }
      // this.isSubmitted = true
      if (Object.values(this.iDObject).length <= 0) {
        this.coreService.showError("", "Please add at least one medicine");
        return;
      }
    }
    var for_portal_userdata = [];
    if (this.selectedPurmission.length == 0) {
      for_portal_userdata = [this.portalUserID];
    }
    else {
      for (const foruserid of this.selectedPurmission) {
        for_portal_userdata.push(foruserid);
      }
    }

    let action = ''
    if (this.selectedTabOrder === 1) {
      action = 'eprecription'
    }

    let orderRequest = {
      for_portal_user: for_portal_userdata,
      prescription_url: this.prescription_urlData,
      eprescription_number: this.eprescription_number,
      action,
      request_type: this.orderType,
      subscriber_id: (this.getOrderField("subscriber_id") == "") ? null : this.getOrderField("subscriber_id"),
      patient_details: {
        user_id: this.loginUserID,
        order_confirmation: false,
        user_name: this.coreService.getLocalStorage("profileData").full_name
          ? this.coreService.getLocalStorage("profileData").full_name
          : "test_p Patient",
      },
      from_user: {
        user_id: this.loginUserID,
        user_name: this.coreService.getLocalStorage("profileData").full_name
          ? this.coreService.getLocalStorage("profileData").full_name
          : "test_p Patient",
      },
      test_list: [],
      portal_type: this.route_type
    };
    if (this.selectedTabOrder === 2) {
      orderRequest.test_list = this.getOrderField("listtest_details").map(
        (data, index) => (


          {
            name: this.nameObject[index],
            test_id: this.iDObject[index],
            quantity_data: {
              prescribed: data.prescribed,
              // delivered: data.prescribed,

            },
            frequency: data.frequency,
            duration: data.duration,
          }
        )
      );
    }

    this.patientService.newLabOrder(orderRequest).subscribe({
      next: (res) => {
        let result = this.coreService.decryptContext(res);
        if (result.status) {
          this.coreService.showSuccess("", "New Order placed successfully");
          this.openVerticallyCenteredapproved(this.approved);
        } else {
          this.coreService.showError("", result.message);
        }

      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);

      },
    });
  }

  //  Approved modal
  openVerticallyCenteredapproved(approved: any) {
    this.modalService.open(approved, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
    });
  }
  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
           
        this.searchBarForm.patchValue({
          nearby: "Autour de moi!",
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        });
      this.getPortalList();
      });
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
  }
  getDirection(direction : any) {
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


   // Function to render predictions
   renderPredictions(predictions: google.maps.places.AutocompletePrediction[]) {
    // Render predictions in your UI, e.g., dropdown menu

    this.clearDropdown();

    const pacLogoDiv = document.querySelector('.pac-container.pac-logo');

    if (pacLogoDiv) {
      // Render the static option before the pac-container pac-logo div
      const staticOptionElement = document.createElement('div');
      staticOptionElement.className = 'pac-item around1'; // add a custom class for styling
  
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

  hidesearch(controlName: string, event: Event)
  {
    event.stopPropagation();
    setTimeout(() => {
      const pacLogoDiv111 = document.querySelector('.pac-container.pac-logo') as HTMLElement;
      
      pacLogoDiv111.style.setProperty('display', 'none', 'important');
    }, 1000);
  
  }


  clearPdfUrl(index : number) {  
    this.selectedPdfUrl.splice(index, 1); 
  }


  checkedsubMenuArray(id: any) {
    var checkIndex
    this.selectedPurmission.forEach((element: any, index: any) => {
      if (element == id) {
        checkIndex = true
      }
    })
    return checkIndex
  }

  removesubmenu(id: any, event: any) {
    if (event.checked) {
      this.selectedPurmission.push(id)
    } else {
      if (this.selectedPurmission.length > 0) {
        let index = this.selectedPurmission.indexOf(id)
        if (index != -1) {
          this.selectedPurmission.splice(index, 1)
        }
      }
    }

  }

  handelSlelectAll(data: any) {
    if (data) {
      this.imgOptDntlList.forEach((element: any, index: any) => {
        if (element?.medicine_request?.prescription_order || element?.medicine_request?.homevmedicine_price_requestsit || element?.medicine_request?.request_medicine_available) {
          this.selectedPurmission.push(element._id)
        }
      })      
    } else {
      this.selectedPurmission = []
    }
  }
}
