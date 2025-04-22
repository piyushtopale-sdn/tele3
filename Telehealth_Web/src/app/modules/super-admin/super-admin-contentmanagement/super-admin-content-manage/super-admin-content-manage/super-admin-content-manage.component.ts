import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  TemplateRef,
  ChangeDetectorRef,
} from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "src/app/shared/core.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { BreakpointObserver } from "@angular/cdk/layout";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { SuperAdminService } from "../../../super-admin.service";
import { IndiviualDoctorService } from "src/app/modules/individual-doctor/indiviual-doctor.service";
import { MatSelectChange } from "@angular/material/select";
import { MatCheckboxChange } from "@angular/material/checkbox";

export interface PeriodicElement {
  contentname: string;
  type: string;
  slug: string;
  contentapplies: string;
  content: string;
  time: string;
  _id: string;
}

const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: "app-super-admin-content-manage",
  templateUrl: "./super-admin-content-manage.component.html",
  styleUrls: ["./super-admin-content-manage.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class SuperAdminContentManageComponent implements OnInit {
  @ViewChild("notificationModal") notificationModal: TemplateRef<any>;
  contentDetails!: FormGroup;
  notificationsendForm!: FormGroup;
  isSubmitted: any = false;
  pageSize: number = 20;
  totalLength: number = 0;
  page: any = 1;
  searchText = "";
  type = "All";
  sortColumn: string = "content_name";
  sortOrder: 1 | -1 = 1;
  sortIconClass: string = "arrow_upward";
  innerMenuPremission: any = [];
  loginrole: any;
  isPopupVisible: boolean = false;
  patients: any[] = [];
  selectedShareOption: string = "push";
  selectedPatients: any[] = [];
  patientsList: any[] = [];
  filteredPatientsList: any[] = []; //Stores Filtered Patient
  contentid: any = "";

  contentAppliesOptions: { value: string; label: string }[] = [
    { value: "1", label: "Pharmacy" },
    { value: "2", label: "Patient" },
  ];
  displayedColumns: string[] = ["createdAt", "title", "type", "slug", "action"];

  dataSource = ELEMENT_DATA;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  userID: any;
  content_id: any;

  constructor(
    private fb: FormBuilder,
    private _coreService: CoreService,
    private toastr: ToastrService,
    private router: Router,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private patientService: IndiviualDoctorService,
    private modalService: NgbModal,
    private _superAdminService: SuperAdminService,
    private loader: NgxUiLoaderService
  ) {
    const userData = this._coreService.getLocalStorage("loginData");
    this.userID = userData._id;
    this.loginrole = userData.role;
    (this.contentDetails = this.fb.group({
      content_name: ["", [Validators.required]],
      type: ["", [Validators.required]],
      content_applies: [""],
      content: ["", [Validators.required]],
    })),
      (this.notificationsendForm = this.fb.group({
        patients: [[], Validators.required],
        shareVia: [[], Validators.required],
        gender: [["both"]], // Correct way to store an array
        subscription: [["both"]],
        age: [[""]],
      }));
  }

  openVerticallyCenteredsecond(deleteContent: any, id: any) {
    this.content_id = id;
    this.modalService.open(deleteContent, { centered: true, size: "sm" });
  }

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass =
      this.sortOrder === 1 ? "arrow_upward" : "arrow_downward";
    this.getAllContentlist(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {
    this.contentDetails.get("type").valueChanges.subscribe((value) => {
      if (value === "push") {
        this.contentAppliesOptions = [
          { value: "Pharmacy Push", label: "Pharmacy" },
          { value: "Patient Push", label: "Patient" },
        ];
      } else if (value === "in_app") {
        this.contentAppliesOptions = [
          { value: "Pharmacy App", label: "Pharmacy" },
          { value: "Patient App", label: "Patient" },
          { value: "Doctor App", label: "Doctor" },
          { value: "Hospital App", label: "Hospital" },
          { value: "Insurance App", label: "Insurance" },
          { value: "Dental", label: "Dental" },
          { value: "Optical", label: "Optical" },
          {
            value: "Paramedical-Professions",
            label: "Paramedical-Professions",
          },
          { value: "Laboratory-Imaging", label: "Laboratory-Imaging" },
        ];
      }
    });
    this.getAllContentlist(`${this.sortColumn}:${this.sortOrder}`);
  }

  findObjectByKey(array, key, value) {
    return array.find((obj) => obj[key] === value);
  }

  checkInnerPermission() {
    let userPermission =
      this._coreService.getLocalStorage("adminData").permissions;
    if (userPermission) {
      let menuID = sessionStorage.getItem("currentPageMenuID");
      let checkData = this.findObjectByKey(userPermission, "parent_id", menuID);
      if (checkData) {
        if (checkData.isChildKey == true) {
          var checkSubmenu = checkData.submenu;
          if (checkSubmenu.hasOwnProperty("pharmacy")) {
            this.innerMenuPremission = checkSubmenu["pharmacy"].inner_menu;
          } else {
          }
        } else {
          var checkSubmenu = checkData.submenu;
          let innerMenu = [];
          for (let key in checkSubmenu) {
            innerMenu.push({
              name: checkSubmenu[key].name,
              slug: key,
              status: true,
            });
          }
          this.innerMenuPremission = innerMenu;
        }
      }
    }
  }

  giveInnerPermission(value) {
    if (this.loginrole === "STAFF_USER") {
      const checkRequest = this.innerMenuPremission.find(
        (request) => request.slug === value
      );
      return checkRequest ? checkRequest.status : false;
    } else {
      return true;
    }
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

  // closePopup() {
  //   this.modalService.dismissAll("close");
  // }

  handleStatus(event: any) {
    this.type = event;
    this.page = 1;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.getAllContentlist();
  }

  getAllContentlist(sort: any = "") {
    let reqData = {
      searchText: this.searchText,
      sort: sort,
      page: this.page,
      limit: this.pageSize,
      type: this.type,
    };
    this._superAdminService.getContentlist(reqData).subscribe((res) => {
      const response = this._coreService.decryptObjectData({ data: res });

      if (response.status) {
        const data = [];
        for (const ele of response?.body?.contents) {
          data.push({
            title: ele?.title,
            type: ele?.type,
            slug: ele?.slug,
            _id: ele?._id,
            createdAt: ele?.createdAt,
          });
        }

        this.totalLength = response?.body?.totalRecords;
        this.dataSource = data;
      }
    });
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllContentlist();
  }

  handleSearchFilter(event: any) {
    this.searchText = event.target.value;
    this.page = 1;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.getAllContentlist();
  }

  clearFilter() {
    this.searchText = "";
    this.type = "All";
    this.getAllContentlist();
  }

  get f() {
    return this.contentDetails.controls;
  }

  deleteSingleContent() {
    this.loader.start();
    const reqData = {
      _id: this.content_id,
    };

    this._superAdminService.deleteContent(reqData).subscribe({
      next: (res) => {
        const data = this._coreService.decryptObjectData({ data: res });

        if (data?.status) {
          this.toastr.success(data.message);

          this.getAllContentlist();
          this.closePopup();
        } else {
          this.toastr.error(data.message);
        }
        this.loader.stop();
      },
    });
  }

  routeToEdit(id) {
    this.router.navigate([`super-admin/content-management/edit/${id}`]);
  }

  getFormattedType(slug: string): string {
    return slug.replace(/_/g, ' ').toUpperCase();
  }

  openPopup(id: string): void {
    this.contentid = id;

    // Reset form and selected patients before fetching data
    this.notificationsendForm.reset();
    this.selectedPatients = [];

    this.modalService.open(this.notificationModal, {
      centered: true,
      size: "lg",
      windowClass: "master_modal notification_Modal",
    });

    this.getAllPatients();
  }
  ngAfterViewChecked() {
    this.cdr.detectChanges(); // This forces Angular to re-run change detection.
  }

  closePopup(): void {
    this.modalService.dismissAll();
    this.selectedPatients = [];
  }

  // getAllPatients(): void {
  //   let reqData = { page: 1, limit: 0 };

  //   this.patientService.getAllPatientForSuperAdmin(reqData)
  //   .subscribe(async (res) => {
  //       let response = await this._coreService.decryptObjectData({ data: res });

  //       if (response.status) {
  //           this.patients = response.body.data.map((currentVal: any) => ({
  //               id: currentVal?.portalUserId,
  //               name: currentVal?.full_name
  //           }));

  //           this.patientsList = response.body.data.map((currentVal: any) => ({
  //               label: currentVal?.full_name,
  //               value: currentVal?.portalUserId
  //           }));

  //           this.notificationsendForm.patchValue({
  //               patients: this.selectedPatients.map(p => p.id)
  //           });
  //       }
  //   });
  // }

  getAllPatients(): void {
    let reqData = { page: 1, limit: 0 };

    this.patientService
      .getAllPatientForSuperAdminToNotify(reqData)
      .subscribe(async (res) => {
        let response = await this._coreService.decryptObjectData({ data: res });

        if (response.status) {
          this.patients = response.body.data.map((currentVal: any) => ({
            id: currentVal?.portalUserId,
            name:
              currentVal?.full_name +
              (currentVal?.mrn_number ? `(${currentVal.mrn_number}) ` : ""),
          }));

          this.patientsList = response.body.data.map((currentVal: any) => ({
            label:
              currentVal?.full_name +
              (currentVal?.mrn_number ? `(${currentVal.mrn_number}) ` : ""),
            value: currentVal?.portalUserId,
            gender: currentVal?.gender,
            subscriptoinStatus: currentVal?.subscriptionDetails.isPlanActive,
            age: currentVal?.age,
          }));

          this.notificationsendForm.patchValue({
            patients: this.selectedPatients.map((p) => p.id),
          });
        }
      });
  }

  //Filters PatientList on basis of Gender and Subscription status

  filterPatients() {
    let selectedGenders = this.notificationsendForm.get("gender").value || [];
    let selectedSubscriptions =
      this.notificationsendForm.get("subscription").value || [];
    let selectedAges = this.notificationsendForm.get("age").value || [];

    selectedGenders = selectedGenders
      .filter((g) => g !== null && g !== undefined)
      .map((g) => g.toLowerCase().trim());
    selectedSubscriptions = selectedSubscriptions
      .filter((s) => s !== null && s !== undefined)
      .map((s) => s.toLowerCase().trim());

    this.filteredPatientsList = this.patientsList.filter((patient) => {
      const patientGender = patient.gender
        ? String(patient.gender).toLowerCase().trim()
        : "";
      const patientSubscriptionStatus = patient.subscriptoinStatus === true;
      const patientAge = patient.age;

      const genderMatch =
        selectedGenders.includes("both") ||
        selectedGenders.length === 0 ||
        selectedGenders.includes(patientGender);

      const subscriptionMatch =
        selectedSubscriptions.length === 0 ||
        selectedSubscriptions.includes("both") ||
        (selectedSubscriptions.includes("active") &&
          patientSubscriptionStatus === true) ||
        (selectedSubscriptions.includes("inactive") &&
          patientSubscriptionStatus === false);

      // Age Filter
      const ageMatch =
        selectedAges.length === 0 ||
        (selectedAges.includes("0-20") && patientAge <= 20) ||
        (selectedAges.includes("20-40") &&
          patientAge > 20 &&
          patientAge <= 40) ||
        (selectedAges.includes("40-60") &&
          patientAge > 40 &&
          patientAge <= 60) ||
        (selectedAges.includes("60-above") && patientAge > 60);

      return genderMatch && subscriptionMatch && ageMatch;
    });
  }

  //Change Filtered list on gender Selection

  onGenderChange(event: MatCheckboxChange, value: string) {
    let selectedGenders = this.notificationsendForm.get("gender").value || [];
    if (event.checked) {
      if (value === "both") {
        selectedGenders = ["both"];
      } else {
        selectedGenders = selectedGenders.filter((g) => g !== "both");
        selectedGenders.push(value);
      }
    } else {
      selectedGenders = selectedGenders.filter((g) => g !== value);
    }

    if (selectedGenders.length === 0) {
      selectedGenders.push("both");
    }

    this.notificationsendForm.get("gender").setValue([...selectedGenders]);
    this.filterPatients();
  }
  //Change Filtered list on Subscription Status Selection
  onSubscriptionChange(event: MatCheckboxChange, value: string) {
    let selectedSubscriptions =
      this.notificationsendForm.get("subscription").value || [];

    if (event.checked) {
      if (value === "both") {
        selectedSubscriptions = ["both"];
      } else {
        selectedSubscriptions = selectedSubscriptions.filter(
          (s) => s !== "both"
        );
        selectedSubscriptions.push(value);
      }
    } else {
      selectedSubscriptions = selectedSubscriptions.filter((s) => s !== value);
    }

    if (selectedSubscriptions.length === 0) {
      selectedSubscriptions.push("both");
    }

    this.notificationsendForm
      .get("subscription")
      .setValue([...selectedSubscriptions]);
    this.filterPatients();
  }

  onAgeChange(event: MatCheckboxChange, value: string) {
    let selectedAges = this.notificationsendForm.get("age").value || [];

    if (event.checked) {
      selectedAges.push(value);
    } else {
      selectedAges = selectedAges.filter((a) => a !== value);
    }

    this.notificationsendForm.get("age").setValue([...selectedAges]);
    this.filterPatients();
  }

  onShareOptionChange(event: MatSelectChange): void {
    this.selectedShareOption = event.value;
  }

  onPatientSelectionChange(event: any): void {
    this.selectedPatients = event.value;
  }

  onSelectAllPatients(event: MatCheckboxChange) {
    if (event.checked) {
      const allPatientIds = this.filteredPatientsList.map(patient => patient.value);
      this.notificationsendForm.get('patients').setValue(allPatientIds);
    } else {
      this.notificationsendForm.get('patients').setValue([]);
    }
  }
  
  areAllPatientsSelected(): boolean {
    const selectedPatients = this.notificationsendForm.get('patients').value || [];
    return selectedPatients.length > 0 && selectedPatients.length === this.filteredPatientsList.length;
  }
  

  submitSelection() {
    this.isSubmitted = true;

    if (this.notificationsendForm.invalid) {
      return;
    }

    let reqData = {
      sharevia: this.notificationsendForm.value.shareVia,
      patientids: this.notificationsendForm.value.patients,
      contentid: this.contentid,
    };
    this.loader.start();
    this._superAdminService.sendNotificationApi(reqData).subscribe(
      (res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);

        this.loader.stop();

        if (response.status) {
          this.toastr.success(response.message);
          this.notificationsendForm.reset();
          this.selectedPatients = [];
          this.closePopup();
        } else {
          this.toastr.error(response.message);
        }
      },
      (error) => {
        this.loader.stop();
        console.error("API Error:", error);
        this.toastr.error("Something went wrong!");
      }
    );
  }
}
