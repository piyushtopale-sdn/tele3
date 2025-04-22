import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  Input,
  Output,
  EventEmitter,
} from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { PatientService } from "src/app/modules/patient/patient.service";
import { CoreService } from "src/app/shared/core.service";
import { ActivatedRoute, Router } from "@angular/router";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { IndiviualDoctorService } from "../../../indiviual-doctor.service";


@Component({
  selector: "app-medicine",
  templateUrl: "./medicine.component.html",
  styleUrls: ["./medicine.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class MedicineComponent implements OnInit {
  @Input() fromParent: any;
  @Output() refreshDetails = new EventEmitter<string>();
  @Input() appointmentId: any;
  // Current Medication Table
  displayedColumns: string[] = [
    "medicinename",
    "dose",
    "doseunit",
    "routeofadminst",
    "quantity",
    "fequency",
    "takefor",
  ];
  page: any = 1;
  pageSize: number = 2;
  totalLength: number = 0;
  doctorName: any;
  res_details: any;
  userRole: any;

  constructor(
    private indiviualDoctorService: IndiviualDoctorService,
    private coreService: CoreService,
    private router: Router
  ) {
    let loginData = JSON.parse(localStorage.getItem('loginData'))
    this.userRole = loginData?.role;
  }

  ngOnInit(): void {
    this.getAllEprescriptionsTests();
  }


  getAllEprescriptionsTests() {
    let reqData = {
      appointmentId: this.appointmentId,
      limit: this.pageSize,
      page: this.page
    };
    this.indiviualDoctorService
      .getAllEprescriptionTests(reqData)
      .subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.res_details = response?.body?.result;          
          this.totalLength = response?.body?.totalRecords;
        }
      });
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllEprescriptionsTests();
  }

  routeTo() {
    this.router.navigate([`/individual-doctor/eprescription/eprescriptionmedicine`], {
      queryParams: {
        appointmentId: this.appointmentId
      }
    })
  }
}
