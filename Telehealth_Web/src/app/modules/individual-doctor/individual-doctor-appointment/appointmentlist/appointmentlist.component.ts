import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "../../indiviual-doctor.service";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from "@angular/forms";
import { PatientService } from "src/app/modules/patient/patient.service";
import { DatePipe } from "@angular/common";
import { DateAdapter, ThemePalette } from "@angular/material/core";
import { IResponse } from "src/app/shared/classes/api-response";
import { WebSocketService } from "src/app/shared/web-socket.service";
import AgoraRTC from "agora-rtc-sdk-ng";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";

export interface PeriodicElement {
  dateofcreation: string;
  patientname: string;
  assigndoctorname: string;
  orderid: string;
  dateandtime: string;
  location: string;
  appointmentstype: string;
  reasonforappt: string;
  fee: string;
  status: string;
}
const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: "app-appointmentlist",
  templateUrl: "./appointmentlist.component.html",
  styleUrls: ["./appointmentlist.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AppointmentlistComponent implements OnInit {
  showscheduler: any = false;

  appointments = new FormControl("");
  displayedColumns: string[] = [
    "patientname",
    "appointmentId",
    "appdateandtime",
    "status",
    "patientconfirmation",
    "action",
  ];
  dataSource = new MatTableDataSource<PeriodicElement>([]);
  isSubmitted: boolean = false;
  appointmentId: any = "";
  allAppointmentList: any[] = [];
  page: any = 1;service
  pageSize: number = 10;
  totalLength: number = 0;
  searchText: any = "";
  selectedStatus: any = "ALL";
  dateFilter: any = "";
  manageStatus: any = "";
  Fromdate: any;
  ToDate: any;
  dateCancelAppointmentForm: any = FormGroup;
  scheduleForm: any = FormGroup;
  remainderForm: any = FormGroup;
  doctor_id: any = "";
  userRole: any = "";
  for_portal_user: any = "";
  patient_id: any = "";
  isButtonDisabled: { [key: string]: boolean } = {};
  dateForSlot: any = new Date();
  appointment_type: any = "";
  location_id: any = "";
  doctor_availability: any[] = [];
  doctorAvailableTimeSlot: any[] = [];
  hospital_location: any[] = [];
  doctordetailsData: any = {};
  doctorRating: any;
  nearestAvailableSlot: any;
  nextAvailableDate: any;
  consultationDate: any;

  isOpen = false;
  seletectedLocation: any = "";
  selectedLocationId: any = "";

  sortColumn: string = 'createdAt';
  sortOrder: 1 | -1 = -1;
  sortIconClass: string = 'arrow_upward';
  currentUrl : any = [];
  selectedPatient:any;
  selectedPatientId:any;
  centresList:any;
  overlay = false;
  userList:any;
  allDoctorIds:any;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  showCallButtonNow: boolean = true;

  @ViewChild("rejectappointment") rejectappointment: ElementRef;

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

  timeHourValue: any = [
    { name: "0 Hour", value: 0 },
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
    { name: "59  Minute", value: 59 }
  ];
  assign_doctor_depart: any;
  listData: any;
  doctor_portal_id: any = [];
  assign_doctor_services: any;
  assign_doctor_unit: any;
  callButtonEnable:any = 0;
  showAssignDoctorColumn: boolean = false;
  doctor_name: any;
  assign_Doctor: any;
  selectedDoctorId: any;
  doctorId: any[];
  indi_doc_staffId: any;
  doctor__Id: any[];
  get_doctorId: any;
  user_id: any;
  currentDate: any = new Date();
  doctor_staff: any;
  userName: any;
  parent_patient_id: any;
  selectedAppointmentId: any;
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
  dateRangeForm: FormGroup;
  fromDate: string = '';
  toDate: string = ''
  userID: any = "";
  choose_slot: any;
  value = new Date();
  innerMenuPremission: any = [];
  constructor(
    private readonly modalService: NgbModal,
    private readonly fb: FormBuilder,
    private readonly activatedRoute: ActivatedRoute,
    private readonly doctorService: IndiviualDoctorService,
    private readonly coreService: CoreService,
    private readonly toastr: ToastrService,
    private readonly router: Router,
    private readonly _patientService: PatientService,
    private readonly datePipe: DatePipe,
    private readonly websocket: WebSocketService,
    private readonly cdr: ChangeDetectorRef,
    private readonly services: IndiviualDoctorService,
    private readonly dateAdapter: DateAdapter<Date>    ,
    private readonly loader: NgxUiLoaderService,
    private readonly superAdminServcie : SuperAdminService

  ) {
    this.dateAdapter.setLocale('en-GB');

    this.dateRangeForm = this.fb.group({
      fromDate: [null],
      toDate: [null]
    });


    const userData = this.coreService.getLocalStorage("loginData");
    this.userID = userData._id;
    this.userName = userData.fullName;

    this.dateCancelAppointmentForm = this.fb.group({
      appoint: [""],
      fromDate: ["", [Validators.required]],
      toDate: ["", [Validators.required]],
    });

    this.remainderForm = this.fb.group({
      remainderrr: this.fb.array([]),
      remainderDT: this.fb.array([]),
    });

    this.scheduleForm = this.fb.group({
      hospital_location: [""],
      appointment_typed: [""],
    });

    // public scheduleForm: FormGroup = new FormGroup({
    //   hospital_location: new FormControl(""),
    //   appointment_typed: new FormControl(),
    // });
  }
  showschedule(type) {
    this.showscheduler = type;
    if (type == false) {
      this.getAppointmentlist();
    }
  }

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.getAppointmentlist(`${column}:${this.sortOrder}`);
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges(); // This forces Angular to re-run change detection.
  }

  ngOnInit(): void {
    this.getGenralSetting_List();
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.dateRangeForm.patchValue({
      fromDate: firstDay,
      toDate: lastDay
    });

    this.fromDate = this.formatDate(firstDay);
    this.toDate = this.formatDate(lastDay);

    this.activatedRoute.queryParams.subscribe((val: any) => {
      if (val.id || val.type) {
        this.selectedStatus = val.id;
        this.consultationType = val.type;
      }
      this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl)
    });

    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.user_id = loginData?._id
    let adminData = JSON.parse(localStorage.getItem("adminData"));

    this.userRole = loginData?.role;
    this.assign_doctor_depart = adminData?.department;
    this.assign_doctor_services = adminData?.services;
    this.assign_doctor_unit = adminData?.unit;
    this.assign_Doctor = adminData?.for_doctor;


    if (
      this.userRole === "INDIVIDUAL_DOCTOR"
    ) {
      this.doctor_id = loginData?._id;
    } else {
      this.doctor_id = adminData?.in_hospital;
    }

    this.for_portal_user = adminData?.in_hospital;

    this.doctor_portal_id = [];

    if (this.userRole === "INDIVIDUAL_DOCTOR_STAFF") {
      this.doctor_portal_id.push(this.doctor_id);
      this.getAppointmentlist(`${this.sortColumn}:${this.sortOrder}`);
    }
    else {
      this.doctor_portal_id.push(this.doctor_id);
      this.getAppointmentlist(`${this.sortColumn}:${this.sortOrder}`);
    }
    const dateObject1 = new Date(this.currentDate);
    dateObject1.setHours(0, 0, 0, 0);

    this.currentDate = dateObject1;
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 2000);
    this.getAllPatientList();
    this.getAppointmentlist()
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




  async checkForPlan() {

    let isPurchased = await this.doctorService.isPlanPurchesdByDoctor(
      this.userID
    ); //check fot purchased plan

    if (!isPurchased) {
      // this.modalService.open(this.confirmationModel);
      this.coreService.showError(
        "No plan purchsed! Please purches new plan",
        ""
      );
      this.router.navigate(["/individual-doctor/subscriptionplan"]);
      return;
    }
  }

  get f() {
    return this.dateCancelAppointmentForm.controls;
  }
  onDateChange(type: string, event: Date): void {
    if (type === 'from') {
      this.dateRangeForm.get('fromDate')?.setValue(event);
    } else if (type === 'to') {
      this.dateRangeForm.get('toDate')?.setValue(event);
    }

    const fromDate = this.dateRangeForm.get('fromDate')?.value;
    const toDate = this.dateRangeForm.get('toDate')?.value;

    this.fromDate = this.formatDate(fromDate);
    this.toDate = this.formatDate(toDate);

    this.getAppointmentlist();

  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  // allapointmentlist
  async getAppointmentlist(sort: any = '') {
    let reqData = {
      doctor_portal_id: this.doctor_portal_id,
      limit: this.pageSize,
      page: this.page,
      status: this.selectedStatus,
      // date: this.dateFilter,
      sort: sort,
      fromDate: this.fromDate,
      toDate: this.toDate,
      patientId:this.selectedPatientId ?? "",
    };

    this.doctorService.appoinmentListApi(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);
        if(response.status){      
        this.dataSource = response?.data?.data;
        this.allAppointmentList = response?.data?.data;
        this.allDoctorIds = response?.data?.data[0]?.doctorId;
        this.getAllPatientList();
        // this.new_doctor_id = response?.data?.data.map((ele) => {
        //   return ele.doctorId;
        // })
  
        this.totalLength = response?.data?.totalRecords;
      }

    });
  }

  // get assigndoctor department,service and unit for hospital staff
  async getDoctor(doctor_list) {

    let reqData = {
      in_hospital: this.doctor_id,
      doctor_list: doctor_list,
      departmentArray: this.assign_doctor_depart,
      unitArray: this.assign_doctor_unit,
      serviceArray: this.assign_doctor_services
    }

    this.doctorService.getdepartmentAsperDoctor(reqData).subscribe({

      next: async (result: IResponse<any>) => {
        let response = await this.coreService.decryptObjectData({ data: result });

        if (response.status == true) {
          this.listData = response?.body?.data.map((assDoc_is: any) => {
            if (this.doctor_portal_id.indexOf(assDoc_is.for_portal_user) == -1) {
              this.doctor_portal_id.push(assDoc_is.for_portal_user);
            }

          })
          this.getAppointmentlist();

        }

      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
        if (err.message === "INTERNAL_SERVER_ERROR") {
          this.coreService.showError("", err.message);
        }
      },

    })
  }


  // multiple-Cancel-appointment
  handleCancelMultipleAppointment(status: any, reason: any) {


    this.doctor__Id = [];

    if (this.userRole === "INDIVIDUAL_DOCTOR") {
      this.doctor__Id.push(this.doctor_id);

    } else if (this.userRole === "INDIVIDUAL_DOCTOR_STAFF") {
      this.doctor__Id.push(this.doctor_id);
    }
    const inputDate_Fromdate = new Date(this.dateCancelAppointmentForm.value.fromDate);
    const formattedDate_Fromdate = this.datePipe.transform(inputDate_Fromdate, 'yyyy-MM-ddTHH:mm:ss.SSSZ');

    const inputDate_Todate = new Date(this.dateCancelAppointmentForm.value.toDate);
    const formattedDate_todate = this.datePipe.transform(inputDate_Todate, 'yyyy-MM-ddTHH:mm:ss.SSSZ');

    let reqData = {
      cancelReason: reason,
      status: status,
      cancelledOrAcceptedBy: this.doctor__Id,
      loginId: this.userID,
      fromDate: formattedDate_Fromdate.split("T")[0],
      toDate: formattedDate_todate.split("T")[0],
      consultationType: this.appointments.value,
    };


    this.doctorService
      .cancelMultipleAppoinmentApi(reqData)
      .subscribe((res: any) => {
        let encryptedData = { data: res };
        let response = this.coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.toastr.success(response.message);
          this.getAppointmentlist();
          this.closePopup();
        } else {
          this.toastr.error(response.message);
        }
      });
  }
  // single-Cancel-appointment
  handleCancelSingleAppointment(reason: any) {
    this.doctor__Id = [];

    if (this.userRole === "INDIVIDUAL_DOCTOR") {
      this.doctor__Id.push(this.doctor_id);

    } else if (this.userRole === "INDIVIDUAL_DOCTOR_STAFF") {
      this.doctor__Id.push(this.doctor_id);
    }
    let reqData = {
      appointment_id: this.appointmentId,
      cancelReason: reason,
      status: this.manageStatus,
      cancelledOrAcceptedBy: this.doctor__Id,
      loginId: this.userID
    };

    this.doctorService
      .cancelSingleAppoinmentApi(reqData)
      .subscribe((res: any) => {
        let encryptedData = { data: res };
        let response = this.coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.toastr.success(response.message);
          this.getAppointmentlist();
          this.closePopup();
        } else {
          this.toastr.error(response.message);
        }
      });
  }

  approveOrRejectedAppointment(status: any, reason: any) {

    let reqData = {
      appointmentId: this.appointmentId,
      cancelReason: reason,
      status: status,
      cancelledOrAcceptedBy: this.user_id,
      cancel_by: 'doctor',
      parent_patient_id : this.parent_patient_id

    };

    this.doctorService.cancelSingleAppoinmentApi(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.closePopup();
          this.toastr.success(response.message);
          this.getAppointmentlist();
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.closePopup();
        this.toastr.error(errResponse.message);
      }
    );
  }

  handleSelectFliterList(event: any) {
    this.selectedStatus = event.value;
    this.getAppointmentlist();
  }

  handleSelectDoctorList(event: any) {

    if (event.value === "ALL") {
      this.getAppointmentlist();

    } else {
      let filterData;
      filterData = this.allAppointmentList.filter((ele) => {
        return ele.doctor_name === event.value
      })
      this.dataSource = filterData
    }


  }
  public onDoctorSelection(data: any) {
    this.selectedDoctorId = data?.value

  }
  consultationType: any = "ALL";

  handleSelectFliterTypeList(event: any) {
    this.consultationType = event.value;
    this.getAppointmentlist();
  }

  handleSelectDateFilter(event: any) {
    let date = this.datePipe.transform(event.value, "YYYY-MM-dd");
    this.dateFilter = date;
    this.getAppointmentlist();
  }

  clearDateFilter() {
    this.dateFilter = "";
    this.getAppointmentlist();
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAppointmentlist();
  }
  closePopup() {
    this.modalService.dismissAll("close");
    this.isSubmitted = false;
    this.remainderForm.reset();
    this.remainderrr1.clear();
    this.remainderDT.clear();
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
  }

  // action-view
  viewClick(status: any, id: any) {
    if (status === "Upcoming" || status === "Today") {
      this.router.navigate([
        `/individual-doctor/appointment/upcomingdetails/${id}`,
      ]);
    } else {
      this.router.navigate([`/individual-doctor/appointment/details/${id}`]);
    }
  }





  //  Cancel Appoinment modal
  openVerticallyCenteredcancelappointment(cancelappintmentcontent: any) {
    if (
      this.dateCancelAppointmentForm.value.fromDate ||
      this.dateCancelAppointmentForm.value.toDate
    ) {
    } else {
      this.rejectModal.close();
    }

    this.modalService.open(cancelappintmentcontent, {
      centered: true,
      size: "lg",
      windowClass: "cancel_appointment",
    });
  }

  //  Approved modal
  openVerticallyCenteredapproved(approved: any, appointmentId: any, doctorId: any) {
    this.appointmentId = appointmentId;
    this.get_doctorId = doctorId
    this.modalService.open(approved, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
    });
  }


  rejectModal: any;

  //  Reject Appointment modal
  openVerticallyCenteredrejectappointment(
    rejectappointment: any,
    appointment_id: any,
    doctorId: any,
    parent_patient_id:any
  ) {
    this.appointmentId = appointment_id;
    this.get_doctorId = doctorId;
    this.parent_patient_id = parent_patient_id;

    this.rejectModal = this.modalService.open(rejectappointment, {
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
  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  //-------Form Array Handling--------------->
  newRemainderForm(): FormGroup {
    return this.fb.group({
      minutes: ["", [Validators.required]],
      hours: [""],
    });
  }

  newRemainderDTForm(): FormGroup {
    return this.fb.group({
      dateTime: [""],
    });
  }

  get remainderrr1(): FormArray {
    return this.remainderForm.get("remainderrr") as FormArray;
  }
  get remainderDT(): FormArray {
    return this.remainderForm.get("remainderDT") as FormArray;
  }

  // remainder
  addnewRemainder() {
    this.remainderrr1.push(this.newRemainderForm());
  }
  removeRemainder(i: number) {
    this.remainderrr1.removeAt(i);
  }
  // remainderDT
  addnewRemainderDT() {
    this.remainderDT.push(this.newRemainderDTForm());

  }
  removeRemainderDT(i: number) {
    this.remainderDT.removeAt(i);
  }
  // Remainder Modal

  openVerticallyCenteredremainder(remaindermodal: any, appointmentData: any) {
    this.appointmentId = appointmentData?.appointment_id;
    const dateString = appointmentData?.consultation_date;
    const date = new Date(dateString);
    const formattedDate = date.toString();

    this.maxDate = new Date(formattedDate);
    this.getReminders(this.appointmentId);
    this.remainderForm.reset();
    this.remainderrr1.clear();
    this.remainderDT.clear();

    this.addnewRemainder();
    this.addnewRemainderDT();
    this.isOpen = false;
    this.modalService.open(remaindermodal, { centered: true, size: "lg" });
  }

  setReminderSave() {
    this.isSubmitted = true;
    if (this.remainderForm.invalid) {
      this.coreService.showError("", "Please Fill the required Fields")
      return;
    }
    let reminderData = [];
    let reminderData2 = [];

    if (
      this.remainderForm.value.remainderrr &&
      this.remainderForm.value.remainderrr.length > 0
    )
      this.remainderForm.value.remainderrr.forEach((el) => {
        reminderData.push({ hours: el?.hours, minutes: el?.minutes });
      });
    if (
      this.remainderForm.value.remainderDT &&
      this.remainderForm.value.remainderDT.length > 0
    )
      this.remainderForm.value.remainderDT.forEach((el) => {

        reminderData2.push({
          datetime: el.dateTime,
        });
      });

    let reqData = {
      appointment_id: this.appointmentId,
      doctorId: this.doctor_id,
      patientId: this.patient_id,
      format: "hours",
      time_reminder_data: reminderData,
      datetime_reminder_data: reminderData2,
    };

    // return;
    this._patientService.setReminder(reqData).subscribe((res: any) => {
      let data = this.coreService.decryptObjectData({ data: res });
      this.remainderForm.reset();
      this.modalService.dismissAll();
      this.toastr.success(data.message);
    });
  }

  getReminders(appointmentId: any) {
    let data = {
      appointment_id: appointmentId,
      doctorId: this.doctor_id
    };
    this._patientService.getRemindersData(data).subscribe((res: any) => {
      let data = this.coreService.decryptObjectData({ data: res });

      var timeData = [];
      for (let i = 0; i < data?.data?.data?.time_reminder_data?.length; i++) {
        var timeDataValue = data?.data?.data?.time_reminder_data[i];
        if (i > 0) {
          this.addnewRemainder();
        }
        let dataObj = {
          minutes: timeDataValue?.minutes,
          hours: timeDataValue?.hours,
        };
        timeData.push(dataObj);
      }
      var dateData = [];
      for (
        let i = 0;
        i < data?.data?.data?.datetime_reminder_data?.length;
        i++
      ) {
        var timeDataValue1 =
          data?.data?.data?.datetime_reminder_data[i].datetime;

        if (i > 0) {
          this.addnewRemainderDT();
        }
        let dataObj = {
          dateTime: timeDataValue1,
        };
        dateData.push(dataObj);

      }


      this.remainderForm.patchValue({
        remainderrr: timeData,
      });
      this.remainderForm.patchValue({
        remainderDT: dateData,
      });
    });
  }
  doctorDetails(doctorId: any = "") {

    let param = { doctor_portal_id: doctorId };

    // let param = { doctor_portal_id: "63e2493509a65d0de48c70c8" };

    this.doctorService.doctorDetails(param).subscribe({
      next: async (res) => {
        let result = await this.coreService.decryptObjectData({ data: res });

        this.doctordetailsData = result.body?.data;
        this.doctorRating = result.body?.doctor_rating;
        this.doctor_availability = result.body?.data.in_availability;
        this.hospital_location = result.body?.data.hospital_location;
        // this.location_id = result.body?.data.hospital_location[0].hospital_id;
        // this.location_id = result.body?.data?.in_availability[0]?.location_id;
        this.doctorAvailableSlot();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  //------------Reschedule work--------------------------------

  async openVerticallyCenteredrechedule(choosedate: any, appointmentData: any) {

    this.appointmentId = appointmentData?.appointment_id;
    this.location_id = appointmentData?.hospital_details?.hospital_id;
    this.consultationDate = appointmentData?.consultation_date;
    this.appointment_type = appointmentData?.consultation_type;
    this.choose_slot = appointmentData?.consultation_time;

    const dateString = appointmentData?.consultation_date;
    const date = new Date(dateString);
    const formattedDate = date.toString();

    this.value = new Date(formattedDate);
    this.dateForSlot = new Date(formattedDate);

    this.get_doctorId = appointmentData?.doctorId;


    this.doctorDetails(appointmentData?.doctorId);

    this.getNextAvailablleSlot(this.appointmentId);

    this.modalService.open(choosedate, {
      centered: true,
      size: "lg",
      windowClass: "choose_date",
    });
  }

  getNextAvailablleSlot(id: any) {
    this.doctorService.nextAvailableSlot(id).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.nearestAvailableSlot = response?.body?.slot?.slot;
        this.nextAvailableDate = response?.body?.timeStamp;
      }
    });
  }

  openVerticallyCenteredChooseDateTime(chooseCalender: any) {
    this.nearestAvailableSlot = "";
    this.modalService.dismissAll();
    this.modalService.open(chooseCalender, {
      centered: true,
      size: "xl",
      windowClass: "select_datetime",
    });
  }

  public onSelection(data: any) {
    this.nearestAvailableSlot = "";
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
      appointmentType:
        this.appointment_type === "Online"
          ? "ONLINE"
          : this.appointment_type === "Home Visit"
            ? "HOME_VISIT"
            : "FACE_TO_FACE",
      timeStamp: this.dateForSlot,
      doctorId: this.doctor_id,
    };

    this.doctorService.doctorAvailableSlot(param).subscribe({
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
    // this.nearestAvailableSlot = slot;
    this.choose_slot = slot;
  }

  handleRescheduleAppointment(isNextAvailable: any) {
    let reqData = {
      appointmentId: this.appointmentId,
      rescheduleConsultationDate:
        isNextAvailable === "no"
          ? new DatePipe("en-US").transform(this.dateForSlot, "yyyy-MM-dd")
          : new DatePipe("en-US").transform(
            this.nextAvailableDate,
            "yyyy-MM-dd"
          ),

      rescheduleConsultationTime:
        isNextAvailable === "no" ? this.choose_slot : this.nearestAvailableSlot,
      rescheduled_by: "doctor",
      rescheduled_by_id: this.doctor_id,
    };

    // return;

    this.doctorService.rescheduleAppointment(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.modalService.dismissAll("close");
        this.toastr.success(response.message);
        this.getAppointmentlist();
      }
    });
  }


  navigateToAppointmentDetails(appointmentId: any) {
    const navigationExtras = {
      queryParams: {
        type: 'consultationModal',
      },
    };

    this.router.navigate([`/individual-doctor/appointment/appointmentdetails/${appointmentId}`], navigationExtras);

  }

  refreshDetails(fromChild: any) {
    if (fromChild === "refresh") {
      this.getAppointmentlist();
    }
  }

  callingUser(type: string, apptId: any) {
    let mediaPermission;
    mediaPermission = { audio: true }; // By default, audio is required
    let videoAvailable = false; // Flag to track video device availability
    
    if (type == "video") {
      mediaPermission = { ...mediaPermission, video: true };
    }
  
    AgoraRTC.getDevices()
      .then(async (devices) => {
        let audioDevices, videoDevices;
  
        // Filter for audio devices
        audioDevices = devices.filter((device) => device.kind === "audioinput");
  
        // Check if there's at least one audio device
        if (audioDevices.length === 0) {
          this.toastr.error("No audio device detected. Please check your microphone.");
          throw new Error("No audio device found");
        }
  
  
        // Filter for video devices (only if it's a video call)
        if (type == "video") {
          videoDevices = devices.filter((device) => device.kind === "videoinput");
          videoAvailable = videoDevices.length > 0; // Flag to check if video devices are available
  
          // If no video devices, allow joining the call without video
          if (!videoAvailable) {
            console.warn("No video device found, joining video call without video.");
          }
        }
  
        // Now, proceed with the call if there's at least one audio device
        let roomid = apptId;
  
        const data = {
          loggedInUserId: this.userID ?? "",
          loggedInUserName: this.userName,
          chatId: roomid,
          type: type,
          token: "Bearer " + localStorage.getItem("token"),
        };
  
        this.websocket.isCallStarted(true);
        this.websocket.callUser(data);
      })
      .catch((e) => {
        // If there's no audio device, show an error
        if (e.message !== "No audio device found") {
          this.toastr.error("Please check your camera and mic");
        }
      });
  }  

  onClickCallUser(consultationDate: string, consultationTime: string,appId:any): void {
    if (this.isButtonDisabled[appId]) return; // Prevent multiple clicks
 
    this.isButtonDisabled[appId] = true; // Disable button
    setTimeout(() => {
      this.isButtonDisabled[appId] = false; // Enable after delay
    }, 10000);
   
    const withinWindow = this.isWithinConsultationWindow(consultationDate, consultationTime);
    
    if (withinWindow == true) {
      this.callingUser('video',appId);
    } else {
      // console.log('Appointment has passed, button disabled.');
    }
  }
  


  isWithinConsultationWindow(consultationDate: string, consultationTime: string): boolean {
    if (this.showCallButtonNow === false) {
      console.log("showwwwwwwww111111111111")
      return true;
    }else{
      console.log("showwwwwwwww22222222222");
      
      const timeRange = consultationTime.split('-'); 
      const startTime = timeRange[0]; 
      const endTime = timeRange[1];  
      const consultationStartDateTime = new Date(`${consultationDate}T${startTime}:00`);
      const currentTime = new Date();  
      const startOfVisibility = new Date(consultationStartDateTime.getTime() - this.callButtonEnable * 60 * 1000);
      const endOfVisibility = new Date(consultationStartDateTime.getTime() + 24 * 60 * 60 * 1000);
    
      return currentTime >= startOfVisibility && currentTime <= endOfVisibility;
    }
  }
  
  goTOEmr(id){
    this.router.navigate([`/individual-doctor/patientmanagement/details/${id}`])
  }

  onNavigate(url:any): void {
    const menuitems = JSON.parse(localStorage.getItem('activeMenu'))
     this.currentUrl = url
   
    const matchedMenu = menuitems.find(menu => menu.route_path === this.currentUrl);
    this.router.navigate([url]).then(() => {
      
      this.services.setActiveMenu(matchedMenu?.name);
    });
   
  }

  openPopupForupdateApppointmentStatus(statusUpdate:any, id:any){
    this.selectedAppointmentId = id;
    this.rejectModal = this.modalService.open(statusUpdate, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
    });
}
  updateApppointmentStatus(){
    let reqData = {
      appointmentId:this.selectedAppointmentId,  
    };
    this.loader.start();
    this.doctorService.appointmentStatusUpdate(reqData).subscribe(
      (res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.loader.stop();
          this.closePopup();
          this.toastr.success(response.message);
          this.getAppointmentlist();
        }else{
         this.loader.stop();
        }
      },
      (err) => {
        let errResponse = this.coreService.decryptObjectData({
          data: err.error,
        });
        this.closePopup();        
        this.loader.stop();
        this.toastr.error(errResponse.message);
      }
    );
  }
  getGenralSetting_List() {
    let reqData ={
      role:"doctor"
    }
    this.superAdminServcie.getGeneralSetting(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);      
      if(response.status){  
        response?.body.map((ele)=>{
          if(ele?.settingName === 'callButtonEnable'){
            this.callButtonEnable = ele?.settingValue;       
          }else{
            this.showCallButtonNow = ele?.enableCallButton;            
          }
        })
      }
    });
  }
  onSelect2ChangePatient(event: any): void {
    this.loader.start()
    if (!event?.value || !event?.options?.length) return;

    const selectedOption = event?.options?.[0];

    this.selectedPatient = selectedOption?.label ?? "";
    this.selectedPatientId = selectedOption?.value ?? ""

    if (this.paginator) {
      this.paginator.firstPage();
  }
  if(this.selectedPatientId){
    this.getAppointmentlist()
    this.loader.stop()
  }
  }
  clearSelect2() {     
    this.loader.start()
    this.selectedPatient = '';
    this.selectedPatientId = '';
    this.getAppointmentlist();
    this.loader.stop()
  }
  getAllPatientList(): void {
    if (!this.allDoctorIds) {
      return;
    }
    let reqData = {
      doctorId:this.allDoctorIds,
      page: 1,
      limit: 0,
    };
    this.doctorService
      .getPatientListAddedByDoctor(reqData)
      .subscribe(async (res) => {
        let response = await this.coreService.decryptObjectData({ data: res });     
        if (response.status) {
          this.userList = [];
          const arr = response?.body?.result;
          arr.map((curentval: any) => {
            this.userList.push({
              label : curentval?.fullName + (curentval?.mrn_number ? ` (${curentval.mrn_number})` : ''),
              value: curentval?.portalUserId,
            });
          });
        }
      });
  }

  get callButtonTooltip(): string {
    return Number(this.callButtonEnable) === 0
      ? 'Button will be enabled at the consultation start time.'
      : `Button will be enabled ${this.callButtonEnable} minutes before the consultation start time.`;
  }
  
  
  
}