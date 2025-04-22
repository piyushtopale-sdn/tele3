import { SlicePipe } from "@angular/common";
import { Component, OnInit, ViewEncapsulation, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { NgbRatingConfig } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "src/app/shared/core.service";
import { PharmacyService } from "../pharmacy.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
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
  selector: "app-pharmacy-ratingandreview",
  templateUrl: "./pharmacy-ratingandreview.component.html",
  styleUrls: ["./pharmacy-ratingandreview.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PharmacyRatingandreviewComponent implements OnInit {
  displayedColumns: string[] = [
    "dateandtime",
    "review",
    "rating"
  ];
  dataSource: any = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;

  pharmacyId: any = "";
  pageSize: number = 5;
  totalLength: number = 0;
  page: any = 1;
  selectedReview: any = "";
  reviewId: any = "";

  sortColumn: string = 'patientName';
  sortOrder: 1 | -1 = 1;
  sortIconClass: string = 'arrow_upward';
  userPermission: any;
  userRole: any;
  innerMenuPremission: any = [];

  constructor(
    config: NgbRatingConfig,
    private modalService: NgbModal,
    private coreService: CoreService,
    private slicePipe: SlicePipe,
    private service :PharmacyService,
    private loader: NgxUiLoaderService

  ) {
    config.max = 1;
    config.readonly = true;

    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.userPermission = this.coreService.getLocalStorage("loginData").permissions;
    this.pharmacyId = loginData?._id;
    this.userRole = loginData?.role

  }

  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1? -1 : 1;
    this.sortIconClass = this.sortOrder === 1? 'arrow_upward' : 'arrow_downward';
    this.getAllRatingReviews(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {
    
    this.getAllRatingReviews(`${this.sortColumn}:${this.sortOrder}`);
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 300);  
  }

  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission(){ 
    let menuID = sessionStorage.getItem("currentPageMenuID");
    let checkData = this.findObjectByKey(this.userPermission, "parent_id",menuID)
    if(checkData){
      if(checkData.isChildKey == true){
        var checkSubmenu = checkData.submenu;     
        if (checkSubmenu.hasOwnProperty("health_plan")) {
          this.innerMenuPremission = checkSubmenu['health_plan'].inner_menu;  
        } else {
        }
      }else{
        var checkSubmenu = checkData.submenu;
        let innerMenu = [];
        for (let key in checkSubmenu) {
          innerMenu.push({name: checkSubmenu[key].name, slug: key, status: true});
        }
        this.innerMenuPremission = innerMenu;
        
      }    
    }     
  }

  giveInnerPermission(value){   
    if(this.userRole === "PHARMACY_STAFF"){
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    }else{
      return true;

    }    
  }


  getAllRatingReviews(sort:any='') {
    let reqData = {
      portal_user_id: this.pharmacyId,
      page: this.page,
      limit: this.pageSize,
      sort:sort
    };

    this.service.getPharmcyRaviweandRating(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.dataSource = response?.body?.ratingArray;
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

  //  Review modal
  openVerticallyCenteredreview(reviewcontent: any,review:any) {
    this.selectedReview = review;
    this.modalService.open(reviewcontent, {
      centered: true,
      size: "md",
      windowClass: "review",
    });
  }

  deleteReviewAndRating() {
    this.loader.start();
    let reqData = {
      _id: this.reviewId,
    };

    this.service.deletePharmcyRaviweandRating(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      if (response.status) {
    this.loader.stop();

        this.coreService.showSuccess(response.message, "");
        this.modalService.dismissAll("");
        this.getAllRatingReviews();
      }
    });
  }

  adjustRatingStar(rating) {
    let roundedNum = Math.floor(rating);
    return roundedNum;
  }
}
