import { Component, OnInit, ViewEncapsulation, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { NgbRatingConfig } from '@ng-bootstrap/ng-bootstrap';
import { IndiviualDoctorService } from "../../individual-doctor/indiviual-doctor.service";
import { CoreService } from "src/app/shared/core.service";
import { SlicePipe } from "@angular/common";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { FourPortalService } from "../four-portal.service";
import { ActivatedRoute } from "@angular/router";
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
  selector: 'app-four-portal-ratingandreview',
  templateUrl: './four-portal-ratingandreview.component.html',
  styleUrls: ['./four-portal-ratingandreview.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FourPortalRatingandreviewComponent implements OnInit {
 
  displayedColumns: string[] = [
    "dateandtime",
    "review",
    "rating",
  ];
  dataSource: any = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  docotrId: any = "";
  pageSize: number = 5;
  totalLength: number = 0;
  page: any = 1;
  selectedReview: any = "";
  reviewId: any = "";

  currentRate: number = 0;
  comment: any = "";

  hospitalRatingForm: any = FormGroup;
  for_hospitalIds: any = [];

  hospitalList: any = [];
  isSubmitted: boolean = false;
  doctorRating_Reviwe:any=[]

  sortColumn: string = 'patientName.full_name';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';
  userType:any;
  userRole: any;
  innerMenuPremission: any=[];
  tabFor: any = "REQUESTS";

  constructor(
    config: NgbRatingConfig,
    private modalService: NgbModal,
    private service: IndiviualDoctorService,
    private coreService: CoreService,
    private slicePipe: SlicePipe,
    private fb: FormBuilder,
    private fourPortalService : FourPortalService,
    private activatedRoute: ActivatedRoute,
    private loader: NgxUiLoaderService
  ) {
    config.max = 5;
    // config.readonly = true;

    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.userType = loginData?.type;
    let adminData = JSON.parse(localStorage.getItem("adminData"));
    this.for_hospitalIds = adminData?.for_hospitalIds
      ? adminData?.for_hospitalIds
      : [];
    this.docotrId = loginData?._id;
    this.userRole = loginData?.role;

    this.hospitalRatingForm = this.fb.group({
      hospitalId: ["", [Validators.required]],
      rating: [null, Validators.required],
      comment: [""],
    });
  }

  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortIconClass = this.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.getAllRatingReviews(`${column}:${this.sortOrder}`);
  this.getAllRatingReviewsbypatients(`${column}:${this.sortOrder}`);


  }

  ngOnInit(): void {
   

    this.activatedRoute.paramMap.subscribe(params => {
      this.route_type = params.get('path');
    });

  this.getAllRatingReviews(`${this.sortColumn}:${this.sortOrder}`);
  this.getAllRatingReviewsbypatients(`${this.sortColumn}:${this.sortOrder}`);
   

    if (this.for_hospitalIds?.length != 0) {
      this.getHospitalListUnderDoctor();
    }
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 300);
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission(){
    let userPermission = this.coreService.getLocalStorage("loginData").permissions;
    let menuID = sessionStorage.getItem("currentPageMenuID");
    
    let checkData = this.findObjectByKey(userPermission, "parent_id",menuID)
    if(checkData){
      if(checkData.isChildKey == true){
        var checkSubmenu = checkData.submenu;      
        if (checkSubmenu.hasOwnProperty("appointmentreasons")) {
          this.innerMenuPremission = checkSubmenu['appointmentreasons'].inner_menu;
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

  giveInnerPermission(value) {
    if (this.userRole === 'STAFF' || this.userRole === 'HOSPITAL_STAFF') {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    }else {
      return true;
    }
  }
  route_type:any = '';

  getAllRatingReviews(sort:any='') {
   
      let reqData = {
        portal_user_id: this.for_hospitalIds,
        page: this.page,
        limit: this.pageSize,
        reviewBy: this.route_type,
        sort:sort
      };
  
      this.fourPortalService.getPortalReviweAndRating(reqData).subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.dataSource = response?.body?.ratingArray;
          this.totalLength = response?.body?.totalCount;
        }
      });
  }



  getAllRatingReviewsbypatients(sort:any=''){
    let reqData = {
      portal_user_id: this.docotrId,
      page: this.page,
      limit: this.pageSize,
      reviewBy: "patient",
      sort:sort
    };
    
    this.fourPortalService.getPortalReviweAndRating(reqData).subscribe((res) => {
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
    this.loader.start();
    this.fourPortalService.deleteRatingAndReview(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });

      if (response.status) {
        this.loader.stop();
        this.coreService.showSuccess(response.message, "");
        this.modalService.dismissAll("");
        this.getAllRatingReviews();
        this.getAllRatingReviewsbypatients();
      }
    });
  }

  handelReviweRating(data: any) {
    if (data.comment) {
      this.comment = data.comment.target.value;
    }
  }

  postRatingAndReviwe() {
    this.isSubmitted = true;
    if (this.hospitalRatingForm.invalid) {
      return;
    }
    this.isSubmitted = false;
    this.loader.start();
    let pararm = {
      for_portal_user:this.hospitalRatingForm.value.hospitalId,
      patient_login_id: this.docotrId,
      rating: this.currentRate,
      comment: this.comment,
      reviewBy:this.route_type,
      reviewTo: 'hospital',
      portal_type: this.route_type
    };

    this.fourPortalService.fourPortalReviweandRating(pararm).subscribe({
      next: (res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        if (result.status) {
          this.loader.stop();
          this.coreService.showSuccess(result.message, "");
          this.closePopup();
          this.getAllRatingReviews();
        }
      },

      error: (err) => {
        this.loader.stop();
      },
    });
  }

  getHospitalListUnderDoctor() {
    let reqData = {
      for_hospitalIds: this.for_hospitalIds,
    };

    this.service.getHospitalListUnderDoctor(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        const hospitalList = response?.data;
        hospitalList.map((hospital)=>{
          this.hospitalList.push(
            {
              label : hospital.hospital_name,
              value : hospital.for_portal_user
            }
          )
        })
      }
    });
  }

  get f() {
    return this.hospitalRatingForm.controls;
  }

  closePopup() {
    this.hospitalRatingForm.reset();
    this.modalService.dismissAll("close");
  }


  onTabChange(tab: string) {
    this.tabFor = tab;
  }
  adjustRatingStar(rating) {
    let roundedNum = Math.floor(rating);
    return roundedNum;
  }

}
