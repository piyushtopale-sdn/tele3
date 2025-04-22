import { Component, OnInit, ViewEncapsulation, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbRatingConfig, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FormGroup, FormBuilder } from "@angular/forms";
import { PatientService } from "../patient.service";
import { CoreService } from "src/app/shared/core.service";
import { SlicePipe } from "@angular/common";

export interface PeriodicElement {
  doctorname: string;
  dateandtime: string;
  hospitalname: string;
  review: string;
  id: Number;
}

@Component({
  selector: "app-patient-ratingandreview",
  templateUrl: "./patient-ratingandreview.component.html",
  styleUrls: ["./patient-ratingandreview.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PatientRatingandreviewComponent implements OnInit {
  ratingForm: FormGroup;


  displayedColumnsDoctor: string[] = [
    "doctorname",
    "dateandtime",
    "hospitalname",
    "review",
    "rating",
    "action",
  ];

  displayedColumnsPharmacy: string[] = [
    "pharmacyname",
    "dateandtime",
    "review",
    "rating",
    "action",
  ];

  displayedColumnslaboratory: string[] = [
    "pharmacyname",
    "dateandtime",
    "review",
    "rating",
    "action",
  ];
  displayedColumnsParamedical: string[] = [
    "pharmacyname",
    "dateandtime",
    "review",
    "rating",
    "action",
  ];

 
  dataSourceDoctor: any = [];
  dataSourcePharmacy: any = [];
  dataSourceFourPortal : any = [];
  tabFor: any = 'DOCTOR';

  selectedReview: any = "";

  sortColumn: string = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';
  sortColumnFourPortal: string = 'name';
  sortOrderFourPortal: 'asc' | 'desc' = 'asc';
  sortIconClassFourPortal: string = 'arrow_upward';

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  patientId: any = "";
  constructor(
    config: NgbRatingConfig,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private service: PatientService,
    private coreService: CoreService,
    private slicePipe: SlicePipe
  ) {
    config.max = 1;
    config.readonly = true;
  }

  onSortData(column: any) {
    
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';

    this.sortIconClass = this.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.getAllRatingReviews(`${column}:${this.sortOrder}`);
  }

  onSortDataFourPortal( type : any , column: any) {
    
    this.sortColumnFourPortal = column;
    this.sortOrderFourPortal = this.sortOrderFourPortal === 'asc' ? 'desc' : 'asc';
    this.sortIconClass = this.sortOrderFourPortal === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.getFourPortalReviews(type,`${column}:${this.sortOrderFourPortal}`);
  }

  ngOnInit(): void {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.patientId = loginData?._id;
    this.getAllRatingReviews(`${this.sortColumn}:${this.sortOrder}`);
  }

  getAllRatingReviews(sort: any = '') {
    let reqData = {
      patientId: this.patientId,
      sort: sort
    };
    this.dataSourceDoctor = []
    let Hospital = []
    this.dataSourcePharmacy = []

    this.service.getAllRatingAndReviews(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      
      this.dataSourceDoctor = response?.body.filter(ele => ele?.role === "INDIVIDUAL_DOCTOR" || ele?.role === "HOSPITAL_DOCTOR")
      this.dataSourcePharmacy = response?.body.filter(ele => ele.role === "PHARMACY_ADMIN")

    });
  }

  getFourPortalReviews(type : any , sort : any = "") {
    let reqData = {
      patientId: this.patientId,
      type : type,
      sort: sort
    };
   
    this.service.getAllFourPortalRatingAndReviews(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      this.dataSourceFourPortal = response?.data
      
    });
  }

  onTabChange(tab: string) {
    this.tabFor = tab;
  }

  dateAndTime(date) {
    const dateTimeString = date;
    const dateTime = new Date(dateTimeString);
    const datee = dateTime.toISOString().split("T")[0];
    const time = dateTime.toISOString().split("T")[1].split(".")[0];

    return { date: datee, time: time };
  }

  trimComment(comment) {
    let trimedComment = this.slicePipe.transform(comment, 0, 50);

    if (comment?.length > 50) {
      return trimedComment + ".....";
    } else {
      return trimedComment;
    }
  }

  // Review_modal
  openVerticallyCenteredreview(reviewcontent: any, review: any = "") {
    this.selectedReview = review;
    this.modalService.open(reviewcontent, {
      centered: true,
      size: "md",
      windowClass: "review",
    });
  }
  adjustRatingStar(rating) {
    let roundedNum = Math.floor(rating);
    return roundedNum;
  }
}
