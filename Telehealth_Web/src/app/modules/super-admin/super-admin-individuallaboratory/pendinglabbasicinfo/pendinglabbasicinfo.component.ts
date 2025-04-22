import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CoreService } from "src/app/shared/core.service";
import { LabimagingdentalopticalService } from "../../labimagingdentaloptical.service";

@Component({
  selector: 'app-pendinglabbasicinfo',
  templateUrl: './pendinglabbasicinfo.component.html',
  styleUrls: ['./pendinglabbasicinfo.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PendinglabbasicinfoComponent implements OnInit {

  profileDetails: any;
  centreProfile: any = "";
  licencePicSign: any = "";
  centrePictures: any = [];

  centreName: string;
  centreEmail: string;
  centrePhone: string;
  centreAdd: string;
  centreJoinDate: string;
  centreBankDetails: string;
  centremobilePay: string;
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
  centreAssociation: any;
  associationGroupname: any;
  sessionID: any;
  innerMenuPremission:any=[];
  loginrole: any;
  branchCode: any;
  branchKey: any;
  constructor(
    private activeRoute: ActivatedRoute,
    private labimagingdentaloptical: LabimagingdentalopticalService,
    private _coreService: CoreService,
    private route :Router
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
      id: id,
    };
    this.labimagingdentaloptical.centerProfileView(paramData).subscribe({
      next: (res) => {
        let encryptedData = { data: res };
        let result = this._coreService.decryptObjectData(encryptedData);
        
        if(result.status){     
        this.profileDetails = result?.data?.adminData;      
        this.centreProfile =
          result?.data?.adminData?.profile_picture_signed_url;
        this.forPortalUserId=this.profileDetails?.for_portal_user;
        this._coreService.setSessionStorage(
          result.data.portalUserData._id,
          "centreAdminId"
        );
        this.centreName = this.profileDetails?.centre_name;
        this.centreEmail = result?.data?.portalUserData?.email;
        this.centrePhone = this.profileDetails?.main_phone_number ? this.profileDetails?.main_phone_number : result?.data?.portalUserData?.phone_number;
        this.centreJoinDate = this.profileDetails?.createdAt;
        this.pharCountryCode = result?.data?.portalUserData?.country_code;
        this.addressInfo = result?.data?.locationData;

        this.verifyStatus = result?.data?.adminData?.verify_status;
        this.about = this.profileDetails?.about_centre;
        this.centrePictures = this.profileDetails?.centre_picture_signed_urls;
        this.licenseDetails = this.profileDetails?.licence_details;
        this.licencePicSign = result?.data?.licencePicSignedUrl;
        this.branchCode = result?.data?.portalUserData?.identifier?.branchCode;
        this.branchKey = result?.data?.portalUserData?.identifier?.branchKey;
      }
      },
      error: (err) => {
        console.log(err);
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
          if (checkSubmenu.hasOwnProperty("centre")) {
            this.innerMenuPremission = checkSubmenu['centre'].inner_menu;
  
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

  routeToPermission(){
    this.route.navigate([`/super-admin/laboratory/permission/${this.forPortalUserId}`])
  }
 
}
