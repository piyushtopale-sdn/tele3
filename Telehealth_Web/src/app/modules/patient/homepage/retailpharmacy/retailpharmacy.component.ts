import { PatientService } from "src/app/modules/patient/patient.service";
import { SuperAdminService } from "./../../../super-admin/super-admin.service";
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
import { Observable, fromEvent } from "rxjs";
import { debounceTime, map, startWith } from "rxjs/operators";
import { CoreService } from "src/app/shared/core.service";
import { PharmacyService } from "src/app/modules/pharmacy/pharmacy.service";
import { IResponse } from "src/app/shared/classes/api-response";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { MatTableDataSource } from "@angular/material/table";
import {
  IDocMetaDataRequest,
  IDocMetaDataResponse,
  INewOrderRequest,
  INewOrderResponse,
  ISubscriberData,
  IUniqueId,
  RequestOrderType,
} from "./retailpharmacy.type";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { filter } from "rxjs/operators";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";

const ELEMENT_DATA = [
  { name: "", prescribed: "", frequency: "", duration: "", action: "" },
];

@Component({
  selector: "app-retailpharmacy",
  templateUrl: "./retailpharmacy.component.html",
  styleUrls: ["./retailpharmacy.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class RetailpharmacyComponent implements OnInit {
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

    if (value >= 0.1) {
      return Math.round(value) + "KM";
    }

    return `${value}`;
  }

  myControl = new FormControl("");
  loginUserID: string = "";
  portalUserID: string = "";
  SubscribersPatientList: any = [];
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
  displayedColumns: string[] = [
    "name",
    "prescribed",
    // "delivered",
    "frequency",
    "duration",
    "action",
  ];
  // dataSource = ELEMENT_DATA;
  dataSource: MatTableDataSource<AbstractControl>;
  prescription_doc: FormData = null;
  prescription_url: any = [];
  prescription_key: Array<string> = [];
  requestType: RequestOrderType = "NA";
  selectedTabOrder: number = 0;
  fileNamePrescription: string = "";
  invitation_id: any;

  searchParams: any;
  pharmacy_list: any[] = [];
  searchBarForm: any = FormGroup;
  advanceSearchBarForm: any = FormGroup;
  selectedPdfUrl: SafeResourceUrl [] = [];

  provinceList: any[] = [];
  departmentList: any[] = [];
  cityList: any[] = [];
  provinceID: any = "";
  departmentID: any = "";
  insuranceList: any[] = [];
  selected: any = true;
  selfpharmacy: any = [];
  eprescription_number: any;
  currentPage: any = 1;
  scrollDebounceInterval = null;
  overlay: false;
  isSubmitted: boolean = false;
  i: number = 0;
  noRecord: any = 0;
  public orderMedicine: FormGroup = new FormGroup({
    subscriber_id: new FormControl("", []),
    eprescription_no: new FormControl("", []),
    medicine_details: new FormArray(
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
  // public medicineData: FormArray = this.orderMedicine.get(
  //   "medicine_details"
  // ) as FormArray;
  @ViewChild("medicinepaymentcontent", { static: false })
  medicinepaymentcontent: any;
  @ViewChild("approved", { static: false }) approved: any;
  @ViewChild("loginRequiredInviteModal", { static: false }) loginRequiredInviteModal: any;
  @ViewChild("loginRequiredWarningModal", { static: false }) loginRequiredWarningModal: any;
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
  selectedmedicineinfo: any;
  pharmacyData: any;
  isLoading: boolean = false;
  scrolled: boolean = false;
  userDetails: any;
  totalRecords: any = 0;



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
    private toastr: ToastrService
  ) {
    this.searchBarForm = this.fb.group({
      pharmacy_name: [""],
      nearby: [""],
      province: [""],
      department: [""],
      city: [""],
      neighborhood: [""],
      insuranceAccept: [""],
      onDutyPharmacy: [""],
      openNow: [""],
      lng: [""],
      lat: [""],
      slider: [5]
    });

    this.advanceSearchBarForm = this.fb.group({
      rating: [""],
      medicinesOrder: [""],
      medicinePrice: [""],
      medicineAvailability: [""],
      partner: [""],
      spokenLang: [""],
    });

    // this.getMedicineList();
    this.searchOnValueChange();

    this.formValueChanges();

  }

  autoComplete: google.maps.places.Autocomplete;
  loc: any = {};
  ngAfterViewInit() {

    var element = document.querySelector('.pac-container.pac-logo');

    if (element) {
    
        element.remove();
    } else {
        console.log('Element not found.');
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
    const otherElement = document.getElementById('otherElementpharmacy');
 
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

  private getMedicineList(query) {
    let param = {
      query: query,
    };
    this.patientService.getmedicineList(param).subscribe(
      (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        const medicineArray = []

        for (const medicine of result.body.medicneArray) {
          medicineArray.push({
            medicine_name: medicine.medicine_name,
            medicine_id: medicine._id,
          });
        }
        this.medicineList = medicineArray;
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
  handleAddNewMedicine() {

  }
  private getOrderField(...field: string[]) {

    return this.orderMedicine.get(field).value;
  }

  get medicineData(): FormArray {
    return this.orderMedicine.get("medicine_details") as FormArray;
  }

  handleEprescription(event: any) {
    this.eprescription_number = event.target.value
  }

  openInvitationModal(sendInvitation: any, data: any) {
    if (this.loginUserID) {
      // this.invitation_id = id;
      this.patientService.updatePharmacyData(data);
      this.modalService.open(sendInvitation, { centered: true, size: "lg" });
    } else {
      this.modalService.open(this.loginRequiredInviteModal, {
        centered: true,
        size: "lg",
        windowClass: "order_medicine",
      });
      // this.toastr.error("Please login to send invitation!!");

    }

  }

  closePopup() {
    // this.newInvitationForm.reset();
    this.modalService.dismissAll("close");
  }

  newInvitation() {
    this.patientService.getPharmacyData().subscribe(data => {
      // The data will be available here when the observable emits a new value
      this.pharmacyData = data;
    });

    let formData = {
      created_By: this.loginUserID,
      first_name: this.pharmacyData.pharmacy_name,
      middle_name: "",
      last_name: "",
      email: this.pharmacyData.email,
      phone: this.pharmacyData.phone_number,
      // email: "vikasgupta+19@smartdatainc.net",
      // phone: "9898989898",
      address: this.pharmacyData.address,
      portalmessage: "This is portal is very usefull to do claims and manage the orders.",
      portalname: "pharmacy"
    }
    this.patientService
      .inviteUser(formData)
      .subscribe((res: any) => {
        let result = this.coreService.decryptObjectData({ data: res });
        if (result.status) {
          this.toastr.success(result.message);
          this.closePopup();
        } else {
          this.toastr.error(result.message);
        }
      });
  }


  addNewMedicine() {
    const newRow: FormGroup = new FormGroup({
      name: new FormControl("", []),
      frequency: new FormControl("", []),
      duration: new FormControl("", []),
      prescribed: new FormControl("", []),
      // delivered: new FormControl("", []),
      action: new FormControl("", []),
    });
    (this.orderMedicine.get("medicine_details") as FormArray).push(newRow);
    this.dataSource = new MatTableDataSource(
      (this.orderMedicine.get("medicine_details") as FormArray).controls
    );
  }

  removemedicine(index: number) {
    (this.orderMedicine.get("medicine_details") as FormArray).removeAt(index);
    this.dataSource = new MatTableDataSource(
      (this.orderMedicine.get("medicine_details") as FormArray).controls
    );
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  ngOnInit() {
    let userData;

    if (this.coreService.getLocalStorage("profileData") && this.coreService.getLocalStorage("loginData")) {
      this.userDetails = this.coreService.getLocalStorage("profileData").full_name;
      userData = this.coreService.getLocalStorage("loginData");
      this.loginUserID = userData._id;
    }


    //Start medicine filter
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(""),
      map((value) => this._filter(value || ""))
    );
    //end medicine filter

    this.dataSource = new MatTableDataSource(
      (this.orderMedicine.get("medicine_details") as FormArray).controls
    );
    this.dataSource.filterPredicate = (data: FormGroup, filter: string) => {
      return Object.values(data.controls).some((x) => x.value == filter);
    };

    this.getParamsValue();
    this.getInsuranceList();
    //this.getPharmacyList();
    this.getProvinceList();
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

            this.getPharmacyList();
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

    // if (this.searchParams["onDutyPharmacy"] === "true") {
    //   this.searchBarForm.patchValue({
    //     onDutyPharmacy: true,
    //   });
    // }
    // if (this.searchParams["onDutyPharmacy"] === "false") {
    //   this.searchBarForm.patchValue({
    //     onDutyPharmacy: false,
    //   });
    // }
    // if (this.searchParams["openNow"] === "true") {
    //   this.searchBarForm.patchValue({
    //     openNow: true,
    //   });
    // }
    // if (this.searchParams["openNow"] === "false") {
    //   this.searchBarForm.patchValue({
    //     openNow: false,
    //   });
    // }
    if (Object.keys(this.searchParams).length != 0) {

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

      if(this.searchParams["onDutyDoctor"] == "true") {
        this.searchBarForm.patchValue({
          onDutyDoctor: true,
             });
      }
      else if(this.searchParams["onDutyDoctor"] == "false"){
        this.searchBarForm.patchValue({
          onDutyDoctor: false,
         });
      }

      this.searchBarForm.patchValue({
        pharmacy_name: this.searchParams["pharmacy_name"],
        nearby: this.searchParams["nearby"],
        // province: this.searchParams["province"],
        // department: this.searchParams["department"],
        // city: this.searchParams["city"],
        //insuranceAccept: this.searchParams["insuranceAccept"],
        neighborhood: this.searchParams["neighborhood"],
        // openNow: this.searchParams["openNow"] == "true" ? true : false,
        // onDutyDoctor: this.searchParams["onDutyPharmacy"] == "true" ? true : false,
        lng: this.searchParams["lng"],
        lat: this.searchParams["lat"],
      });
    }
  }

  getPharmacyList(type: any = "") {

    let reqData = {
      pharmacy_name: this.searchBarForm.value.pharmacy_name,
      city: this.searchBarForm.value.city,
      province: this.searchBarForm.value.province,
      department: this.searchBarForm.value.department,
      neighborhood: this.searchBarForm.value.neighborhood,
      onDutyStatus: this.searchBarForm.value.onDutyPharmacy,
      // openingHoursStatus: this.searchBarForm.value.onDutyPharmacy,
      openingHoursStatus: this.searchBarForm.value.openNow,
      long: this.searchBarForm.value.lng,
      lat: this.searchBarForm.value.lat,
      limit: 4,
      page: this.currentPage,
      rating: this.advanceSearchBarForm.value.rating,
      medicinesOrder: this.advanceSearchBarForm.value.medicinesOrder,
      medicinePrice: this.advanceSearchBarForm.value.medicinePrice,
      medicineAvailability:
        this.advanceSearchBarForm.value.medicineAvailability,
      spokenLang: this.advanceSearchBarForm.value.spokenLang,
      partner: this.advanceSearchBarForm.value.partner,
      insuranceAccpted: this.searchBarForm.value.insuranceAccept,
      currentTimeStamp: new Date().toISOString(),
      maxDistance:this.searchBarForm.value.slider
    };


    this.pharmacyService.listPharmacy(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        //this.pharmacy_list = response?.data.result;

        const result = response?.data.result;
        this.totalRecords = response?.data?.totalResult

        const formValues = Object.values(this.searchBarForm.value);
        const hasValue = formValues.some(value => !!value);

        const adformValues = Object.values(this.advanceSearchBarForm.value);
        let adhasValue = adformValues.some(value => !!value);


        if (hasValue || adhasValue) {
          this.noRecord = 0;
          if (type == "search") {
            this.pharmacy_list = []

            this.currentPage = 1;
          }

          const uniqueResult = result.filter((newItem) => {
            const isDuplicate = this.pharmacy_list.some(existingItem => {
              const isMatching = existingItem._id === newItem._id;
              if (isMatching) {
              }
              return isMatching;
            });
            return !isDuplicate;
          });

          // If the result is not empty, update the pharmacy_list and isLoading
          this.pharmacy_list = [...this.pharmacy_list, ...uniqueResult];

          this.isLoading = false;
        } else if (result.length === 0 && this.currentPage > 1) {
          this.toastr.error("No Any More List To Fetch!");
          this.isLoading = false;
          this.noRecord = 1;
          this.currentPage = 1;
        } else {
          const uniqueResult = result.filter((newItem) => {
            const isDuplicate = this.pharmacy_list.some(existingItem => {
              const isMatching = existingItem._id === newItem._id;
              if (isMatching) {
              }
              return isMatching;
            });
            return !isDuplicate;
          });

          // If the result is not empty, update the pharmacy_list and isLoading
          this.pharmacy_list = [...this.pharmacy_list, ...uniqueResult];

          this.isLoading = false;
          this.noRecord = 0;

        }
      },
      (err) => {
        let errorResponse = this.coreService.decryptObjectData({
          data: err.error,

        });
        this.isLoading = false;

      }
    );
  }

  searchOnValueChange() {
    this.searchBarForm.valueChanges.subscribe((val) => {

      const hasNonUndefinedValue = Object.values(val).some(value => value !== undefined && value !== '');
      if (hasNonUndefinedValue) {
        this.currentPage = 1;
        this.getPharmacyList("search");
      } else {
        this.currentPage = 1;
        this.pharmacy_list = [];
        this.getPharmacyList();
      }

    });
  }

  public tabChangedOrderMedicine(tabChangeEvent: MatTabChangeEvent): void {
    this.selectedTabOrder = tabChangeEvent.index;
  }

  //  ORDER MEDICINE MODAL FLOW
  //  Order Medicine modal
  openVerticallyCenteredordermedicine(
    ordermedicinecontent: any,
    for_portal_user: string = ''
  ) {
    if (this.loginUserID == '') {
      this.modalService.open(this.loginRequiredWarningModal, {
        centered: true,
        size: "lg",
        windowClass: "order_medicine",
      });
      return;
    }
    this.portalUserID = for_portal_user;
    this.modalService.open(ordermedicinecontent, {
      centered: true,
      size: "lg",
      windowClass: "order_medicine",
    });
    this.SubscribersList();
  }
  //  Payment Medicine modal
  openVerticallyCenteredpaymentmedicine(medicinepaymentcontent: any) {
    this.modalService.open(medicinepaymentcontent, {
      centered: true,
      size: "md",
      windowClass: "payment_medicine",
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

  //  REQUEST MEDICINE MODAL FLOW
  //  request Medicine modal
  openVerticallyCenteredrequestmedicine(requestmedicinecontent: any) {
    this.modalService.open(requestmedicinecontent, {
      centered: true,
      size: "lg",
      windowClass: "order_medicine",
    });
  }
  //  request Payment Medicine modal
  openVerticallyCenteredrequestpaymentmedicine(
    requestmedicinepaymentcontent: any
  ) {
    this.modalService.open(requestmedicinepaymentcontent, {
      centered: true,
      size: "md",
      windowClass: "payment_medicine",
    });
  }
  //  Approved modal
  openVerticallyCenteredrequestapproved(requestapproved: any) {
    this.modalService.open(requestapproved, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
    });
  }

  //  REQUEST MEDICINE AVAILABILITY MODAL FLOW
  //  request Medicine availability modal
  openVerticallyCenteredrequestmedicineavailability(
    requestmedicineavailabilitycontent: any
  ) {
    this.modalService.open(requestmedicineavailabilitycontent, {
      centered: true,
      size: "lg",
      windowClass: "order_medicine",
    });
  }
  //  request Payment Medicine modal
  openVerticallyCenteredrequestpaymentavailability(
    requestmedicinepaymentavailabilitycontent: any
  ) {
    this.modalService.open(requestmedicinepaymentavailabilitycontent, {
      centered: true,
      size: "md",
      windowClass: "payment_medicine",
    });
  }
  //  Approved modal
  openVerticallyCenteredrequestapprovedavailability(
    requestapprovedavailability: any
  ) {
    this.modalService.open(requestapprovedavailability, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
    });
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

  removeImageFromPrescriptionArray(index: any): void {
    const updatedArray = [];
    for (const key in this.prescription_url) {
      if (index != key) {
        updatedArray.push(this.prescription_url[key]);
      }
    }
    this.prescription_url = updatedArray;
  }

  onFileSelected($event, type: "prescription") {
    const files: File[] = $event.target.files;
    const formData: any = new FormData();
    formData.append("userId", this.loginUserID);
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
      formData.append("docName", file);
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

  public handleBtnClick() {
    localStorage.setItem("status","true")
    this.modalService.dismissAll();
    this.router.navigate(["/patient/login"]);
  }

  private uploadDocument(doc: FormData, loginModal: any) {
    if (!this.loginUserID) {
      this.modalService.open(loginModal, {
        centered: true,
        size: "md",
        windowClass: "payment_medicine",
      });
      return;
    }
    this.pharmacyService.uploadDocument(doc).subscribe({
      next: (result: IResponse<any>) => {
        let encryptedData = { data: result };
        let result1 = this.coreService.decryptObjectData(encryptedData);

        this.coreService.showSuccess("", "File Uploaded Successful");
        this.saveMetadata(result1.data);
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this.coreService.showError("", err.message);
        // }
      },
    });
  }

  //Start medicine filter
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    if (this.medicineList.length > 0) {
      var result = this.medicineList.filter((option: any) => {
        return option.medicine_name.toLowerCase().includes(filterValue);
      });
      return result != "" ? result : ["No data"];
    }
    return ["No data"];
  }
  // End medicine filter

  public updateMySelection(option: any, i: any) {

    this.medicineIDObject[i] = option.medicine_id;
    this.medicineNameObject[i] = option.medicine_name;
  }
  //Add new medcine for the superadmin
  public handleAddMedicineClick(idx: any) {
    this.newMedicineArray[idx] = this.medicineName;
    this.medicineNameObject[idx] = this.medicineName;
    this.medicineList.push({ medicine_name: this.medicineName });
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(""),
      map((value) => this._filter(value || ""))
    );
  }

  public clearText() {
    this.medicineName = "";
  }

  openCommentPopup(medicinecontent: any, medicineId: any) {

    let reqData = {
      medicineIds: [medicineId],
    };

    this.superAdminService.getMedicinesById(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      this.selectedmedicineinfo = response?.body[0]?.medicine; //get medicine by id response

      this.modalService.open(medicinecontent, {
        centered: true,

        size: "lg",

        windowClass: "claim_successfully medicine-modal-list",
      });
    });

  }
  public handleMedicineChange(target: any, index: any): void {
    this.medicineName = '';
    if (target.value) {
      this.medicineName = target.value;
    } else {
      // this.newMedicineArray = [];
      // this.medicineIDObject = {};
    }
    this.getMedicineList(this.medicineName);
  }

  closeAllModal() {
    this.modalService.dismissAll();
    this.resetModalService();
  }

  saveMetadata(data: any) {
    const documentMetaDataArray = [];
    if (this.selectedPurmission.length > 0) {
      for (const metadata of data) {
        for (const for_portal_userid of this.selectedPurmission) {
          documentMetaDataArray.push({
            name: metadata.Key.split("/")[4],
            code: "prescription",
            e_tag: metadata.ETag,
            issued_date: new Date().toISOString(),
            expiry_date: null,
            url: metadata.Key,
            is_deleted: false,
            uploaded_by: this.loginUserID,
            for_portal_user: for_portal_userid,
          });
        }

      }
    }
    else {
      for (const metadata of data) {

        documentMetaDataArray.push({
          name: metadata.Key.split("/")[4],
          code: "prescription",
          e_tag: metadata.ETag,
          issued_date: new Date().toISOString(),
          expiry_date: null,
          url: metadata.Key,
          is_deleted: false,
          uploaded_by: this.loginUserID,
          for_portal_user: this.portalUserID,
        });


      }
    }

    this.patientService.saveMetadata(documentMetaDataArray).subscribe({
      next: (result: IResponse<IDocMetaDataResponse[]>) => {
        let encryptedData = { data: result };
        let result1 = this.coreService.decryptObjectData(encryptedData);
        const prescriptionIDArray = [];
        for (const data of result1.body) {
          prescriptionIDArray.push(data._id);
        }
        this.prescription_key = prescriptionIDArray;
        this.createNewOrder();
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
      },
    });
  }

  private addMedicineForSuperadmin() {
    return new Promise((resolve, reject) => {
      const medicineArray = [];
      for (const medicine of Object.values(this.newMedicineArray)) {
        medicineArray.push({
          medicine: {
            number: "",
            medicine_name: medicine,
            inn: "",
            dosage: "",
            pharmaceutical_formulation: "",
            administration_route: "",
            therapeutic_class: "",
            manufacturer: "",
            condition_of_prescription: "",
            other: "",
            link: "",
            status: false,
          },
        });
      }
      if (medicineArray.length > 0) {
        const reqData = {
          medicines: medicineArray,
          isNew: true,
          userId: this.portalUserID,
        };
        this.superAdminService.addMedicine(reqData).subscribe((res: any) => {
          let response = this.coreService.decryptObjectData({ data: res });

          if (response.status) {
            for (const med of response.body.result) {

              let index = this.coreService.getKeyByValue(
                this.newMedicineArray,
                med.medicine.medicine_name
              );

              this.medicineIDObject[index] = med._id;
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
      if (Object.values(this.newMedicineArray).length > 0) {
        const addmed = await this.addMedicineForSuperadmin();
      }

      if (Object.values(this.medicineIDObject).length <= 0) {
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

    let orderRequest: INewOrderRequest = {
      for_portal_user: for_portal_userdata,
      prescription_url: this.prescription_key,
      eprescription_number: this.eprescription_number,
      action,
      request_type: this.requestType,
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
      medicine_list: [],
      orderBy: {
        user_id: "",
        user_name: ""
      }
      // orderFor :'Pharmacy'
    };
    if (this.selectedTabOrder === 2) {
      orderRequest.medicine_list = this.getOrderField("medicine_details").map(
        (data, index) => (


          {
            name: this.medicineNameObject[index],
            medicine_id: this.medicineIDObject[index],
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

    this.patientService.newOrder(orderRequest).subscribe({
      next: (res: IResponse<INewOrderResponse>) => {
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
        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this.coreService.showError("", err.message);
        // }
      },
    });
  }

  uploadFilePrescription(loginModal: any) {
    if (this.selectedTabOrder === 0) {
      this.uploadDocument(this.prescription_doc, loginModal);
    } else {
      this.createNewOrder();
    }
  }
  SubscribersList() {
    let param = {

      patientId: this.loginUserID
      // patientId: "63d0f8213c4b44b6397794ff"
    }
    this.patientService.SubscribersList(param).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        this.SubscribersPatientList = result?.data?.all_subscriber_ids

        // for (let data of result?.data?.all_subscriber_ids) {
        //   if(data?.subscription_for=="Primary"){
        //     this.patinetSubcriberID=data.subscriber_id
        //   }
        // }
      },
      error: (err) => {
        console.log(err)
      }
    })


  }

  patchDropdownVlaue() {
    this.orderMedicine.patchValue({
      subscriber_id: "sbgcf",

    });
  }

  getSubscriberDetails(loginModal: any) {

    if (this.getOrderField("subscriber_id") == '') {
      this.openVerticallyCenteredpaymentmedicine(
        this.medicinepaymentcontent
      );
      // this.uploadFilePrescription(loginModal);
    } else {
      this.uploadFilePrescription(loginModal);
    }
  }

  resetModalService() {
    this.selectedTabOrder = 0;
    this.prescription_doc = null;
    this.prescription_url = [];
    this.prescription_key = [];
    this.requestType = "NA";
    this.selectedTabOrder = 0;
    this.fileNamePrescription = "";
    this.orderMedicine = new FormGroup({
      subscriber_id: new FormControl("", [Validators.required]),
      eprescription_no: new FormControl("", []),
      medicine_details: new FormArray(
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
      (this.orderMedicine.get("medicine_details") as FormArray).controls
    );
  }

  getInsuranceList() {
    this.patientService.getInsuanceList().subscribe((res) => {
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
    this.getPharmacyList();
  }

  handleSelectDepartment(event: any) {
    this.departmentID = event.value;
    this.getCitytList();
    this.getPharmacyList();
  }

  handleSelectCity(event: any) {
    this.getPharmacyList();
  }
  checkid(id) {
    var index = this.selfpharmacy.indexOf(id);
    if (index != -1) {
      return true;
    }
    return false;
  }
  handleClearFilter() {
    this.searchBarForm.reset()
    this.advanceSearchBarForm.reset()
    this.getPharmacyList();

  }
  spokenLanguages: any[] = [];
  getSpokenLanguage() {
    this.patientService.spokenLanguage().subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      this.spokenLanguages = response.body?.spokenLanguage;
    });
  }

  handleChangeCheckBox(event: any, changeFor: any) {
    if (changeFor === "order") {
      this.advanceSearchBarForm.patchValue({
        medicinesOrder: event.checked,
      });
    }
    if (changeFor === "price") {
      this.advanceSearchBarForm.patchValue({
        medicinePrice: event.checked,
      });
    }
    if (changeFor === "availability") {
      this.advanceSearchBarForm.patchValue({
        medicineAvailability: event.checked,
      });
    }
  }
  selectedPurmission: any[] = []
  handelSlelectAll(data: any) {
    if (data) {
      this.pharmacy_list.forEach((element: any, index: any) => {
        if (element.createdBy == 'self') {
          this.selectedPurmission.push(element._id)
        }

      })
    } else {
      this.selectedPurmission = []

    }
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
  formValueChanges() {
    this.advanceSearchBarForm.valueChanges.subscribe((selectedValue) => {
      this.currentPage = 1;
      this.getPharmacyList("search");
    });
  }

  clearAdvanceFilter() {
    this.advanceSearchBarForm.reset();
    this.getPharmacyList();
  }
  checkStatus(isOnDuty) {
    if (isOnDuty.includes(true)) {
      return true;
    } else {
      return false;
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
  clearAdvSearch(controlName: string, event: Event) {
    event.stopPropagation();
    this.advanceSearchBarForm.get(controlName)?.setValue('');
  }
  getDirection(direction:any ) {
    if (direction.length == 0)
    {
      this.toastr.error("Location coordinates not found")
      return 
    }
    const[coordinates] = direction
    const lat = coordinates[1];
    const lng = coordinates[0];
    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(mapUrl, "_blank");  
  
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {           
        this.searchBarForm.patchValue({
          nearby: "Autour de moi!",
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        });
      this.getPharmacyList();
      });
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
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

  hidesearch(controlName: string, event: Event)
  {
    event.stopPropagation();
    setTimeout(() => {
      const pacLogoDiv111 = document.querySelector('.pac-container.pac-logo') as HTMLElement;
      
      pacLogoDiv111.style.setProperty('display', 'none', 'important');
    }, 100);
  
  }


  clearPdfUrl(index : number) {
    
    this.selectedPdfUrl.splice(index, 1); 
  }
}