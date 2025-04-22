import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Input,
} from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { PatientService } from "src/app/modules/patient/patient.service";
import { CoreService } from "src/app/shared/core.service";
import { ActivatedRoute, Router } from "@angular/router";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { IndiviualDoctorService } from "../../indiviual-doctor.service";
import { ToastrService } from "ngx-toastr";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Subject } from "rxjs";
import { DecimalPipe, Location, DatePipe } from "@angular/common";
import { WebSocketService } from "src/app/shared/web-socket.service";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Select2UpdateEvent } from "ng-select2-component";
export interface PeriodicElement {
  medicine: string;
  packorunit: string;
  frequency: string;
  duration: number;
}
import { ThemePalette } from "@angular/material/core";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { PharmacyService } from "src/app/modules/pharmacy/pharmacy.service";
import { PharmacyPlanService } from "src/app/modules/pharmacy/pharmacy-plan.service";

export interface ILocationData {
  mode: "CALENDER" | "REMAINDER_CALENDER";
}

const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: "app-upcomingappointmentdetails",
  templateUrl: "./upcomingappointmentdetails.component.html",
  styleUrls: ["./upcomingappointmentdetails.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class UpcomingappointmentdetailsComponent implements OnInit {
  @Input() patientId: any;
  isSubmitted: boolean = false;
  @ViewChild("picker") picker: any;

  public date: moment.Moment;
  public disabled = false;
  public showSpinners = true;
  public showSeconds = false;
  public touchUi = false;
  public enableMeridian = false;
  public minDate = new Date();
  public maxDate = new Date();
  public stepHour = 1;
  public stepMinute = 1;
  public stepSecond = 1;
  public color: ThemePalette = "primary";
  public formGroup = new FormGroup({
    date: new FormControl(null, [Validators.required]),
    date2: new FormControl(null, [Validators.required]),
  });
  public dateControl = new FormControl(new Date());
  public dateControlMinMax = new FormControl(new Date());

  public options = [
    { value: true, label: "True" },
    { value: false, label: "False" },
  ];

  public listColors = ["primary", "accent", "warn"];

  public stepHours = [];
  public stepMinutes = [];
  public stepSeconds = [];

  displayedColumns: string[] = [
    "medicine",
    "packorunit",
    "frequency",
    "duration",
  ];
  dataSource: any = [];

  @ViewChild("htmlData") htmlData!: ElementRef;
  @ViewChild("noPermissionModal") noPermissionModal: ElementRef;
  @ViewChild("confirmationMessage") confirmationMessage: ElementRef;
  @ViewChild("confirmationPaymenforNOinsurance") confirmationPaymenforNOinsurance: ElementRef;
  @ViewChild("confirmationPaymenforInsurance") confirmationPaymenforInsurance: ElementRef;

  timeHourValue: any = [
    { name: "0  Hour", value: 0 },
    { name: "1  Hour", value: 1 },
    { name: "2  Hour", value: 2 },
    { name: "3  Hour", value: 3 },
    { name: "4  Hour", value: 4 },
    { name: "5  Hour", value: 5 },
    { name: "6  Hour", value: 6 },
    { name: "7  Hour", value: 7 },
    { name: "8  Hour", value: 8 },
    { name: "9  Hour", value: 9 },
    { name: "10 Hour", value: 10 },
    { name: "11 Hour", value: 11 },
    { name: "12 Hour", value: 12 },
    { name: "13 Hour", value: 13 },
    { name: "14 Hour", value: 14 },
    { name: "15 Hour", value: 15 },
    { name: "16 Hour", value: 16 },
    { name: "17 Hour", value: 17 },
    { name: "18 Hour", value: 18 },
    { name: "19 Hour", value: 19 },
    { name: "20 Hour", value: 20 },
    { name: "21 Hour", value: 21 },
    { name: "22 Hour", value: 22 },
    { name: "23 Hour", value: 23 },
  ];

  timeMinuteValue: any = [
    { name: "0  Minute", value: 0 },
    { name: "5  Minute", value: 5 },
    { name: "10  Minute", value: 10 },
    { name: "15  Minute", value: 15 },
    { name: "20  Minute", value: 20 },
    { name: "25  Minute", value: 25 },
    { name: "30  Minute", value: 30 },
    { name: "35  Minute", value: 35 },
    { name: "40  Minute", value: 40 },
    { name: "45  Minute", value: 45 },
    { name: "50  Minute", value: 50 },
    { name: "55  Minute", value: 55 },
    { name: "59  Minute", value: 59 },
    ,
  ];
  userRole: any;
  patientAllDetails: any;
  type: any;
  insuranceId: null;
  categoryData: any;
  planService: any;
  selectedcategoryName: any = "";
  patient_profile: any;
  backtoEMR: any;
  // Assign Healthcare Provider Model
  openVerticallyCenteredAssignhealthcare(assignhealthcare_content: any) {
    this.modalService.open(assignhealthcare_content, {
      centered: true,
      windowClass: "assign_healthcare",
    });
  }
  @Input() appointmentId: any = "";
  @Input() patient_id: any = "";
  @Input() profile: any ;
  appointmentDetails: any;
  country: any = "";
  isVisible: boolean = false;
  serachText: any = "";

  vitals: any;
  medicines: any;
  diagnosis: any;
  lab_test: any;
  radio_test: any;
  medicaldocument:any;

  genderList: any[] = [];
  bloodGroupList: any[] = [];
  martialStatusList: any[] = [];
  spokenLanguageList: any[] = [];
  relationshipList: any[] = [];
  staffList: any[] = [];

  selectedStaff: any[] = [];
  appointmentStatus: any = "";
  operatingDoctorDetails: any;

  remainderForm: any = FormGroup;
  isVitals: boolean = true;
  isCurrentMedicines: boolean = true;
  isPastMedicines: boolean = true;
  isImmunizations: boolean = true;
  isHistory: any;
  isMedicalDocument: any;
  primarySubscriberId: any = "";
  subscriberDetails: any[] = [];
  consulatationData: any = "";
  subject$ = new Subject();

  dateForSlot: any = new Date();
  choose_slot: any;
  appointment_type: any = "";
  patientProfile: any = "";
  location_id: any = "";
  doctor_availability: any[] = [];
  doctorAvailableTimeSlot: any[] = [];
  hospital_location: any[] = [];
  doctordetailsData: any = {};
  doctorRating: any;
  nearestAvailableSlot: any;
  nearestAvailableDate: any;
  consultationDate: any;
  appointment: any = "appointment";

  listMedicineDosagess: any[] = [];
  allDosagess: any[] = [];
  dosages: any[] = [];
  labs: any[] = [];
  imaging: any[] = [];
  vaccination: any[] = [];
  eyeglasses: any[] = [];
  others: any[] = [];
  totalCounts: any = 0;

  loggedInUserName: any;
  loggedInUserId: any;
  doctorId: any = "";
  overlay: false;
  serviceList: any = [];
  appointmentPayment: boolean;
  paymentType: any = "";
  subsciberId: any = "";
  serviceValue: any = "";
  consultationFee: any = "";
  copayment: any = "";
  insurancePay: any = "";
  serviceName: any;
  paymentDetails: any = [];
  selectedService: any = "";
  serviceId: any = "";
  currentDate: any = new Date();
  innerMenuPremission: any = [];
  value = new Date();
  categoryList: any = [];
  categoryObject: any = [];

  @ViewChild("confirmationModel") confirmationModel: any;
  @ViewChild("myDiv") myDivRef!: ElementRef;
  constructor(
    private modalService: NgbModal,
    private patientService: PatientService,
    private coreService: CoreService,
    private activatedRoute: ActivatedRoute,
    private indiviualDoctorService: IndiviualDoctorService,
    private toastr: ToastrService,
    private route: Router,
    private fb: FormBuilder,
    private websocket: WebSocketService,
    private datePipe: DatePipe,
    private loader: NgxUiLoaderService,
    private location: Location

  ) {

    this.activatedRoute.queryParams.subscribe((params: any) => {      
      this.backtoEMR = params.type;      
    })
    
    this.remainderForm = this.fb.group({
      remainderrr: this.fb.array([]),
      remainderDT: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    let adminData = JSON.parse(localStorage.getItem("adminData"));
    this.userRole = loginData?.role;

    this.loggedInUserName = loginData?.full_name;
    this.loggedInUserId = loginData?._id
    this.doctorId = loginData?._id;

    let paramId = ''
    if (this.patientId != undefined) {
      paramId = this.patientId.appointmentId
    }
    else {
      paramId = this.activatedRoute.snapshot.paramMap.get("id");
    }

    this.appointmentId = paramId;
    this.subject$.subscribe((val) => {
      if (val == 1) this.getAppointmentDetails();
    });
    this.getAppointmentDetails();

    const dateObject1 = new Date(this.currentDate);
    dateObject1.setHours(0, 0, 0, 0);

    this.currentDate = dateObject1;
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 2000);
  }

  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission() {
    let userPermission = this.coreService.getLocalStorage("loginData").permissions;
    let menuID = sessionStorage.getItem("currentPageMenuID");
    let checkData = this.findObjectByKey(userPermission, "parent_id", menuID)
    if (checkData) {
      if (checkData.isChildKey == true) {
        var checkSubmenu = checkData.submenu;
        if (checkSubmenu.hasOwnProperty("claim-process")) {
          this.innerMenuPremission = checkSubmenu['claim-process'].inner_menu;
        } else {
        }
      } else {
        var checkSubmenu = checkData.submenu;
        let innerMenu = [];
        for (let key in checkSubmenu) {
          innerMenu.push({ name: checkSubmenu[key].name, slug: key, status: true });
        }
        this.innerMenuPremission = innerMenu;
      }
    }
  }

  giveInnerPermission(value) {
    if (this.userRole === "INDIVIDUAL_DOCTOR_STAFF") {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    } else {
      return true;
    }
  }

  public consultationForm = new FormGroup({
    categoryService: new FormControl(""),
    service_name: new FormControl(""),
    reimbursement_rate: new FormControl("", [Validators.required]),
    doctor_fees: new FormControl("", [Validators.required]),
    insurance_pay: new FormControl("", [Validators.required]),
    comment: new FormControl(""),
    co_payment: new FormControl(""),
  });

  public consultationForm_nothaveInsurnace = new FormGroup({
    doctor_fees: new FormControl("", [Validators.required]),
    comment: new FormControl(""),
  });

  endConsultation() {
    this.openVerticallyCenteredconfirmationappointment(
      this.confirmationMessage
    );
  }

  openVerticallyCenteredconfirmPaymentforNOinsurance(confirmationPaymenforNOinsurance: any) {
    this.modalService.open(confirmationPaymenforNOinsurance, {
      centered: true,
      size: "md",
      windowClass: "end_appointment",
    });
  }

  openVerticallyCenteredconfirmPaymentforInsurance(confirmationPaymenforInsurance: any) {
    this.modalService.open(confirmationPaymenforInsurance, {
      centered: true,
      size: "md",
      windowClass: "end_appointment",
    });
  }

  onSubmit(type: any) {
    let reqData: any;
    if (type === 'insurance') {
      if (this.consultationForm.invalid) {
        return;
      }

      reqData = {
        appointment_id: this.appointmentId,
        columnData: {
          isPaymentDone: true,
          paymentDetails: {
            serviceName: this.serviceName,
            reimburstment_rate: this.serviceValue,
            doctorFees: this.consultationForm.value.doctor_fees,
            copay: this.consultationForm.value.co_payment,
            insuranceTobePaid: this.consultationForm.value.insurance_pay,
            comment: this.consultationForm.value.comment,
            serviceId: this.serviceId,
            catoegory: this.categoryObject
          },
        },
      };
    } else if (type === 'noInsurance') {
      if (this.consultationForm_nothaveInsurnace.invalid) {
        return;
      }

      reqData = {
        appointment_id: this.appointmentId,
        columnData: {
          isPaymentDone: true,
          paymentDetails: {
            doctorFees: this.consultationForm_nothaveInsurnace.value.doctor_fees,
            comment: this.consultationForm_nothaveInsurnace.value.comment,
          },
        },
      };
    }
    this.loader.start();
    this.indiviualDoctorService.updateConsultation(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.toastr.success(response.message);
          this.getAppointmentDetails();
          this.closePopup();
          this.loader.stop();
        } else {
          this.loader.stop();
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

  scrollToDiv(content: any) {
    if (this.myDivRef) {
      this.modalService.dismissAll("close");
      setTimeout(() => {
        this.myDivRef.nativeElement.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  }

  callUser(type?: string) {
    let mediaPermission;
    mediaPermission = { audio: true };
    if (type == "video") {
      mediaPermission = { ...mediaPermission, video: true };
    }

    AgoraRTC.getDevices()
      .then(async (devices) => {
        let audioDevices, videoDevices;

        audioDevices = devices.filter(function (device) {
          return device.kind === "audioinput";
        });

        let selectedMicrophoneId = audioDevices[0].deviceId;

        videoDevices = devices.filter(function (device) {
          return device.kind === "videoinput";
        });

        let selectedCameraId = videoDevices[0].deviceId;

      })
      .then((res) => {
        let roomid = this.appointmentId;
        const data = {
          loggedInUserId: this.loggedInUserId ? this.loggedInUserId : "",
          loggedInUserName: this.loggedInUserName,
          chatId: roomid,
          type: type,
          token: "Bearer " + localStorage.getItem("token"),
        };

        this.websocket.isCallStarted(true);
        this.websocket.callUser(data);
      })
      .catch((e) => {
        this.toastr.error("Please check your camera and mic");
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const locationInfo = this.location.getState() as ILocationData;
      if (locationInfo.mode === "CALENDER") {
        let element: HTMLElement = document.getElementById(
          "auto_trigger"
        ) as HTMLElement;
        element.click();
      }
      if (locationInfo.mode === "REMAINDER_CALENDER") {
        let element: HTMLElement = document.getElementById(
          "remainderauto_trigger"
        ) as HTMLElement;
        element.click();
      }
    }, 5000);
  }

  getAppointmentDetails() {
    this.indiviualDoctorService
      .viewAppointmentDetails(this.appointmentId)
      .subscribe(
        async (res) => {
          let response = await this.coreService.decryptObjectData({
            data: res,
          });
          if(response.status){
            this.profile = response?.data?.patientDetails;
            this.patient_profile = response?.data?.patientDetails?.profile_pic_signed_url;
            this.appointmentDetails = response?.data?.appointmentDetails;
            this.patientProfile = response?.data?.patinetDetails?.patient_profle;
            this.patient_id = response?.data?.patientDetails?.patient_id;
            this.doctorId = response?.data?.appointmentDetails?.doctorId;
            this.consultationDate = response?.data?.appointmentDetails?.date;
            this.appointmentStatus = response?.data?.appointmentDetails?.appointmentStatus;
            this.consulatationData = response?.data?.appointmentDetails?.consultationData;
  
            const dateString = this.appointmentDetails?.date;
            const date = new Date(dateString);
            const formattedDate = date.toString();
            this.maxDate = new Date(formattedDate);
            this.value = new Date(formattedDate);
            this.dateForSlot = new Date(formattedDate);
            this.choose_slot = this.appointmentDetails?.time;
            this.operatingDoctorDetails = response?.data?.doctor_basic_info;
          }
        },
        (err) => {
          let errResponse = this.coreService.decryptObjectData({
            data: err.error,
          });
          this.toastr.error(errResponse.message);
        }
      );
  }

 
  submitConsulatation() {
    let reqData = {
      appointment_id: this.appointmentId,
      columnData: {
        consultationData: this.consulatationData,
      },
    };

    this.indiviualDoctorService.updateConsultation(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.modalService.dismissAll("close");
          this.toastr.success(response.message);
          this.openVerticallyCenteredconfirmationappointment(
            this.confirmationMessage
          );
          // this.route.navigate(["/individual-doctor/appointment"]);
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.message);
      }
    );
  }

  redirectToPast() {
    let reqData = {
      appointment_id: this.appointmentId,
      columnData: {
        status: "COMPLETED",
      },
    };

    this.indiviualDoctorService.updateConsultation(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.modalService.dismissAll("close");
          this.toastr.success(response.message);
          this.route.navigate(["/individual-doctor/appointment"]);
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.message);
      }
    );
    // this.route.navigate(["/individual-doctor/appointment"]);
  }

  acceptOrRejectAppointment(status: any, reason: any) {
    let reqData = {
      appointmentId: this.appointmentId,
      cancelReason: reason,
      status: status,
      cancelledOrAcceptedBy: this.doctorId,
      cancel_by: 'doctor'
    };

    this.indiviualDoctorService.cancelSingleAppoinmentApi(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.modalService.dismissAll("close");
          this.toastr.success(response.message);
          this.route.navigate(["/individual-doctor/appointment"]);
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.toastr.error(errResponse.message);
      }
    );
  }

  assignHeathCareProvider() {
    let reqData = {
      appointment_id: this.appointmentId,
      staff_id: this.selectedStaff,
    };

    this.indiviualDoctorService
      .assignHealthCareProvider(reqData)
      .subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.toastr.success(response.message);
          this.subject$.next("1");
          this.modalService.dismissAll("close");
        }
      });
  }

  refreshDetails(fromChild: any) {
    if (fromChild === "refresh") {
      this.getAppointmentDetails();
    }
  }

  returnClass(id: string) {
    let isPresent = this.selectedStaff.filter((ele) => ele == id);
    if (isPresent.length === 0) {
      return "";
    } else {
      return "active";
    }
  }

  getCommonData() {
    this.patientService.commonData().subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      this.genderList = response?.body?.gender;
      this.bloodGroupList = response?.body?.bloodGroup;
      this.martialStatusList = response?.body?.martialStatus;
      this.spokenLanguageList = response?.body?.spokenLanguage;
      this.relationshipList = response?.body?.relationship;
    });
  }

  //  Approved modal
  openVerticallyCenteredapproved(approved: any) {
    this.modalService.open(approved, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
      keyboard: false,
      backdrop: false,
    });
  }

  //  Reject modal
  rejectModal: any;
  openVerticallyCenteredreject(reject: any) {
    this.rejectModal = this.modalService.open(reject, {
      centered: true,
      size: "md",
      windowClass: "reject_data",
      keyboard: false,
      backdrop: false,
    });
  }

  // Reason Modal
  openVerticallyCenteredcancelappointment(cancelappintmentcontent: any) {
    this.rejectModal.close();
    this.modalService.open(cancelappintmentcontent, {
      centered: true,
      size: "lg",
      windowClass: "cancel_appointment",
    });
  }

  openVerticallyCenteredconfirmationappointment(confirmationMessage: any) {
    this.modalService.open(confirmationMessage, {
      centered: true,
      size: "lg",
      windowClass: "end_appointment",
    });
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  closePopup() {
    this.modalService.dismissAll("close");
  }

  //------------Reschedule work--------------------------------
  doctorDetails() {
    let param = { doctor_portal_id: this.doctorId };
    this.indiviualDoctorService.doctorDetails(param).subscribe({
      next: async (res) => {
        let result = await this.coreService.decryptObjectData({ data: res });

        this.doctordetailsData = result.body?.data;
        this.doctorRating = result.body?.doctor_rating;
        this.doctor_availability = result.body?.data.in_availability;
        this.hospital_location = result.body?.data?.hospital_location;

        this.doctorAvailableSlot();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  async openVerticallyCenteredrechedule(choosedate: any) {
    const dateString = this.appointmentDetails?.date;
    const date = new Date(dateString);
    const formattedDate = date.toString();

    this.value = new Date(formattedDate);
    this.dateForSlot = new Date(formattedDate);
    this.choose_slot = this.appointmentDetails?.time;

    this.getNextAvailablleSlot(this.appointmentId);
    this.doctorDetails();

    this.modalService.open(choosedate, {
      centered: true,
      size: "lg",
      windowClass: "choose_date",
    });
  }

  getNextAvailablleSlot(id: any) {
    this.indiviualDoctorService.nextAvailableSlot(id).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.nearestAvailableSlot = response?.body?.slot?.slot;
        this.nearestAvailableDate = response?.body?.timeStamp;
      }
    });
  }

  openVerticallyCenteredChooseDateTime(chooseCalender: any) {
    // this.isOpen = false;
    this.nearestAvailableSlot = "";
    this.modalService.dismissAll();
    this.modalService.open(chooseCalender, {
      centered: true,
      size: "xl",
      windowClass: "select_datetime",
    });
  }

  public onSelection(data: any) {
    if (data.date) {
      const date = new Date(data.date);
      date.setHours(date.getHours() + 5, date.getMinutes() + 30); //adding 5.30 hr extra to get proper date
      const isoString = date.toISOString();
      this.dateForSlot = isoString;

      const inputDate = new Date(this.currentDate);
      const formattedDate = this.datePipe.transform(inputDate, 'yyyy-MM-ddTHH:mm:ss.SSSZ');

      if (this.dateForSlot >= formattedDate) {
      } else {
        this.toastr.error('Unable to continue, Please select future date');
        return;
      }
    } else if (data.type) {
      this.appointment_type = data.type;
    } else {
      this.location_id = data.locationid;
    }

    this.doctorAvailableSlot();
  }

  doctorAvailableSlot() {
    let param = {
      locationId: this.location_id,
      appointmentType: this.appointment_type,
      timeStamp: this.dateForSlot,
      doctorId: this.doctorId,
    };

    this.indiviualDoctorService.doctorAvailableSlot(param).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        this.doctorAvailableTimeSlot = result.body.allGeneralSlot;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  handleSelectSlot(slot: any) {
    this.choose_slot = slot;
  }

  handleRescheduleAppointment(isNextAvailable: any) {
    let reqData = {
      appointmentId: this.appointmentId,
      rescheduleConsultationDate:
        isNextAvailable === "no"
          ? new DatePipe("en-US").transform(this.dateForSlot, "yyyy-MM-dd")
          : new DatePipe("en-US").transform(
            this.nearestAvailableDate,
            "yyyy-MM-dd"
          ),

      rescheduleConsultationTime:
        isNextAvailable === "no" ? this.choose_slot : this.nearestAvailableSlot,
      rescheduled_by: "doctor",
      rescheduled_by_id: this.doctorId,
    };

    this.indiviualDoctorService
      .rescheduleAppointment(reqData).subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.modalService.dismissAll("close");
          this.toastr.success(response.message);
          this.getAppointmentDetails();
        }
      });
  }

  viewOtherPastAppointment(fromChild: any) {
    if (fromChild === "refresh") {
      window.location.reload();
    }
  }

  public openPDF(): void {
    window.location.href = this.templateSigneUrl;
  }

  //  No Permission modal
  openVerticallyCenteredrejectappointment(noPermissionModal: any) {
    this.modalService.open(noPermissionModal, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
    });
  }

  noPermissionHandler() {
    this.modalService.dismissAll("close");
    this.route.navigate(["/individual-doctor/appointment"]);
  }

  eprescriptionDetails: any;
  isPrescriptionValidate: boolean = false;
  templateSigneUrl: any = "";



  ngOnDestroy() {
    this.subject$.complete();
  }

  getAllEprescriptionsTests() {
    let reqData = {
      appointmentId: this.appointmentId,
    };
    this.indiviualDoctorService
      .getAllEprescriptionTests(reqData)
      .subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          let data = response?.body[0];
          //For MEdicine Dosage
          this.allDosagess = data?.dosages;

          data?.dosages.forEach(async (element) => {
            let obj = {
              _id: element?.medicineId,
              medicine_name: element?.medicine_name,
            };

            let result = this.listMedicineDosagess.filter((s) =>
              s?.medicine_name.includes(element.medicine_name)
            );
            if (result.length === 0) {
              this.listMedicineDosagess.push(obj);
            }
          });

          this.labs = data?.labs;
          this.imaging = data?.imaging;
          this.vaccination = data?.vaccinations;
          this.eyeglasses = data?.eyeglasses;
          this.others = data?.others;

          this.totalCounts =
            this.listMedicineDosagess?.length +
            this.labs?.length +
            this.vaccination?.length +
            this.others?.length +
            this.eyeglasses?.length +
            this.imaging?.length;
        }
      });
  }

  returnDosagesForMedicine(medicineName) {
    let doseArray = [];
    let statementArray = [];
    this.allDosagess.forEach((dose) => {
      if (dose.medicine_name === medicineName) {
        doseArray.push(dose);
      }
    });

    doseArray.forEach((dose) => {
      if (
        dose?.quantities?.quantity_type === "Exact_Quantity" ||
        dose?.quantities?.quantity_type === "Enough_Quantity"
      ) {
        if (dose?.frequency?.frequency_type === "Moment") {
          let statement = `${dose?.quantities?.quantity} ${dose?.quantities?.type}, Morning(${dose?.frequency?.morning}), Midday(${dose?.frequency?.midday}), Evening(${dose?.frequency?.evening}), Night(${dose?.frequency?.night}) for ${dose?.take_for?.quantity} ${dose?.take_for?.type}`;
          statementArray.push(statement);
        }

        if (
          dose?.frequency?.frequency_type === "Recurrence" ||
          dose?.frequency?.frequency_type === "Alternate_Taking"
        ) {
          let statement = `${dose?.quantities?.quantity} ${dose?.quantities?.type}, Medicines(${dose?.frequency?.medicine_quantity}) for every ${dose?.frequency?.every_quantity} ${dose?.frequency?.type},  ${dose?.take_for?.quantity} ${dose?.take_for?.type}`;
          statementArray.push(statement);
        }
      }
    });

    return statementArray;
  }

  getDirection() {
    const lat = this.profile?.loc?.lat; // Replace with desired latitude
    const lng = this.profile?.loc?.long; // Replace with desired longitude

    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(mapUrl, "_blank");
  }

  isButtonDisabled(appointmentDate: string, appointmentTime: string): boolean {
    if (!appointmentDate || !appointmentTime) {
      return false; // If appointmentDate or appointmentTime is null or undefined, return false
    }
    const currentTime = new Date();

    const [year, month, day] = appointmentDate.split('-');
    const appointmentYear = parseInt(year);
    const appointmentMonth = parseInt(month) - 1;
    const appointmentDay = parseInt(day);

    const [startTime, endTime] = appointmentTime.split('-');
    const [startHour, startMinute] = startTime.split(':');
    const [endHour, endMinute] = endTime.split(':');

    const appointmentStart = new Date(appointmentYear, appointmentMonth, appointmentDay, parseInt(startHour), parseInt(startMinute));

    const timeDiff = appointmentStart.getTime() - currentTime.getTime();

    const diffInMinutes = timeDiff / (1000 * 60);

    return diffInMinutes >= 30 && diffInMinutes > 0; // Check for 30 minutes
  }

  getCategoryId(event: any) {
    if (event.value != undefined) {
      this.serviceList = [];
      this.categoryObject = event.value
      if (this.planService.length > 0) {
        this.planService.forEach((data) => {
          if ((data.has_category).toLowerCase() == (event.value).toLowerCase()) {
            this.serviceList.push({
              label: data.service,
              value: data._id,
            })
          }
        })
      }
    }
  }

  isButtonDisabled2(appointmentDate: string, appointmentTime: string): boolean {
    if (!appointmentDate || !appointmentTime) {
      return false; // If appointmentDate or appointmentTime is null or undefined, return false
    }
    const currentTime = new Date();

    const [year, month, day] = appointmentDate.split('-');
    const appointmentYear = parseInt(year);
    const appointmentMonth = parseInt(month) - 1;
    const appointmentDay = parseInt(day);

    const [startTime, endTime] = appointmentTime.split('-');
    const [startHour, startMinute] = startTime.split(':');
    const [endHour, endMinute] = endTime.split(':');

    const appointmentStart = new Date(appointmentYear, appointmentMonth, appointmentDay, parseInt(startHour), parseInt(startMinute));

    const timeDiff = appointmentStart.getTime() - currentTime.getTime();

    const diffInMinutes = timeDiff / (1000 * 60);

    return diffInMinutes >= 60 && diffInMinutes > 0; // Check for 1 hour (60 minutes)
  }

  calculateAge(dob: string): number {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  
  gotTOBack(type:any=''){
    if(this.backtoEMR !== undefined || type === 'emr'){
      this.route.navigate([`/individual-doctor/patientmanagement/details/${this.patient_id}`],{
        queryParams: {
          type: type,
          patientId: this.patient_id,
          appointmentId : this.appointmentId
        }
      })
    }else{
      this.route.navigate(['/individual-doctor/appointment'])
    }
    // this.location.back();
  

  }


}
