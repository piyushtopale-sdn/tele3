import { Component, OnInit, ViewEncapsulation, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  FormControl,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { IndiviualDoctorService } from "../indiviual-doctor.service";
import { CoreService } from "src/app/shared/core.service";
import { DatePipe } from "@angular/common";
import { NgxUiLoaderService } from "ngx-ui-loader";
// Staff leave data
export interface PeriodicElement {
  staffname: string;
  leavetype: string;
  leavereason: string;
  fromdate: string;
  todate: string;
  comment: string;
}
const ELEMENT_DATA: PeriodicElement[] = [
  {
    staffname: "Ralph Edwards",
    leavetype: "Sick Leave",
    leavereason: "Not well",
    fromdate: "22 Oct, 2020",
    todate: "17 Oct, 2022",
    comment:
      "consectetur adipiscing elit duis tristique sollicitudin nibh sit amet commodo nulla facilisi nullam vehicula ipsum",
  },
  {
    staffname: "Ralph Edwards",
    leavetype: "Sick Leave",
    leavereason: "Not well",
    fromdate: "22 Oct, 2020",
    todate: "17 Oct, 2022",
    comment:
      "consectetur adipiscing elit duis tristique sollicitudin nibh sit amet commodo nulla facilisi nullam vehicula ipsum",
  },
  {
    staffname: "Ralph Edwards",
    leavetype: "Sick Leave",
    leavereason: "Not well",
    fromdate: "22 Oct, 2020",
    todate: "17 Oct, 2022",
    comment:
      "consectetur adipiscing elit duis tristique sollicitudin nibh sit amet commodo nulla facilisi nullam vehicula ipsum",
  },
];

// my leave data
export interface MyleavePeriodicElement {
  name: string;
  leavetype: string;
  leavereason: string;
  fromdate: string;
  todate: string;
  comment: string;
}

const MYLEAVE_ELEMENT_DATA: MyleavePeriodicElement[] = [
  {
    name: "Dr. Ralph Edwards",
    leavetype: "Medical Leave",
    leavereason: "Dentist appointment",
    fromdate: "22 Oct, 2020",
    todate: "17 Oct, 2022",
    comment:
      "consectetur adipiscing elit duis tristique sollicitudin nibh sit amet commodo nulla facilisi nullam vehicula ipsum",
  },
  {
    name: "Dr. Ralph Edwards",
    leavetype: "Medical Leave",
    leavereason: "Dentist appointment",
    fromdate: "22 Oct, 2020",
    todate: "17 Oct, 2022",
    comment:
      "consectetur adipiscing elit duis tristique sollicitudin nibh sit amet commodo nulla facilisi nullam vehicula ipsum",
  },
  {
    name: "Dr. Ralph Edwards",
    leavetype: "Medical Leave",
    leavereason: "Dentist appointment",
    fromdate: "22 Oct, 2020",
    todate: "17 Oct, 2022",
    comment:
      "consectetur adipiscing elit duis tristique sollicitudin nibh sit amet commodo nulla facilisi nullam vehicula ipsum",
  },
];

@Component({
  selector: "app-individual-doctor-leaves",
  templateUrl: "./individual-doctor-leaves.component.html",
  styleUrls: ["./individual-doctor-leaves.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class IndividualDoctorLeavesComponent implements OnInit {
  // Staff leave data
  displayedColumns: string[] = [
    // "staffName",
    "createdAt",
    "fromdate",
    "todate",
    "comment",
    // "leave_typeId",
    "leavereason",
    // "status",
    "action",
  ];
  // dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);

  // my leave data
  myleavedisplayedColumns: string[] = [
   "staffName",
   "createdAt",
   "fromdate",
   "todate",
   "comment",
   "leavereason",
   "action",
  ];
  myleavedataSource = new MatTableDataSource<MyleavePeriodicElement>(
    MYLEAVE_ELEMENT_DATA
  );

  @ViewChild(MatPaginator) paginator: MatPaginator;
  addLeaveDetails!: FormGroup;
  editLeaveDetails!: FormGroup;
  isSubmitted: any = false;
  userID: any;
  searchKey: any = "";
  searchWithDate: any = "";
  page: any = 1;
  pageSize: number = 5;
  totalLength: number = 0;
  page1: any = 1;
  pageSize1: number = 5;
  dataSource: any = [];
  dataDoctorstaffSource: any = [];
  dataStaffListSource: any = [];
  leaveType: any = "";
  startDateFilter: any = "";
  endDateFilter: any = "";
  dateFilter: any = "";
  maxDate = new Date();
  minDate = new Date();
  hospitalIds: any;
  hospitallist: any[] = [];
  profileId: any;
  staffHospitalId: void;
  role: any;
  activetab: any;
  leave_typeId: any = "";
  sortColumn: string = 'leave_typeId';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';

  sortColumnStaff: string = 'StaffData.name';
  sortOrderStaff: 1 | -1 = 1;
  sortIconClassStaff: string = 'arrow_upward';
  totalLength1: any;
  leaveTypeListing: any[] = [];
  showDesign: boolean = false;
  overlay: false;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.myleavedataSource.paginator = this.paginator;
  }

  selectedOption: string;
  selectedOptions: string;
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private individualService: IndiviualDoctorService,
    private _coreService: CoreService,
    private datePipe: DatePipe,
    private loader: NgxUiLoaderService
  ) {
    const userData = this._coreService.getLocalStorage("loginData");
    this.role = userData?.role;
    this.userID = userData?._id;
    const hospitalData = this._coreService.getLocalStorage("adminData");
    this.hospitalIds = hospitalData?.for_hospitalIds;
    const profileData = this._coreService.getLocalStorage("adminData");
    this.profileId = profileData?._id;
    const individualDoctorStaff =
      this._coreService.getLocalStorage("adminData");
    this.staffHospitalId = individualDoctorStaff.in_hospital;
    
    this.editLeaveDetails = this.fb.group({
      _id: [""],
      leave_typeId: ["", [Validators.required]],
      subject: ["", [Validators.required]],
      reason: ["", [Validators.required]],
      from_date: ["", [Validators.required]],
      to_date: ["", [Validators.required]],
      // sent_to: [""],
      created_by: [""],
      for_user: [""],
    });

    this.addLeaveDetails = this.fb.group({
      leave_typeId: ["", [Validators.required]],
      subject: ["", [Validators.required]],
      reason: ["", [Validators.required]],
      from_date: ["", [Validators.required]],
      to_date: ["", [Validators.required]],
      sent_to: [""],
      created_by: [""],
      for_user: [""],
    });

  }

  get f() {
    return this.addLeaveDetails.controls;
  }

  //  Add Leave modal
  openVerticallyCenterednewinvite(newinvitecontent: any) {
    this.modalService.open(newinvitecontent, {
      centered: true,
      size: "lg",
      windowClass: "add_leave",
    });
  }
  myFilters = (d: Date | null): boolean => {
    const today = new Date(); // Get the current date
    today.setHours(0, 0, 0, 0); // Set the time to midnight

    // If the date is before today, hide it
    return d >= today;
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

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortIconClass = this.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.getDoctorLeaveList(`${column}:${this.sortOrder}`);
    this.getAllDoctorStaffleaveList();
    this.getAllStaffLeaveList_In_Doctor();
  }

  onSortDataStaff(column: any) {
    this.sortColumnStaff = column;
    this.sortOrderStaff = this.sortOrderStaff === 1 ? -1 : 1;
    this.sortIconClassStaff = this.sortOrderStaff === 1 ? 'arrow_upward' : 'arrow_downward';
  }

  ngOnInit(): void {
    this.getAllLeaveType()
    this.getAllDoctorStaffleaveList()
  }
  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  handleAddLeave() {
    this.isSubmitted = true;
    if (this.addLeaveDetails.invalid) {
      return;
    }
    this.isSubmitted = false;
    this.loader.start();
    const originalDate = this.addLeaveDetails.value.from_date;
    const newDate = new Date(originalDate);
    const fromDate = this.datePipe.transform(newDate, "yyyy-MM-dd");

    const originalDate1 = this.addLeaveDetails.value.to_date;
    const newDate1 = new Date(originalDate1);
    const toDate = this.datePipe.transform(newDate1, "yyyy-MM-dd");
    let reqData = {
      leave_typeId: this.addLeaveDetails.value.leave_typeId,
      subject: this.addLeaveDetails.value.subject,
      reason: this.addLeaveDetails.value.reason,
      from_date: fromDate,
      to_date: toDate,
      created_by: this.userID,
      for_user: this.profileId,
      // sent_to: this.addLeaveDetails.value.sent_to,
      role_type: this.role
    };

    this.individualService.addleave(reqData).subscribe(
      (res) => {
        try {
          let data = this._coreService.decryptObjectData({ data: res });
          if (data.status === true) {
            this.loader.stop();
            this.modalService.dismissAll();
            this.getAllDoctorStaffleaveList();
            this.addLeaveDetails.reset();
            this._coreService.showSuccess(data.message, "");
          }
        } catch (error) {
          this._coreService.showError("", "Not added");
          this.loader.stop();
        }
      },
      (err: Error) => {
        alert(err.message);
        this.loader.stop();
      }
    );
  }

  getAllDoctorStaffleaveList() {
    
    const params = {
      created_by: this.userID,
      page: this.page,
      limit: this.pageSize,
      fromDate: this.startDateFilter,
      toDate: this.endDateFilter,
      leaveType: this.leaveType ? this.leaveType : ""
    };
     
    this.individualService.doctorStaffleaveList(params).subscribe((res) => {
      let data = this._coreService.decryptObjectData({ data: res });
      this.dataDoctorstaffSource = data?.body?.listdata;
      this.totalLength = data?.body?.totalRecords;
    });

    this.showDesign = false;
  }

  getAllStaffLeaveList_In_Doctor() {
    const params = {
      page: this.page,
      limit: this.pageSize,
      searchKey: this.searchKey,
      fromDate: this.startDateFilter,
      toDate: this.endDateFilter,
      doctorId: this.userID,
      leave_typeId: this.leave_typeId ? this.leave_typeId : ""
    };
    
    this.individualService.allStaff_Leave_List_in_doctor(params).subscribe((res) => {
      let data = this._coreService.decryptObjectData({ data: res });
      this.dataDoctorstaffSource = data?.body?.listdata;
      this.totalLength = data?.body?.totalRecords;

      this.showDesign = true;
    });
  }

  getDoctorLeaveList(sort: any = '') {
    if (this.role === "INDIVIDUAL_DOCTOR") {
      const params = {
        for_portal_user: this.userID,
        page: this.page,
        limit: this.pageSize,
        searchKey: this.searchKey,
        createdDate: this.startDateFilter,
        updatedDate: this.endDateFilter,
        sort: sort
      };
      this.individualService.myLeaveList(params).subscribe((res) => {
        let data = this._coreService.decryptObjectData({ data: res });
        this.dataSource = data?.body?.listdata;
        this.totalLength1 = data?.body?.totalRecords;
      });
    }

  }

  getAllLeaveType(sort: any = '') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      sort: sort
    };
    this.individualService.leaveTypeList(reqData).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      let allLeaveType = response?.body?.data;
      allLeaveType.map((leave) => {
        this.leaveTypeListing.push(
          {
            label: leave.leave_type,
            value: leave._id
          }
        )
      })
    });
  }

  handleSearchCategory(event: any, filter: any) {
    if (event.value != undefined) {
      if (filter === "leave") {
        this.leaveType = event.value;
      } 
      this.getAllDoctorStaffleaveList();
    }
  }

  handleSearchCategoryStaff(event: any, filter: any) {
    if (event.value !== undefined) {
      if (filter === "leaves") {
        this.leave_typeId = event.value;
      } 
      this.getAllStaffLeaveList_In_Doctor();
    }
  }

  openEditPopup(editmodal: any, data: any) {
    this.editLeaveDetails.patchValue({
      _id: data._id,
      leave_typeId: data.leave_typeId,
      subject: data.subject,
      reason: data.reason,
      from_date: data.from_date,
      to_date: data.to_date,
      created_by: data.created_by,
      // sent_to: data.sent_to,
      for_user: data.for_user
    });

    this.modalService.open(editmodal, { centered: true, size: "" });
  }

  updateLeave() {
    this.isSubmitted = true;
    if (this.editLeaveDetails.invalid) {
      return;
    }
    this.isSubmitted = false;
    this.loader.start();

    const leaveId = this.editLeaveDetails.value._id;

    this.individualService.updateStaffLeave(leaveId, this.editLeaveDetails.value).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });

      if (response.status) {
        this.loader.stop();
        this.modalService.dismissAll();
        this.getAllDoctorStaffleaveList();
        this._coreService.showSuccess(response.message, "");
      } else {
        this._coreService.showError("", "Not edit");
        this.loader.stop();
      }
    });
  }

  handleSearch(event: any) {
    if (this.activetab == 0) {
      this.searchKey = event.target.value;
      this.getAllStaffLeaveList_In_Doctor();
    } else if (this.activetab == 1) {
      this.searchKey = event.target.value;
      this.getDoctorLeaveList();
      this.getAllDoctorStaffleaveList();
    }
  }

  handlePageDoctorStaffEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllDoctorStaffleaveList();
  }

  handleSelectStartDateFilter(event: any) {
    const originalDate = new Date(event.value);
    this.startDateFilter = originalDate.toISOString().split('T')[0]; // Keep only the date part
    this.getAllDoctorStaffleaveList();
  }

  // handleSelectStartDateFilter(event: any) {
  //   if (this.activetab == 0) {
  //     const originalDate = new Date(event.value);
  //     this.extendDateFormat(originalDate);
  //     const formattedDate = originalDate.toISOString();

  //     this.startDateFilter = formattedDate;
  //     const inputDate = new Date(formattedDate);
  //     const nextDate = inputDate.setHours(23, 59, 59, 59);
  //     this.endDateFilter = new Date(nextDate).toISOString();
  //     this.getAllStaffLeaveList_In_Doctor();
  //   } else if (this.activetab == 1) {
  //     const originalDate = new Date(event.value);
  //     this.extendDateFormat(originalDate);
  //     const formattedDate = originalDate.toISOString();

  //     this.startDateFilter = formattedDate;
  //     const inputDate = new Date(formattedDate);
  //     const nextDate = inputDate.setHours(23, 59, 59, 59);
  //     this.endDateFilter = new Date(nextDate).toISOString();
  //     this.getDoctorLeaveList();
  //   }

  // }

  handleSelectEndDateFilter(event: any) {
    const originalDate = new Date(event.value);
    const endDate = new Date(originalDate);
    endDate.setHours(23, 59, 59, 999); // Set to the end of the day
    this.endDateFilter = endDate.toISOString().split('T')[0]; // Keep only the date part
    this.getAllDoctorStaffleaveList();
  }

  clearFilter() {
    this.leaveType = "";
    this.startDateFilter = "";
    this.endDateFilter = "";
    this.getAllDoctorStaffleaveList();
  }

  clearFilterSatff() {
    this.leave_typeId = "";
    this.searchKey = "",
    this.getAllStaffLeaveList_In_Doctor();
  }

  handleSearch1(event: any) {
    this.searchKey = event.target.value;
    this.getAllStaffLeaveList_In_Doctor();
  }

  extendDateFormat(mydate) {
    mydate.setHours(mydate.getHours() + 5); // Add 5 hours
    mydate.setMinutes(mydate.getMinutes() + 30);
    return mydate;
  }


  openVerticallyCenteredsecond(element: any) {
    let reqData = {
      _id: element?._id,
      status: "1"
    }
    // this.isSubmitted = false;
    this.individualService.leaveAccept(reqData).subscribe(
      (res) => {
        try {
          let data = this._coreService.decryptObjectData({ data: res });
          if (data.status === true) {
            this.getAllStaffLeaveList_In_Doctor();
            this._coreService.showSuccess(data.message, "");
          }
        } catch (error) {
          this._coreService.showError("", "Not added")
        }
      },
      (err: Error) => {
        alert(err.message);
      }
    );
  }

  handlestaffLeavelist(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllStaffLeaveList_In_Doctor();
  }

  openVerticallyCenteredseconds(element: any) {
    let reqData = {
      _id: element?._id,
      status: "2"
    }
    // this.isSubmitted = false;
    this.individualService.leaveReject(reqData).subscribe(
      (res) => {
        try {
          let data = this._coreService.decryptObjectData({ data: res });
          if (data.status === true) {
            this.getAllStaffLeaveList_In_Doctor();
            this._coreService.showSuccess(data.message, "");
          }
        } catch (error) {
          this._coreService.showError("", "Not added")
        }
      },
      (err: Error) => {
        alert(err.message);
      }
    );
  }

  selectedTab(event: any) {
    this.activetab = event.index
  }
}
