import { PharmacyService } from "src/app/modules/pharmacy/pharmacy.service";
import { Component, OnInit, ViewEncapsulation, ViewChild,TemplateRef } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { NgbRatingConfig } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "src/app/shared/core.service";
import { SlicePipe } from "@angular/common";
import { IndiviualDoctorService } from "../../individual-doctor/indiviual-doctor.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { ToastrService } from "ngx-toastr";

export interface PeriodicElement {
  patientname: string;
  dateandtime: string;
  feedbackby: string;
  review: string;
}
@Component({
  selector: "app-super-admin-feedbackmanagement",
  templateUrl: "./super-admin-feedbackmanagement.component.html",
  styleUrls: ["./super-admin-feedbackmanagement.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class SuperAdminFeedbackmanagementComponent implements OnInit {

  displayedColumnsDoctor: string[] = [
    "patientname",
    "patient_Mrn",
    "dateandtime",
    "doctorname",
    "review",
    "rating",
    "activeStatus",
    "action",
  ];
  dataSourceDoctor: any = [];  

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("activeStatusModal") activeStatusModal: TemplateRef<any>;
  abc: any = "Disable";
  tabFor: any = "Pateint_To_Doctor";
  pageSize: number = 10;
  totalLength: number = 0;
  totalPages: number = 0;
  page: any = 1;
  selectedReview: any = "";
  reviewId: any = "";
  innerMenuPremission:any=[];
  loginrole: any;
  status: boolean;
  sortColumn: string = 'createdAt';
  sortOrder: 1 | -1 = -1;
  sortIconClass: string = 'arrow_upward';
  doctorNameList: any[] = [];
  filteredDoctors: any[] = [];
  overlay = false;
  selectedDoctor: any = null;

  constructor(
    config: NgbRatingConfig,
    private modalService: NgbModal,
    private pharmacyService: PharmacyService,
    private coreService: CoreService,
    private slicePipe: SlicePipe,
    private doctorService: IndiviualDoctorService,
    private loader: NgxUiLoaderService,
    private toastr: ToastrService,
    
  ) {
    config.max = 1;
    config.readonly = true;
    this.loginrole = this.coreService.getLocalStorage("adminData").role;
  }


  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1; 
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward'; 
  
    const sortString = `${column}:${this.sortOrder}`;
    if (this.selectedDoctor) {
      this.getOtherTabsRatingAndReview("", "", sortString, this.page, this.pageSize, this.selectedDoctor);
    } else {
      this.getOtherTabsRatingAndReview("", "", sortString, this.page, this.pageSize);
    }
  }

  ngOnInit(): void {
    // this.getPatientToPharmacyRatings();
    const sortString = `${this.sortColumn}:${this.sortOrder}`;
    this.getOtherTabsRatingAndReview("", "", sortString, this.page, this.pageSize, "");
    this.getDoctorList();
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission(){
    let userPermission = this.coreService.getLocalStorage("adminData").permissions;
    let menuID = sessionStorage.getItem("currentPageMenuID");
    let checkData = this.findObjectByKey(userPermission, "parent_id",menuID)
    if(checkData){
      if(checkData.isChildKey == true){
        var checkSubmenu = checkData.submenu;      
        if (checkSubmenu.hasOwnProperty("lab")) {
          this.innerMenuPremission = checkSubmenu['lab'].inner_menu;

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
    if (this.loginrole === 'STAFF_USER') {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    }else {
      return true;
    }
  }

  onTabChange(tab: string) {
    this.tabFor = tab;
        // if (this.tabFor === "Pateint_To_Pharmacy")
      // this.getPatientToPharmacyRatings(`${this.sortColumn}:${this.sortOrder}`);
    if (this.tabFor === "Pateint_To_Doctor")
      this.getOtherTabsRatingAndReview("patient", "doctor", ``);
   
  }
  
  getOtherTabsRatingAndReview(
    reviewBy: any = "", 
    reviewTo: any = "", 
    sort: any = '', 
    page: number = 1, 
    pageSize: number = 10,
    doctorName: string = ""  // New parameter
  ) {
    let reqData = {
      portal_user_id: "",  
      page: page,
      limit: pageSize,
      reviewBy: reviewBy,
      reviewTo: reviewTo,
      sort: sort,
      doctorName: doctorName  // Pass selected doctor name here
    };
  
    this.doctorService
      .getReviweAndRatingForSuperAdmin(reqData)
      .subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
  
        if (response.status) {
          this.totalLength = response.body.totalCount;
          this.totalPages = response.body.totalPages;
          this.dataSourceDoctor = response?.body?.paginatedResults;

        }
      });
  }

  getDoctorList(): void {
    this.doctorService.getAllDoctor().subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });

      if (response.status) {
        this.doctorNameList = [];
        const arr = response?.body;
        arr.map((curentval: any) => {
          this.doctorNameList.push({
            label: curentval?.full_name,
            value: curentval?.full_name,
          });
        });
      }

    });
  }
  
  
  deleteReviewAndRating() {
    if (this.tabFor === "Pateint_To_Pharmacy") {
      this.deletePharmacyReview();
    } else {
      this.deleteOtherTabReview();
    }
  }

  deletePharmacyReview() {
    let reqData = {
      _id: this.reviewId,
    };
    this.loader.start();
    this.pharmacyService
      .deletePharmcyRaviweandRating(reqData)
      .subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.loader.stop();
          this.coreService.showSuccess(response.message, "");
          this.modalService.dismissAll("");
        }
      });
  }

  deleteOtherTabReview() {
    let reqData = {
      _id: this.reviewId,
    };
    this.loader.start();
    this.doctorService.deleteRatingAndReview(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.loader.stop();
        this.coreService.showSuccess(response.message, "");
        this.modalService.dismissAll("");

        if (this.tabFor === "Pateint_To_Doctor")
          this.getOtherTabsRatingAndReview("patient", "doctor");
        if (this.tabFor === "Pateint_To_Hospital")
          this.getOtherTabsRatingAndReview("patient", "hospital");
        if (this.tabFor === "Doctor_To_Hospital")
          this.getOtherTabsRatingAndReview("doctor", "hospital");
      }
    });
  }

  //  Review modal
  openVerticallyCenteredreview(reviewcontent: any, review: any = "") {
    this.selectedReview = review;
    this.modalService.open(reviewcontent, {
      centered: true,
      size: "md",
      windowClass: "review",
    });
  }

  //delete popup
  openVerticallyCenteredsecond(deletePopup: any, reviewId: any) {
    this.reviewId = reviewId;
    
    this.modalService.open(deletePopup, { centered: true, size: "sm" });
  }

  // handlePageEvent(data: any) {
  //   this.page = data.pageIndex + 1;
  //   this.pageSize = data.pageSize;

  //   if (this.tabFor === "Pateint_To_Pharmacy")
  //     this.getPatientToPharmacyRatings();
  //   if (this.tabFor === "Pateint_To_Doctor")
  //     this.getOtherTabsRatingAndReview("patient", "doctor");   
  // }
  handlePageEvent(data: any) { 
    this.page = data.pageIndex + 1;  
    this.pageSize = data.pageSize;
    // if (this.tabFor === "Pateint_To_Pharmacy") {
    //   this.getPatientToPharmacyRatings();
    // }
    
    if (this.tabFor === "Pateint_To_Doctor" && this.selectedDoctor) {
      this.getOtherTabsRatingAndReview("patient", "doctor", `${this.sortColumn}:${this.sortOrder}`, this.page, this.pageSize,this.selectedDoctor);
    } else{
      this.getOtherTabsRatingAndReview("patient", "doctor", `${this.sortColumn}:${this.sortOrder}`, this.page, this.pageSize)
    }
  }


  handleToggleChangeForActiveStatus(event: any, id: any) {


    this.reviewId = id; 
    this.status = event   
   
    this.modalService.open(this.activeStatusModal); // Open the modal for confirmation
  }
  

  trimComment(comment) {
    let trimedComment = this.slicePipe.transform(comment, 0, 50);

    if (comment?.length > 50) {
      return trimedComment + ".....";
    } else {
      return trimedComment;
    }
  }
  adjustRatingStar(rating) {
    let roundedNum = Math.floor(rating);
    return roundedNum;
  }


  chnageStatusReviewAndRating() {
    let reqData ={
      _id: this.reviewId,
      status: this.status
    };
    this.loader.start();  
  
    this.doctorService.updateRatingAndReview(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });  // Decrypt the response
      this.modalService.dismissAll("");
      if (response.status) {
        this.loader.stop(); 
        this.toastr.success(response.message);
        if (this.selectedDoctor) {
          this.getOtherTabsRatingAndReview("", "", `${this.sortColumn}:${this.sortOrder}`, this.page, this.pageSize, this.selectedDoctor);
        } else {
          this.getOtherTabsRatingAndReview("", "",`${this.sortColumn}:${this.sortOrder}`, this.page, this.pageSize);
        }
      }
    });
  }
  

  onDoctorSelectionChange(event: any): void {
    this.selectedDoctor = event?.value || null;
  
    if (this.selectedDoctor) {
      // Filtered API call with selected doctor name
      this.getOtherTabsRatingAndReview("", "", "", this.page, this.pageSize, this.selectedDoctor);
    } else {
      // Call the API without a filter
      this.getOtherTabsRatingAndReview("", "", "", this.page, this.pageSize);
    }
  }

  clearSelection(): void {
    this.selectedDoctor = null;
    this.getOtherTabsRatingAndReview("", "", "", 1, 10); // Reset the data
  }
  

}
