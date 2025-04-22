import { Component, OnInit, ViewEncapsulation, ViewChild } from "@angular/core";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { MatTabGroup } from "@angular/material/tabs";
import { Router } from "@angular/router";
import { IResponse } from "src/app/shared/classes/api-response";
import { CoreService } from "src/app/shared/core.service";
import { PharmacyService } from "../../pharmacy.service";
;
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { IndiviualDoctorService } from "src/app/modules/individual-doctor/indiviual-doctor.service";

@Component({
  selector: "app-prescriptionorder",
  templateUrl: "./prescriptionorder.component.html",
  styleUrls: ["./prescriptionorder.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PrescriptionorderComponent implements OnInit {
  //  New order table
  neworderdisplayedColumns: string[] = [
    "patientname",
    "prescribeBy",
    "order_id",
    "dateandtime",
    "status",
    "deliveryType",
    // "deliveryPickupStatus",
    "action",
  ];
  dataSource: any[] = [];
  pageSize: number = 5;
  totalLength: number = 0;
  page: number = 1;
  startDate: string = null;
  endDate: string = null;
  dateFilter: any = "";
  selectedStatus: any = "";
  userPermission: any;
  userRole: any;
  innerMenuPremission: any;
  userID: string = "";
  orderId: any;
  orderStatus: any;
  currentUrl : any =[]

  constructor(
    private pharmacyService: PharmacyService,
    private coreService: CoreService,
    private router: Router,
    private modalService: NgbModal,
    private services: IndiviualDoctorService,


  ) {
    let userData = this.coreService.getLocalStorage('loginData')
    let adminData = JSON.parse(localStorage.getItem("adminData"));

    this.userPermission = userData.permissions;
    this.userRole = userData.role;

    if (this.userRole === "PHARMACY_STAFF") {
      this.userID = adminData?.for_staff;
    } else {
      this.userID = userData?._id;
    }
  }

  sortColumn: string = 'createdAt';
  sortOrder: 1 | -1 = -1;
  sortIconClass: string = 'arrow_upward';

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    // this.getOrderList(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {
    this.getOrderList();
    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl)

  }

  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission() {
    let menuID = sessionStorage.getItem("currentPageMenuID");
    let checkData = this.findObjectByKey(this.userPermission, "parent_id", menuID)
    if (checkData) {
      if (checkData.isChildKey == true) {
        var checkSubmenu = checkData.submenu;
        if (checkSubmenu.hasOwnProperty("order_request")) {
          this.innerMenuPremission = checkSubmenu['order_request'].inner_menu;
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
    if (this.userRole === "PHARMACY_STAFF") {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    } else {
      return true;

    }
  }

  public handlePageEvent(data: { pageIndex: number; pageSize: number }): void {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getOrderList();
  }


  handleSelectFliterList(event: any) {
    this.selectedStatus = event.value;
    this.getOrderList();
  }


  getOrderList() {
    let reqdata = {
      page: this.page,
      limit: this.pageSize,
      pharmacyId: this.userID,
      status: [this.selectedStatus]
    };
    this.pharmacyService.orderList(reqdata).subscribe({
      next: (result) => {
        let res = this.coreService.decryptObjectData({ data: result });
        if (res.status) {
          this.dataSource = res?.data?.data;
          this.totalLength = res.data.totalRecords;
        }
        this.dataSource = this.dataSource.map(element => {
          // If the status is not defined, set it to 'Pending' by default
          if (!element.deliveryPickupStatus) {
            element.deliveryPickupStatus = 'Pending';
          }
          return element;
        });
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
      },
    });
  }

  //  Reject modal
  openVerticallyCenteredrejectappointment(reject: any, orderId: any) {
    this.orderId = orderId;
    this.modalService.open(reject, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
    });
  }

  openVerticallyCenteredcancelorder(cancelOrder: any) {
    this.modalService.open(cancelOrder, {
      centered: true,
      size: "lg",
      windowClass: "cancel_appointment",
    });
  }

  //  Approved modal
  openVerticallyCenteredapproved(approved: any, orderId: any) {
    this.orderId = orderId;
    this.modalService.open(approved, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
    });
  }

  handleOrderClick(orderId: any): void {
    this.router.navigate(["/pharmacy/presciptionorder/neworderrequest"], {
      queryParams: { orderId: orderId },
    });
  }

  acceptRejectOrder(status: any, reason: any) {
    let reqdata = {
      orderId: this.orderId,
      cancelReason: reason,
      status: status
    };
    this.pharmacyService.orderAcceptRejectApi(reqdata).subscribe({
      next: (result) => {
        let res = this.coreService.decryptObjectData({ data: result });
        if (res.status) {
          this.coreService.showSuccess("", res.message);
        } else {
          this.coreService.showError("", res.message);
        }
        this.closePopup();
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
      },
    });
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.getOrderList();
  }
  onNavigate(url:any): void {
    const menuitems = JSON.parse(localStorage.getItem('activeMenu'))
     this.currentUrl = url
   
    const matchedMenu = menuitems.find(menu => menu.route_path === this.currentUrl);
    this.router.navigate([url]).then(() => {
      
      this.services.setActiveMenu(matchedMenu?.name);
    });
   
  }
}
