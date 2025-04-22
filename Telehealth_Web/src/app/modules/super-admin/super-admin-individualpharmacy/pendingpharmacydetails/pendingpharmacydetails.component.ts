import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { PharmacyService } from "src/app/modules/pharmacy/pharmacy.service";
import { CoreService } from "src/app/shared/core.service";
import { SuperAdminService } from "../../super-admin.service";

@Component({
  selector: "app-pendingpharmacydetails",
  templateUrl: "./pendingpharmacydetails.component.html",
  styleUrls: ["./pendingpharmacydetails.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PendingpharmacydetailsComponent implements OnInit {
  profileDetails: any;
  profileLocationDetails: any = {};
  pharmacyProfile: any = "";
  pharmacyPictures: any = [];

  pharmacyName: string;
  pharmacyEmail: string;
  pharmacyPhone: string;
  pharmacyAdd: string;
  pharmacyJoinDate: string;
  pharmacyBankDetails: string;
  pharmacymobilePay: string;
  pharCountryCode: string;
  addressInfo: any;
  about: string;
  licenseDetails: any;
  payDetails: any;
  bankDetails: any;

  currentId: string;
  tabsId: number;
  verifyStatus:any;
  onDutyCity: any;
  onDutyGroupNo: any;
  profileData: any;
  forPortalUserId: void;
  pharmacyAssociation: any;
  associationGroupname: any;
  sessionID: any;
  innerMenuPremission:any=[];
  loginrole: any;
  constructor(
    private modalService: NgbModal,
    private activeRoute: ActivatedRoute,
    private _sadminService: SuperAdminService,
    private _coreService: CoreService,
    private route: Router,
    private _pharmacyService:PharmacyService
  ) {
    this.currentId = this.activeRoute.snapshot.params["id"];
    this.tabsId = this.activeRoute.snapshot.params["tabId"];
    this.loginrole = this._coreService.getLocalStorage("adminData").role;
  }

  ngOnInit(): void {
    this.getProfile(this.currentId)   
  }


  getProfile(id:any){
    const paramData = {
      userId: id,
    };
    this._sadminService.getPharmacyDetails(paramData).subscribe({
      next: (res) => {
        let encryptedData = { data: res };
        let result = this._coreService.decryptObjectData(encryptedData);
        this.profileDetails = result?.data?.adminData;
        this.profileLocationDetails = result?.data?.locationData;      
        this.profileData =  result?.data?.portalUserData;
        this.pharmacyProfile =
          result?.data?.adminData?.profile_picture_signed_url;
        this.forPortalUserId=this.profileDetails?.for_portal_user;
        this._coreService.setSessionStorage(
          result.data.portalUserData._id,
          "pharmacyAdminId"
        );
        this.pharmacyName = this.profileDetails?.pharmacy_name;
        this.pharmacyEmail = result?.data?.portalUserData?.email;
        this.pharmacyPhone = this.profileDetails?.main_phone_number ? this.profileDetails?.main_phone_number : result?.data?.portalUserData?.phone_number;
        this.pharmacyJoinDate = this.profileDetails?.createdAt;
        this.pharCountryCode = result?.data?.portalUserData?.country_code;
        this.addressInfo = this.profileDetails?.in_location;

        this.verifyStatus = result?.data?.adminData?.verify_status;
        this.about = this.profileDetails?.about_pharmacy;
        this.pharmacyPictures = this.profileDetails?.pharmacy_picture_signed_urls;
        this.licenseDetails = this.profileDetails?.licence_details;

        
      },
      error: (err) => {
        // console.log(err);
      },
    });
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission(){
    let userPermission = this._coreService.getLocalStorage("adminData").permissions;
    if(userPermission){
      let menuID = sessionStorage.getItem("currentPageMenuID");
      let checkData = this.findObjectByKey(userPermission, "parent_id",menuID)
      if(checkData){
        if(checkData.isChildKey == true){
          var checkSubmenu = checkData.submenu;      
          if (checkSubmenu.hasOwnProperty("pharmacy")) {
            this.innerMenuPremission = checkSubmenu['pharmacy'].inner_menu;
  
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
  }

  giveInnerPermission(value) {
    if (this.loginrole === 'STAFF_USER') {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    }else {
      return true;
    }
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  showPermission() {
    this.route.navigate(["/super-admin/pharmacy/permission",this.forPortalUserId],{
      queryParams :{
        forPortalId :this.currentId
      }
    });
  }

  backpage() {
    this.route.navigate(["/super-admin/pharmacy"]);
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  closePopUp() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
  }

  routeToPermission() { 
      this.route.navigate([`/super-admin/pharmacy/permission/${this.forPortalUserId}`]) 
  }
}
