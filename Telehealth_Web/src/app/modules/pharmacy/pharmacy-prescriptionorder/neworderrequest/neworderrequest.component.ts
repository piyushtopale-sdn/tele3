import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { map, Observable, startWith } from "rxjs";
import { IUniqueId } from "src/app/modules/patient/homepage/retailpharmacy/retailpharmacy.type";
import { PatientService } from "src/app/modules/patient/patient.service";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { IResponse } from "src/app/shared/classes/api-response";
import { CoreService } from "src/app/shared/core.service";
import { PharmacyService } from "../../pharmacy.service";
import { Select2UpdateEvent } from "ng-select2-component";
import { NgxUiLoaderService } from "ngx-ui-loader";

@Component({
  selector: "app-neworderrequest",
  templateUrl: "./neworderrequest.component.html",
  styleUrls: ["./neworderrequest.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class NeworderrequestComponent implements OnInit {
  orderId: string = "";
  orderDetails: any;
  patient_details: any;
  userId: any;
  patient_id: any;
  orderStatus: any = 'Pending';

  displayedColumns: string[] = [
    "medicinename",
    "frequency",
    "dose",
    "duration",
    "route",
    "quantityprescribed",

  ];
  dataSource: any[] = [];

  @ViewChild("approved") approved: any;
  userPermission: any;
  userRole: any;
  innerMenuPremission: any = [];
  selectedValue: string;
  showStatus: string;
  previousStatus: any;
  doctorName: any;
  deliveryStatus: any;
  patientProfile: any;

  constructor(
    private modalService: NgbModal,
    private pharmacyService: PharmacyService,
    private patientService: PatientService,
    private coreService: CoreService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private _superAdminService: SuperAdminService,
    private loader: NgxUiLoaderService

  ) {
    let portalUser = this.coreService.getLocalStorage("loginData");

    this.userPermission = portalUser.permissions;

    this.userRole = portalUser.role;
    if (this.userRole === "PHARMACY_STAFF") {
      // this.userId = adminData?.for_staff;
    } else {
      this.userId = portalUser._id;

    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.orderId = params["orderId"];
    });

    this.getOrderDetails();

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



  //  Approved modal
  openVerticallyCenteredapproved(approved: any) {
    this.modalService.open(approved, {
      centered: true,
      size: "md",
      windowClass: "approved_data",
    });
  }

  getOrderDetails(): void {
    this.pharmacyService.orderDetailsById(this.orderId).subscribe({
      next: (result) => {
        let res = this.coreService.decryptObjectData({ data: result });
        if (res.status) {
          let response = res?.data;
          this.patientProfile = response?.patientProfile;
          this.patient_details = response?.patientDetails;
          this.doctorName = response?.doctorName;
          this.orderStatus = response?.status;
          this.deliveryStatus = response?.deliveryStatus;
          let dosageDataArray = [];
          for (let ele of response?.dosageData) {
            let dataObject = {
              createdAt: ele?.createdAt,
              dose: ele?.dose,
              doseUnit: ele?.doseUnit,
              routeOfAdministration: ele?.routeOfAdministration,
              patientId: ele?.patientId,
              orderId: ele?.orderId,
              medicineName: ele?.medicineName,
              medicineId: ele?.medicineId,
              quantity: ele?.quantity,
              frequency: ele?.frequency,
              takeFor: ele?.takeFor
            }
            dosageDataArray.push(dataObject);
          }
          this.dataSource = dosageDataArray;
        }
      },
      error: (err: ErrorEvent) => {
        this.coreService.showError("", err.message);
      },
    });
  }




  gotoOrderList() {
    this.modalService.dismissAll("close");
    this.router.navigate(["/pharmacy/presciptionorder"]);
  }
  handleClose() {
    this.loader.stop();
    this.orderStatus = this.deliveryStatus;
    this.modalService.dismissAll("close");
  }

  onStatusChange(selectedValue: string, statusUpdate: any): void {
    this.selectedValue = selectedValue;
    if (selectedValue === 'completed') {
      this.showStatus = 'completed';
    }

    if (selectedValue === 'under-process') {
      this.showStatus = 'under process';
    }

    if (selectedValue === 'pending') {
      this.showStatus = 'pending';
    }

    this.modalService.open(statusUpdate, {
      centered: true,
      size: "md",
      windowClass: "master_modal add_lab",
    });

  }


  updateOrderStatus() {
    let reqData = {
      orderId: this.orderId,
      status: this.selectedValue

    }
    this.pharmacyService.deliveryOrderStatusUpdate(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.coreService.showSuccess("", response.message);
        this.getOrderDetails();
        this.handleClose();
      } else {
        this.coreService.showError("", response.message);

      }
    })
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

}
