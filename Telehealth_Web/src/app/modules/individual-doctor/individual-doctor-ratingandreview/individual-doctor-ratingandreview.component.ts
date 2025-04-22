import { Component, OnInit, ViewEncapsulation, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { NgbRatingConfig } from '@ng-bootstrap/ng-bootstrap';
import { IndiviualDoctorService } from "../indiviual-doctor.service";
import { CoreService } from "src/app/shared/core.service";
import { SlicePipe } from "@angular/common";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { Router } from "@angular/router";
export interface PeriodicElement {
  patientname: string;
  dateandtime: string;
  review: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    patientname: "Darrell Steward",
    dateandtime: "08-21-2022 | 03:50Pm",
    review:
      "Lorem Ipsum is simply dummy text of the printing and typesetting...",
  },
];

@Component({
  selector: "app-individual-doctor-ratingandreview",
  templateUrl: "./individual-doctor-ratingandreview.component.html",
  styleUrls: ["./individual-doctor-ratingandreview.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class IndividualDoctorRatingandreviewComponent implements OnInit {

  displayedColumns: string[] = [
    "dateandtime",
    "review",
    "rating",
  ];
  dataSource: any = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  docotrId: any = "";
  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;
  selectedReview: any = "";
  reviewId: any = "";

  currentRate: number = 0;
  comment: any = "";

  for_hospitalIds: any = [];

  hospitalList: any = [];
  isSubmitted: boolean = false;
  doctorRating_Reviwe: any = []

  sortColumn: string = 'createdAt:-1';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';
  userRole: any;
  innerMenuPremission: any = [];
  currentUrl : any = []
  constructor(
    config: NgbRatingConfig,
    private modalService: NgbModal,
    private service: IndiviualDoctorService,
    private coreService: CoreService,
    private slicePipe: SlicePipe,
    private fb: FormBuilder,
    private loader: NgxUiLoaderService,
    private router : Router,
    private services: IndiviualDoctorService

  ) {

    let loginData = JSON.parse(localStorage.getItem("loginData"));
    let adminData = JSON.parse(localStorage.getItem("adminData"));

    this.docotrId = loginData?._id;




    config.max = 5;

  }

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortIconClass = this.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.getAllRatingReviews(`${column}:${this.sortOrder}`);
    // this.getAllRatingReviewsbypatients(`${column}:${this.sortOrder}`);


  }

  ngOnInit(): void {


    this.getAllRatingReviews(`${this.sortColumn}:${this.sortOrder}`);

    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 2000);
    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl)
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
          console.log(`does not exist in the object.`);
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
    if (this.userRole === "INDIVIDUAL_DOCTOR_STAFF" || this.userRole === "HOSPITAL_STAFF") {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    } else {
      return true;
    }


  }

  getAllRatingReviews(sort: any = '') {

    let reqData = {
      doctorId: this.docotrId,
      page: this.page,
      limit: this.pageSize,
      sort: sort
    };

    this.service.getDoctorReviweAndRating(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });      
      if (response.status) {
        this.dataSource = response?.body?.ratingArray;
        this.totalLength = response?.body?.totalCount;
      }
    });


  }



  getAllRatingReviewsbypatients(sort: any = '') {
    let reqData = {
      portal_user_id: this.docotrId,
      page: this.page,
      limit: this.pageSize,
      reviewBy: "patient",
      sort: sort
    };

    this.service.getDoctorReviweAndRating(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.doctorRating_Reviwe = response?.body?.ratingArray;
        this.totalLength = response?.body?.totalCount;
      }
    });
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllRatingReviews();
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

  //delete popup
  openVerticallyCenteredsecond(deletePopup: any, reviewId: any) {
    this.reviewId = reviewId;
    this.modalService.open(deletePopup, { centered: true, size: "sm" });
  }

  //review model
  openVerticallyCenteredreview(reviewcontent: any, review) {
    this.selectedReview = review;
    this.modalService.open(reviewcontent, {
      centered: true,
      size: "md",
      windowClass: "review",
    });
  }

  deleteReviewAndRating() {
    let reqData = {
      _id: this.reviewId,
    };
    this.loader.start()
    this.service.deleteRatingAndReview(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      if (response.status) {
        this.loader.stop();
        this.coreService.showSuccess(response.message, "");
        this.modalService.dismissAll("");
        this.getAllRatingReviews();
        // this.getAllRatingReviewsbypatients();
      }
    });
  }

  handelReviweRating(data: any) {
    if (data.comment) {
      this.comment = data.comment.target.value;
    }
  }


  closePopup() {
    this.modalService.dismissAll("close");
  }
  tabFor: any = "REQUESTS";

  onTabChange(tab: string) {
    this.tabFor = tab;
  }
  adjustRatingStar(rating) {
    let roundedNum = Math.floor(rating);
    return roundedNum;
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
