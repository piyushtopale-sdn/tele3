import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { CoreService } from 'src/app/shared/core.service';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { BreakpointObserver } from "@angular/cdk/layout";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import { SuperAdminService } from '../../super-admin.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';

export interface PeriodicElement {
  notificationname: string;
  type: string;
  conditions: string;
  notificationapplies: string;
  content: string;
  time: string;
}

const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: 'app-super-admin-notificationmanagement',
  templateUrl: './super-admin-notificationmanagement.component.html',
  styleUrls: ['./super-admin-notificationmanagement.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SuperAdminNotificationmanagementComponent implements OnInit {
  notificationDetails!: FormGroup;
  isSubmitted: any = false;
  pageSize: number = 20;
  totalLength: number = 0;
  page: any = 1;
  searchText = "";
  type = "all";
  sortColumn: string = 'notification_name';
  sortOrder: 1 | -1 = 1;
  sortIconClass: string = 'arrow_upward';
  innerMenuPremission: any = [];
  loginrole: any;
  // Define the options for the "Notification Applies" dropdown
  notificationAppliesOptions: { value: string; label: string }[] = [
    { value: '1', label: 'Pharmacy' },
    { value: '2', label: 'Patient' },
  ];
  displayedColumns: string[] = ['createdAt', 'title', 'type', 'condition', 'action'];
  // dataSource= new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
  dataSource = ELEMENT_DATA;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  userID: any;
  notification_id: any;

  // ngAfterViewInit() {
  //   this.dataSource.paginator = this.paginator;
  // }


  constructor(private fb: FormBuilder,
    private _coreService: CoreService,
    private toastr: ToastrService,
    private router: Router,
    private datePipe: DatePipe,
    private modalService: NgbModal,
    private _superAdminService: SuperAdminService,
    private loader: NgxUiLoaderService) {

    const userData = this._coreService.getLocalStorage("loginData");
    this.userID = userData._id;
    this.loginrole = userData.role;
    this.notificationDetails = this.fb.group({
      notification_name: ["", [Validators.required]],
      notification_type: ["", [Validators.required]],
      // time: [""],
      notification_applies: [""],
      content: ["", [Validators.required]]
    });
  }

 

 

  openVerticallyCenteredsecond(deleteNotification: any, id: any) {
    this.notification_id = id;
    this.modalService.open(deleteNotification, { centered: true, size: "sm" });
  }

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.getAllNotificationlist(`${column}:${this.sortOrder}`);
  }


  ngOnInit(): void {
    this.notificationDetails.get('notification_type').valueChanges.subscribe((value) => {
      if (value === 'push') {
        this.notificationAppliesOptions = [
          // { value: 'all_push', label: 'All' },
          { value: 'Pharmacy Push', label: 'Pharmacy' },
          { value: 'Patient Push', label: 'Patient' },
        ];
      } else if (value === 'in_app') {
        this.notificationAppliesOptions = [
          // { value: 'all_app', label: 'All' },
          { value: 'Pharmacy App', label: 'Pharmacy' },
          { value: 'Patient App', label: 'Patient' },
          { value: 'Doctor App', label: 'Doctor' },
          { value: 'Hospital App', label: 'Hospital' },
          { value: 'Insurance App', label: 'Insurance' },
          { value: 'Dental', label: 'Dental' },
          { value: 'Optical', label: 'Optical' },
          { value: 'Paramedical-Professions', label: 'Paramedical-Professions' },
          { value: 'Laboratory-Imaging', label: 'Laboratory-Imaging' }
        ];
      }
    });
    this.getAllNotificationlist(`${this.sortColumn}:${this.sortOrder}`);
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 300);
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission() {
    let userPermission = this._coreService.getLocalStorage("adminData").permissions;
    if (userPermission) {
      let menuID = sessionStorage.getItem("currentPageMenuID");
      let checkData = this.findObjectByKey(userPermission, "parent_id", menuID)
      if (checkData) {
        if (checkData.isChildKey == true) {
          var checkSubmenu = checkData.submenu;
          if (checkSubmenu.hasOwnProperty("pharmacy")) {
            this.innerMenuPremission = checkSubmenu['pharmacy'].inner_menu;

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
  }

  giveInnerPermission(value) {
    if (this.loginrole === 'STAFF_USER') {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    } else {
      return true;
    }
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  closePopup() {
    this.modalService.dismissAll("close");
  }

  handleStatus(event: any) {
    this.type = event;
    this.getAllNotificationlist();
  }

  getAllNotificationlist(sort: any = '') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      searchText: this.searchText,
      sort: sort,
      type: this.type
    };
    this._superAdminService.getNotificationlist(reqData).subscribe((res) => {
      const response = this._coreService.decryptObjectData({ data: res });
      if (response.status) {
        const data = [];
        for (const ele of response?.body?.data) {
          data.push({
            title: ele?.notification_title,
            type: ele?.notification_type,
            condition: ele?.condition,
            _id: ele?._id,
            createdAt: ele?.createdAt
          });
        }
        this.totalLength = response.body?.totalRecords;
        this.dataSource = data;
      }
    });
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllNotificationlist();
  }

  handleSearchFilter(event: any) {
    this.searchText = event.target.value.trim();
    this.page = 1;
    this.getAllNotificationlist();
  }

  clearFilter() {
    this.searchText = "",
      this.type = "all";
    this.getAllNotificationlist();
  }

  get f() {
    return this.notificationDetails.controls;
  }

  deleteSingleNotification() {
    this.loader.start();
    const reqData = {
      _id: this.notification_id
    }
    this._superAdminService.deleteNotification(reqData).subscribe((res) => {
      let data = this._coreService.decryptObjectData({ data: res });
      if (data?.status) {
        this.loader.stop();
        this.toastr.success(data.message);
        this.getAllNotificationlist();
        this.closePopup();
      }
    });
  }

  routeToEdit(id){
    this.router.navigate([`super-admin/notification/edit/${id}`])
  }

  getFormattedType(type: string): string {
    return type.replace(/_/g, ' ');
  }
}
