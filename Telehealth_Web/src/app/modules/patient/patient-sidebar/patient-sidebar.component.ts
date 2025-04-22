import { CoreService } from "src/app/shared/core.service";
import { Component, OnInit, ViewChild } from "@angular/core";
import { PatientService } from "../patient.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { InsuranceManagementService } from "../../super-admin/super-admin-insurance.service";
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';
declare var $: any;

@Component({
  selector: "app-patient-sidebar",
  templateUrl: "./patient-sidebar.component.html",
  styleUrls: ["./patient-sidebar.component.scss"],
})
export class PatientSidebarComponent implements OnInit {
  Url: any;
  patientId: any = "";
  userID: any = ""
  userMenu: any = [];
  activeMenu: any;
  @ViewChild("confirmationModel") confirmationModel: any;

  constructor(
    private _coreService: CoreService,
    private router: Router,
    private service: PatientService,
    private modalService: NgbModal,
    private insuranceManagementService: InsuranceManagementService,
  ) {
    const userData = this._coreService.getLocalStorage("loginData");
    this.userID = userData._id;

    this.getUserMenus();
    this.activeMenu = window.location.pathname;
    this.sidebarnavigation();
  }
  ngOnInit(): void {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.patientId = loginData?._id;
    // $(".sidebar-dropdown > a").click(function (e: any) {
    //   $(".sidebar-submenu").slideUp(200);
    //   if ($(".sidebar-dropdown > a").parent().hasClass("active")) {
    //     $(".sidebar-dropdown").removeClass("active");
    //     $(".sidebar-dropdown > a").parent().removeClass("active");
    //   } else {
    //     $(".sidebar-dropdown").removeClass("active");
    //     $(".sidebar-dropdown > a").next(".sidebar-submenu").slideDown(200);
    //     $(".sidebar-dropdown > a").parent().addClass("active");
    //   }
    // });

    // $(".nav-item").click(() => {
    //   $(this).addClass("active");
    // });

    // $("#close-sidebar").click(function () {
    //   $(".page-wrapper").removeClass("toggled");
    // });
    // $("#show-sidebar").click(function () {
    //   $(".page-wrapper").addClass("toggled");
    // });
  }

  sidebarnavigation() {
    $(".sidebar-dropdown > a").click(function (e: any) {
      $(".sidebar-submenu").slideUp(200);
      if ($(".sidebar-dropdown > a").parent().hasClass("active")) {
        $(".sidebar-dropdown").removeClass("active");
        $(".sidebar-dropdown > a").parent().removeClass("active");
      } else {
        $(".sidebar-dropdown").removeClass("active");
        $(".sidebar-dropdown > a").next(".sidebar-submenu").slideDown(200);
        $(".sidebar-dropdown > a").parent().addClass("active");
      }
    });

    $(".nav-item").click(() => {
      $(this).addClass("active");
    });

    $("#close-sidebar").click(function () {
      $(".page-wrapper").removeClass("toggled");
    });
    $("#show-sidebar").click(function () {
      $(".page-wrapper").addClass("toggled");
    });

    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Check if the current URL is 'patient/dashboard'
      if (event.urlAfterRedirects === '/patient/dashboard') {
        this.setHeader('Dashboard');
      }
    });
  }

  getUserMenus() {
    const params = {
      module_name: "superadmin",
      user_id: this.userID,
    };
    this.insuranceManagementService.getUserMenus(params).subscribe(
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
      },
      (err) => {
        console.log(err);
      }
    );
  }

  setHeader(menuName: any) {
    // if (this.isPlanPurchased === false) {
    //   this._coreService.showError(
    //     "You do not have any plan!. Please purchase plan.",
    //     ""
    //   );
    //   return;
    // }

    this._coreService.setMenuInHeader(menuName);
    this._coreService.setLocalStorage(menuName, "menuTitle");

  }

  showSubmenu(itemEl: HTMLElement) {
    itemEl.classList.toggle("showMenu");
  }

  showSubmenu1(itemEl1: HTMLElement) {
    itemEl1.classList.toggle("showMenu1");
  }

  showSubmenu2(itemEl2: HTMLElement) {
    itemEl2.classList.toggle("showMenu2");
  }

  showSubmenu3(itemEl3: HTMLElement) {
    itemEl3.classList.toggle("showMenu3");
  }

  showSubmenu4(itemEl4: HTMLElement) {
    itemEl4.classList.toggle("showMenu4");
  }

  showSubmenu5(itemEl5: HTMLElement) {
    itemEl5.classList.toggle("showMenu5");
  }

  showSubmenuu(item: HTMLElement) {
    item.classList.toggle("showMenu");
  }

  showSubmenuu1(item1: HTMLElement) {
    item1.classList.toggle("showMenu1");
  }
  showSubmenuu2(item2: HTMLElement) {
    item2.classList.toggle("showMenu2");
  }
  showSubmenuu3(item3: HTMLElement) {
    item3.classList.toggle("showMenu3");
  }
  showSubmenuu4(item4: HTMLElement) {
    item4.classList.toggle("showMenu4");
  }



  async handleRouting(routePath: any = '', path: any = '', type: any = '') {


    if (routePath == "/patient/profilecreation") {
      sessionStorage.setItem("tabIndex", '4');

    }

    this.Url = routePath.split("/")[2];
    this.router.navigate([routePath]);


    if (path === 'Dental' || path === 'Optical' || path === 'Laboratory-Imaging' || path === 'Paramedical-Professions') {
      if (type === 'appointment') {
        this.router.navigate([`patient/appointment-claim/list/${path}`]);
      } else if (type === 'order') {
        this.router.navigate([`patient/order-claim/list/${path}`]);
      }
    }
  }

  public handleClose() {
    this.modalService.dismissAll("close");
  }

  purchasePlan() {
    this.router.navigate(["/patient/subscriptionplan"]);
    this.handleClose();
  }

  handleNavigationClick(value: any) {
    this.activeMenu = value;
  }


}
