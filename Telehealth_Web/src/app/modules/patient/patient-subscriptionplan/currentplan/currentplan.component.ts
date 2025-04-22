import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { PatientService } from "../../patient.service";
import { CoreService } from "src/app/shared/core.service";

export interface PeriodicElement {
  purchasedate: string;
  subscriptionplanname: string;
  invoiceno: number;
  planprice: string;
  plantype: string;
  expirydate: string;
  status: string;
  action: string;
  id: string;
  services:string;
}

const ELEMENT_DATA: PeriodicElement[] = [];
@Component({
  selector: "app-currentplan",
  templateUrl: "./currentplan.component.html",
  styleUrls: ["./currentplan.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class CurrentplanComponent implements OnInit {
  displayedColumns: string[] = [
    "purchasedate",
    "subscriptionplanname",
    // "features",
    "invoiceno",
    "planprice",
    "plantype",
    "expirydate",
    "status",
    // "action",
  ];
  dataSource = ELEMENT_DATA;
  localStorageUserData: any;
  // globalStatus: any = "expired";
  patientId: any = "";
  isPlanActive: boolean = false;
  page: any = 1;
  pageSize: number = 5;
  totalLength: number = 0;

  constructor(
    private service: PatientService,
    private coreService: CoreService
  ) {}


  sortColumn: string = 'createdAt';
  sortOrder: 1 | -1 = -1;
  sortIconClass: string = 'arrow_upward';

  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.getSubscriptionPlan(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.patientId = loginData?._id;

    this.getSubscriptionPlan(`${this.sortColumn}:${this.sortOrder}`);
  }

  getSubscriptionPlan(sort:any='') {
    let param = {
      page: this.page,
      limit: this.pageSize,
      patientId: this.patientId,
      sort:sort
    };

    this.service.getPurchasedPlanByPatient(param).subscribe({
      next: (res) => {
        let result = this.coreService.decryptContext(res);

        let purData: any = [];
        let getData = (expiry_date: any) => {
          let d = new Date();
          var g1 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          let statusData;
          var g2 = new Date(expiry_date);
          if (g1.getTime() < g2.getTime()) statusData = "active";
          else if (g1.getTime() > g2.getTime()) statusData = "expired";

          // this.globalStatus = statusData;
          return statusData;
        };

        result?.body?.purchasedPlan.forEach((val: any) => {
          if (getData(val.expiry_date) === "active") this.isPlanActive = true;

          purData.push({
            purchasedate: val.createdAt,
            subscriptionplanname: val.subscription_plan_name,
            invoiceno: val.invoice_number,
            planprice: val.plan_price,
            plantype: val.plan_type,
            expirydate: val.expiry_date,
            status: getData(val.expiry_date),
            // action: "",
            id: val._id,
            services:val?.services
          });
        });

        this.dataSource = purData;
        this.totalLength = result?.body?.totalRecords

      },
    });
  }


  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getSubscriptionPlan();
  }
}
