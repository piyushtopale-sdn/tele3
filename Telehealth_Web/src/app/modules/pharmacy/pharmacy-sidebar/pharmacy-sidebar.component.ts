import { Component, OnInit, ViewChild } from "@angular/core";
import { CoreService } from "src/app/shared/core.service";
import { InsuranceManagementService } from "../../super-admin/super-admin-insurance.service";
import { PharmacyService } from "../pharmacy.service";
import { PharmacyPlanService } from "../pharmacy-plan.service";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { IndiviualDoctorService } from "../../individual-doctor/indiviual-doctor.service";
import { SuperAdminService } from "../../super-admin/super-admin.service";
declare var $: any;
@Component({
  selector: "app-pharmacy-sidebar",
  templateUrl: "./pharmacy-sidebar.component.html",
  styleUrls: ["./pharmacy-sidebar.component.scss"],
})
export class PharmacySidebarComponent implements OnInit {
  userID: string;
  userMenu: any = [];
  activeMenu: any;

  globalStatus: any = "expired";
  isPlanPurchased: boolean = false;
  @ViewChild("confirmationModel") confirmationModel: any;
  constructor(
    private insuranceManagementService: InsuranceManagementService,
    private _coreService: CoreService,
    private pharmacyService: PharmacyPlanService,
    private route: Router,
    private modalService: NgbModal,
    private service: PharmacyService,
    private indservice: IndiviualDoctorService,
    private sadminServce: SuperAdminService,
  ) {
    const userData = this._coreService.getLocalStorage("loginData");
    this.userID = userData._id;
    this.getUserMenus();
    this.activeMenu = window.location.pathname;
    this.sidebarnavigation();
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
  handleNavigationClick(value: any) {
    this.activeMenu = value;
  }

  sidebarnavigation() {
    // $(document).on('click', ".sidebar-dropdown > a", function (e: any) {
    //   $(".sidebar-submenu").slideUp(200);
    //   if (
    //     $(".sidebar-dropdown > a")
    //       .parent()
    //       .hasClass("active")
    //   ) {
    //     $(".sidebar-dropdown").removeClass("active");
    //     $(".sidebar-dropdown > a")
    //       .parent()
    //       .removeClass("active");
    //   } else {
    //     $(".sidebar-dropdown").removeClass("active");
    //     $(".sidebar-dropdown > a")
    //       .next(".sidebar-submenu")
    //       .slideDown(200);
    //     $(".sidebar-dropdown > a")
    //       .parent()
    //       .addClass("active");
    //   }
    // });

    // $(document).on('click', ".nav-item", () => {
    //   $(this).addClass("active");
    // });

    $(document).on("click", "#close-sidebar", function () {
      $(".page-wrapper").removeClass("toggled");
    });
    $(document).on("click", "#show-sidebar", function () {
      $(".page-wrapper").addClass("toggled");
    });
  }

  ngOnInit(): void {
    this.indservice.activeMenu$.subscribe((menuName) => {
      this.activeMenu = window.location.pathname
      this.setHeader(menuName);
    });
  }

  setHeader(menuName: any) {    
    this._coreService.setMenuInHeader(menuName);
    this._coreService.setLocalStorage(menuName, "menuTitle");
  }  


  showSubmenu(itemEl: HTMLElement) {
    itemEl.classList.toggle("showMenu");
  }



  async handleRouting(routePath: any) {

    // let isPurchased = await this.service.isPlanPurchasedByPharmacy(this.userID); //check fot purchased plan

    // if (isPurchased) {
    //   this.route.navigate([routePath]);
    // } else {
    //   this.modalService.open(this.confirmationModel);
    // }

    // if (routePath === "/pharmacy/pharmacysubscriptionplan") {
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
    this.route.navigate(["/pharmacy/pharmacysubscriptionplan"]);
    this.handleClose();
  }
}
