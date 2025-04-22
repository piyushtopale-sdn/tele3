import { CoreService } from "src/app/shared/core.service";
import { Component, OnInit, ViewChild } from "@angular/core";
import { SuperAdminService } from "../../super-admin/super-admin.service";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { IndiviualDoctorService } from "../indiviual-doctor.service";
declare var $: any;

@Component({
  selector: "app-individual-doctor-sidebar",
  templateUrl: "./individual-doctor-sidebar.component.html",
  styleUrls: ["./individual-doctor-sidebar.component.scss"],
})
export class IndividualDoctorSidebarComponent implements OnInit {
  doctorRole: any = "";

  userID: string = "";
  userMenu: any = [];
  activeMenu: any;

  isPlanPurchased:boolean=false

  @ViewChild("confirmationModel") confirmationModel: any;

  constructor(
    private _coreService: CoreService,
    private sadminServce: SuperAdminService,
    private route: Router,
    private modalService: NgbModal,
    private doctorService: IndiviualDoctorService
  ) {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.doctorRole = loginData?.role;
    this.userID = loginData._id;
  }
  ngOnInit(): void {

    this.activeMenu = window.location.pathname;    
    if(this.doctorRole === "INDIVIDUAL_DOCTOR" || this.doctorRole === "INDIVIDUAL_DOCTOR_STAFF"){
      this.getUserMenus();
    }
    this.sidebarnavigation();

    this.doctorService.activeMenu$.subscribe((menuName) => {
      this.activeMenu = window.location.pathname
      this.setHeader(menuName);
    });

  }

  


 
  getUserMenus() {
    const params = {
      module_name: "superadmin",
      user_id: this.userID,
    };
    this.sadminServce.getUserMenus(params).subscribe(
      (res: any) => {
        const decryptedData = this._coreService.decryptObjectData(res);
        const menuArray = {};
        for (const data of decryptedData.body) {
          if (data.parent_id) {
            let val = menuArray[data.parent_id]["children"];
            let object = menuArray[data.parent_id];
            val.push({
              id: data._id,
              name: data.menu_id.name,
              route_path: data.menu_id.route_path,
              icon: data.menu_id.menu_icon,
              icon_hover: data.menu_id.menu_icon_hover,
              slug: data.menu_id.slug,
              parent_id: data.parent_id,
            });
            object["children"] = val;
            menuArray[data.parent_id] = object;
          } else {
            menuArray[data.menu_id._id] = {
              id: data._id,
              name: data.menu_id.name,
              route_path: data.menu_id.route_path,
              icon: data.menu_id.menu_icon,
              icon_hover: data.menu_id.menu_icon_hover,
              slug: data.menu_id.slug,
              parent_id: data.parent_id,
              children: [],
            };
          }
        }
        this.userMenu = menuArray;
        const Item = localStorage.setItem('activeMenu',JSON.stringify(Object.values(this.userMenu)))       
        
      },
      (err) => {
        console.log(err);
      }
    );
  }

  handleNavigationClick(value: any, heading: any) {    
    this.activeMenu = value;
    this.setHeader(heading);
  }

  sidebarnavigation() {
    $(document).on("click", "#close-sidebar", function () {
      $(".page-wrapper").removeClass("toggled");
    });
    $(document).on("click", "#show-sidebar", function () {
      $(".page-wrapper").addClass("toggled");
    });
  }

  showSubmenu(itemEl: HTMLElement) {
    itemEl.classList.toggle("showMenu");
  }

  setHeader(menuName: any) {
    this._coreService.setMenuInHeader(menuName);
    this._coreService.setLocalStorage(menuName, "menuTitle");
  }

  async handleRouting(routePath: any) {
    // //check if user have plan or not

    // let isPurchased = await this.doctorService.isPlanPurchesdByDoctor(this.userID); //check fot purchased plan

    // if (isPurchased) {
    //   this.route.navigate([routePath]);
    // } else {
    //   this.modalService.open(this.confirmationModel);
    // }

    // if (routePath === "/individual-doctor/subscriptionplan") {
    //   this.route.navigate([routePath]);
    //   return;
    // }

    // if (this.isPlanPurchased === false) {
    //   this.modalService.open(this.confirmationModel);
    // } else {
    //   this.route.navigate([routePath]);
    // }

    this.route.navigate([routePath]);
  }

  public handleClose() {
    this.modalService.dismissAll("close");
  }

  purchasePlan() {
    this.route.navigate(["/individual-doctor/subscriptionplan"]);
    this.handleClose();
  }

  public openActionPopup(actionPopup: any) {
    this.modalService.open(actionPopup, { centered: true, size: "lg" });
  }
}
