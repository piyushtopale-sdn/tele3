import { IndiviualDoctorService } from "../../../individual-doctor/indiviual-doctor.service";
import { CoreService } from "src/app/shared/core.service";
import { ActivatedRoute } from "@angular/router";
import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { FourPortalService } from "src/app/modules/four-portal/four-portal.service";
import { PatientService } from "../../patient.service";
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { MatTableDataSource } from "@angular/material/table";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { NgxUiLoaderService } from "ngx-ui-loader";

@Component({
  selector: 'app-lab-img-dental-opt-details',
  templateUrl: './lab-img-dental-opt-details.component.html',
  styleUrls: ['./lab-img-dental-opt-details.component.scss']
})
export class LabImgDentalOptDetailsComponent implements OnInit {
  myControl = new FormControl("");

  dataSource: MatTableDataSource<AbstractControl>;
  filteredOptions!: Observable<any[]>;

  currentRate = 1;
  loginuser_id: any = "";
  portal_id: any = "";
  portaldetailsData: any = {};
  doctor_availability: any[] = [];
  hospital_location: any[] = [];
  location_id: any = "";
  appointment_type = "";
  doctorRating_Reviwe: any[] = [];
  ratingCount: any = {};
  getAverage: any = {};
  comment: any = "";
  rating: any;
  notAvalible: any = 1;
  doctorAvailableTimeSlot: any[] = [];
  dateForSlot: any = new Date();
  weekDaySlot: any;
  doctor_rating: any;
  reletedDoctorList: any[] = [];
  doctorId: any = "";
  selectedIndex: number = 0;
  selectedPdfUrl: SafeResourceUrl [] = [];
  pathologyTests: any = [];
  updatedPathologyTests: any = [];
  prescription_urlData : any = [];

  portalId: any = '';
  route_type: any = '';

  SubscribersPatientList: any = [];
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
  
  displayedColumns: string[] = [
    "name",
    "prescribed",
    "delivered",
    "frequency",
    "duration",
    "action",
  ];

  prescription_doc: FormData = null;
  prescription_url: any = [];
  prescription_key: Array<string> = [];
  requestType: any = "NA";
  selectedTabOrder: number = 0;
  fileNamePrescription: string = "";
  newlistArray: any = {};

  iDObject: any = {};
  nameObject: any = {};
  exludeMedicineAmount: any = {};
  selectedPurmission: any[] = []
  eprescription_number: any;
  list_data: any = [];
  listName: string = "";
  @ViewChild("loginRequiredWarningModal", { static: false }) loginRequiredWarningModal: any;
  @ViewChild("loginRequiredWarningModalRating", { static: false }) loginRequiredWarningModalRating: any;

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
          delivered: new FormControl("", []),
          action: new FormControl("", []),
        }),
      ],
      []
    ),
  });
  selectedinfo: any;
  userDetails: any;

  constructor(
    private _IndiviualDoctorService: IndiviualDoctorService,
    private _CoreService: CoreService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private fourPortalService: FourPortalService,
    private patientService : PatientService,
    private superAdminService: SuperAdminService,
    private sanitizer: DomSanitizer,
    private loader: NgxUiLoaderService

  ) {
    const userData = this._CoreService.getLocalStorage("loginData");
    this.loginuser_id = userData?._id;
    if(userData){
      this.userDetails = this._CoreService.getLocalStorage("profileData").full_name;
    }
  }

  notlogin() {
    this.toastr.error("please login first ");
  }

  ngOnInit(): void {

    this.activatedRoute.paramMap.subscribe(params => {
      this.route_type = params.get('path');
    });

    window.scroll({
      top: 0,
    });

    this.portal_id = this.activatedRoute.snapshot.paramMap.get("id");

    this.portalDetails();

    let tabIndex = parseInt(sessionStorage.getItem("tabIndex"));
    this.selectedIndex = tabIndex;

    this.dataSource = new MatTableDataSource(
      (this.orderListTest.get("listtest_details") as FormArray).controls
    );

  }

  handelReviweRating(data: any) {
    if (data.comment) {
      this.comment = data.comment.target.value;
    }
  }

  accepted_insurance_company: any[] = [];
  portalDetails() {
    let param = { portal_id: this.portal_id };

    this.fourPortalService.fourPortalDetails(param).subscribe({
      next: (res) => {
        let result = this._CoreService.decryptObjectData({ data: res });

        this.pathologyTests = result.body.pathology_tests;

        const groupedTests = {};

        this.pathologyTests.forEach(test => {
          if (!groupedTests[test.typeOfTest]) {
            groupedTests[test.typeOfTest] = [];
          }
          groupedTests[test.typeOfTest].push(test.nameOfTest);
        });

        this.updatedPathologyTests = Object.keys(groupedTests).map(typeOfTest => {
          return {
            typeOfTest,
            nameOfTests: groupedTests[typeOfTest]
          };
        });

        this.doctorId = result?.body?.data?.portal_id;
        this.portalId = result?.body?.data?.portal_id;

        this.accepted_insurance_company =
          result?.body?.accepted_insurance_company;

        this.portaldetailsData = result?.body?.data;

        this.doctor_availability = result.body?.data?.in_availability;
        //this.doctor_availability = result.body?.data?.hospital_location;

        this.hospital_location = result?.body?.data?.hospital_location;

        this.appointment_type =
          result?.body?.data?.in_availability[0]?.appointment_type;
        this.location_id = result.body?.data?.in_availability[0]?.location_id;

         this.doctor_rating = result.body?.doctor_rating;
        this.getPortalRaviweandRating();
        this.portalAvailableSlot();
        this.weekdaybyloaction(this.location_id, this.appointment_type);
         this.relatedDoctorsList();
      },
      error: (err) => {
        console.log(err, "error______");
      },
    })

    /* this._IndiviualDoctorService.doctorDetails(param).subscribe({
      next: (res) => {
        let result = this._CoreService.decryptObjectData({ data: res });

        this.pathologyTests = result.body.pathology_tests;

        const groupedTests = {};

        this.pathologyTests.forEach(test => {
          if (!groupedTests[test.typeOfTest]) {
            groupedTests[test.typeOfTest] = [];
          }
          groupedTests[test.typeOfTest].push(test.nameOfTest);
        });

        this.updatedPathologyTests = Object.keys(groupedTests).map(typeOfTest => {
          return {
            typeOfTest,
            nameOfTests: groupedTests[typeOfTest]
          };
        });


        this.doctorId = result?.body?.data?.portal_id;
        this.accepted_insurance_company =
          result?.body?.accepted_insurance_company;

        this.doctordetailsData = result?.body?.data;
        this.doctor_availability = result.body?.data?.in_availability;
        //this.doctor_availability = result.body?.data?.hospital_location;

        this.hospital_location = result?.body?.data?.hospital_location;

        this.appointment_type =
          result?.body?.data?.in_availability[0]?.appointment_type;
        this.location_id = result.body?.data?.in_availability[0]?.location_id;
        this.doctor_rating = result.body?.doctor_rating;
        this.getDoctorRaviweandRating();
        this.doctorAvailableSlot();
        this.weekdaybyloaction(this.location_id, this.appointment_type);
        this.relatedDoctorsList();

      },
      error: (err) => {
        console.log(err);
      },
    }); */
  }
  weekdaybyloaction(_id: any, type: string) {

    // Filter the doctor_availability array based on _id and type
    let weekday = this.doctor_availability.filter(
      (ele) => {
        const matchCondition = ele.location_id === _id && ele.appointment_type === type;
        if (matchCondition) {
        }
        return matchCondition;
      }
    );

    // Access the first matching element's week_days array
    this.weekDaySlot = weekday[0]?.week_days[0];
  }

  typeSelect(type: any) {

    this.appointment_type = type.type;

    this.weekdaybyloaction(this.location_id, this.appointment_type);
  }
  public onSelection(data: any) {
    if (data.date) {
      this.dateForSlot = new Date(data.date).toISOString();
    } else if (data.type) {
      this.appointment_type = data.type;
    } else {
      this.location_id = data.locationid;
    }

    this.portalAvailableSlot();
  }
  createOppintment(data: any) {
    if (this.appointment_type === "NA") {
      this._CoreService.showError("", 'Please select an Appointment For before booking.');
      return;
    }
    if (!this.loginuser_id) {
      this.modalService.open(this.loginRequiredWarningModal, {
        centered: true,
        size: "lg",
        windowClass: "order_medicine",
      });
      // this.toastr.error("please login first ");
    } else {
      this.router.navigate(["/patient/homepage/portal-book-appointment"], {        
        queryParams: {appointment_type: data.appointment_type,
          portal_id:data.portal_id,portal_type: this.route_type}

      });
    }
  }
  // reviwe and rating get and post
  getPortalRaviweandRating() {
    let param = {
      // portal_user_id: this.doctor_availability[0]?.for_portal_user,
      portal_user_id: this.portal_id,
      page: 1,
      limit: 10,
      reviewBy: 'patient'
    };

    this.fourPortalService.getPortalReviweAndRating(param).subscribe({
      next: (res) => {
        let result = this._CoreService.decryptObjectData({ data: res });
        // this.doctorRating_Reviwe = result?.body?.ratingArray
        this.ratingCount = result?.body?.ratingCount;
        this.getAverage = parseFloat(
          result?.body?.getAverage?.average_rating
        ).toFixed(1);
        let data = [];
        for (let reviwe of result?.body?.ratingArray) {
          data.push({
            rating: reviwe.rating,
            comment: reviwe.comment,
            patientName: reviwe.patientName,
            date: this._CoreService.createDate(new Date(reviwe.createdAt))
              ? this._CoreService.createDate(new Date(reviwe.createdAt))
              : "NA",
            firsttlatterofname: this.getShortName(
              reviwe.patientName ? reviwe.patientName : "shivam"
            ),
          });
        }
        this.doctorRating_Reviwe = data;

      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  getShortName(fullName: any) {

    return fullName?.full_name
      .split(" ")
      .map((n) => n[0])
      .join("");
  }
  //  Review modal
  openVerticallyCenteredreview(reviewcontent: any) {
    this.modalService.open(reviewcontent, {
      centered: true,
      size: "md",
      windowClass: "review",
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
  postRatingAndReviwe() {
    const userData = this._CoreService.getLocalStorage("loginData");
    if (!userData) {
      this.modalService.open(this.loginRequiredWarningModalRating, {
        centered: true,
        size: "lg",
        windowClass: "order_medicine",
      });
      // this._CoreService.showError("Please login first", " ")
      return
    }
    this.loader.start();
    let pararm = {
      for_portal_user: this.portal_id,
      patient_login_id: this.loginuser_id,
      rating: this.currentRate,
      comment: this.comment,
      reviewBy: 'patient',
      reviewTo: this.route_type,
      portal_type: this.route_type
    };

    this.fourPortalService.fourPortalReviweandRating(pararm).subscribe({
      next: (res) => {
        let result = this._CoreService.decryptObjectData({ data: res });
        if(result .status == true){
          this.loader.stop();
          this.toastr.success(result.message);
          this.getPortalRaviweandRating();
          this.closePopup();
        }else{
          this.loader.stop();
        }
      },

      error: (err) => {
        this.loader.stop();
        console.log(err);
      },
    });
  }
  closePopup() {
    this.loader.stop();
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.selectedPdfUrl = [];
  }
  portalAvailableSlot() {
    let param = {
      locationId: this.location_id,
      appointmentType: this.appointment_type,
      timeStamp: this.dateForSlot,
      portal_id: this.portal_id,
      portal_type: this.route_type
    };


    // let param = { "locationId": "63d3cb116ef0c91c772e4627", "appointmentType": "ONLINE", "timeStamp": "2023-02-17T10:00:00.000Z", "doctorId": "63e0bc33f15a27adc67cc733" }
    this.fourPortalService.portalAvailableSlot(param).subscribe({
      next: (res) => {
        let result = this._CoreService.decryptObjectData({ data: res });
        this.doctorAvailableTimeSlot = result.body.allGeneralSlot;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  relatedDoctorsList() {
    let param = {
      speciality: this.portaldetailsData?.speciality_id,
      limit: 3,
    };

    this._IndiviualDoctorService.relatedDoctorsForFourPortals(param).subscribe({
      next: (res) => {
        let result = this._CoreService.decryptObjectData({ data: res });
        this.reletedDoctorList = result.data.result;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  adjustRatingStar(rating) {
    let roundedNum = Math.floor(rating);
    return roundedNum;
  }
  public handleBtnClick() {
    localStorage.setItem("status","true")
    this.modalService.dismissAll();
    this.router.navigate(["/patient/login"]);
  }

  redirectRetaildoctordetail(_id: any) {
    const url = `/patient/homepage/retaildoctordetail/${_id}`;
    window.location.href = url;
  }

  formatTime(time) {
    // Check if time is defined and has four digits
    if (time && /^\d{4}$/.test(time)) {
      const hours = parseInt(time.substring(0, 2), 10);
      const minutes = time.substring(2);

      if (hours >= 0 && hours <= 11) {
        // Convert to 12-hour format with AM
        const period = "AM";
        const formattedMinutes = minutes || "00";
        return `${hours}:${formattedMinutes} ${period}`;
      } else if (hours >= 12 && hours <= 23) {
        // Convert to 12-hour format with PM
        const formattedHours = hours === 12 ? 12 : hours - 12;
        const period = "PM";
        const formattedMinutes = minutes || "00";
        return `${formattedHours}:${formattedMinutes} ${period}`;
      }
    }

    return time; // Return the original time if it doesn't match the expected format
  }



  /*****************************ORDER-FLOW*****************************************/

  isButtonDisabled(): boolean {
    const invalidAppointmentTypes = ["order_request", "price_request", "availability_request"];
    return invalidAppointmentTypes.includes(this.appointment_type);
  }

  isButtonDisabled2(): boolean {
    const invalidOrderTypes = ["ONLINE", "HOME_VISIT", "FACE_TO_FACE"];
    return invalidOrderTypes.includes(this.appointment_type);
  }
    

  openVerticallyCenteredordermedicine(
    ordercontent: any, for_portal_user: any

  ) {      
    
    if (this.appointment_type === "order_request" || this.appointment_type === "price_request" || this.appointment_type === "availability_request") {
     
      if (this.loginuser_id == '') {
        this.modalService.open(this.loginRequiredWarningModal, {
          centered: true,
          size: "lg",
          windowClass: "order_medicine",
        });
        return;
      }
      this.portal_id = for_portal_user;
      this.modalService.open(ordercontent, {
        centered: true,
        size: "lg",
        windowClass: "order_medicine",
      });
      this.SubscribersList();
    }


  }

  public updateMySelection(option: any, i: any) {
    this.iDObject[i] = option._id;
    this.nameObject[i] = option.test_name;
  }
  
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
      let response = this._CoreService.decryptObjectData({ data: res });

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
      let response = this._CoreService.decryptObjectData({ data: res });

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
      let response = this._CoreService.decryptObjectData({ data: res });

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
      let response = this._CoreService.decryptObjectData({ data: res });

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
        let result = this._CoreService.decryptObjectData({ data: res });
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
        let result = this._CoreService.decryptObjectData({ data: res });
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
        let result = this._CoreService.decryptObjectData({ data: res });
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
        let result = this._CoreService.decryptObjectData({ data: res });
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
      patientId: this.loginuser_id
    }
    this.patientService.SubscribersList(param).subscribe({
      next: (res) => {
        let result = this._CoreService.decryptObjectData({ data: res });
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
    formData.append("portal_user_id", this.loginuser_id);
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
    let pdfurlArray = [];
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
      delivered: new FormControl("", []),
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
            delivered: new FormControl("", []),
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
    this.resetModalService();
    this.selectedPdfUrl = []
  }

  // openVerticallyCenteredordermedicine(
  //   ordercontent: any, for_portal_user: any, orderType:any

  // ) {   
    
  //   if (orderType === undefined) {
  //     this._CoreService.showError("", 'Please select an Order For before booking.');
  //     return;
  //   }

  //   if (this.loginuser_id == '') {
  //     this.modalService.open(this.loginRequiredWarningModal, {
  //       centered: true,
  //       size: "lg",
  //       windowClass: "order_medicine",
  //     });
  //     return;
  //   }
  //   this.portalId = for_portal_user;
  //   this.appointment_type = orderType,
  //   this.modalService.open(ordercontent, {
  //     centered: true,
  //     size: "lg",
  //     windowClass: "order_medicine",
  //   });
  //   this.SubscribersList();
  // }


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
    if (!this.loginuser_id) {
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
        let result1 = this._CoreService.decryptObjectData(encryptedData);

        const prescriptionIDArray = [];
        for (const data of result1.data) {
          prescriptionIDArray.push(data._id);
        }
        this.prescription_urlData = prescriptionIDArray;


        this._CoreService.showSuccess("", "File Uploaded Successful");
        this.createNewOrder();

      },
      error: (err: ErrorEvent) => {
        this._CoreService.showError("", err.message);
        // if (err.message === "INTERNAL_SERVER_ERROR") {
        //   this._CoreService.showError("", err.message);
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
          user_id: this.loginuser_id,
          user_type: this.route_type,
        };

        let reqData = {
          labTestArray: labTestArray,
          added_by: added_by,
        };

        this.superAdminService.labAddTest(reqData).subscribe((res: any) => {
          let response = this._CoreService.decryptObjectData({ data: res });

          if (response.status) {
            for (const lab of response.data) {

              let index = this._CoreService.getKeyByValue(
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
          user_id: this.loginuser_id,
          user_type: this.route_type,
        };

        let reqData = {
          ImagingTestArray: ImagingTestArray,
          added_by: added_by,
        };

        this.superAdminService.addImagingApi(reqData).subscribe((res: any) => {
          let response = this._CoreService.decryptObjectData({ data: res });

          if (response.status) {
            for (const img of response.data) {

              let index = this._CoreService.getKeyByValue(
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
          user_id: this.loginuser_id,
          user_type: this.route_type,
        };

        let reqData = {
          OthersTestArray: OthersTestArray,
          added_by: added_by,
        };

        this.superAdminService.addOthersApi(reqData).subscribe((res: any) => {
          let response = this._CoreService.decryptObjectData({ data: res });

          if (response.status) {
            for (const img of response.data) {

              let index = this._CoreService.getKeyByValue(
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
          user_id: this.loginuser_id,
          user_type: this.route_type,
        };

        let reqData = {
          eyeglassData: eyeglassData,
          added_by: added_by,
        };

        this.superAdminService.addEyeglassessApi(reqData).subscribe((res: any) => {
          let response = this._CoreService.decryptObjectData({ data: res });

          if (response.status) {
            for (const img of response.data) {

              let index = this._CoreService.getKeyByValue(
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
        this._CoreService.showError("", "Please add at least one medicine");
        return;
      }
    }
    var for_portal_userdata = [];
    if (this.selectedPurmission.length == 0) {
      for_portal_userdata = [this.portalId];
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
      request_type: this.appointment_type,
      subscriber_id: (this.getOrderField("subscriber_id") == "") ? null : this.getOrderField("subscriber_id"),
      patient_details: {
        user_id: this.loginuser_id,
        order_confirmation: false,
        user_name: this._CoreService.getLocalStorage("profileData").full_name
          ? this._CoreService.getLocalStorage("profileData").full_name
          : "test_p Patient",
      },
      from_user: {
        user_id: this.loginuser_id,
        user_name: this._CoreService.getLocalStorage("profileData").full_name
          ? this._CoreService.getLocalStorage("profileData").full_name
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
              delivered: data.prescribed,

            },
            frequency: data.frequency,
            duration: data.duration,
          }
        )
      );
    }

    this.patientService.newLabOrder(orderRequest).subscribe({
      next: (res) => {
        let result = this._CoreService.decryptContext(res);
        if (result.status) {
          this._CoreService.showSuccess("", "New Order placed successfully");
          this.openVerticallyCenteredapproved(this.approved);
        } else {
          this._CoreService.showError("", result.message);
        }

      },
      error: (err: ErrorEvent) => {
        this._CoreService.showError("", err.message);

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

  clearPdfUrl(index : number) {
    
    this.selectedPdfUrl.splice(index, 1); 
  }
}
