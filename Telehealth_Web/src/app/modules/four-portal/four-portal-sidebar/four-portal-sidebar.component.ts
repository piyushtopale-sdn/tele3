import { CoreService } from "src/app/shared/core.service";
import { Component, OnInit, ViewChild } from "@angular/core";
import { SuperAdminService } from "../../super-admin/super-admin.service";
import { ActivatedRoute, Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { IndiviualDoctorService } from "../../individual-doctor/indiviual-doctor.service";
declare let $: any;
@Component({
  selector: 'app-four-portal-sidebar',
  templateUrl: './four-portal-sidebar.component.html',
  styleUrls: ['./four-portal-sidebar.component.scss']
})
export class FourPortalSidebarComponent implements OnInit {

  doctorRole: any = "";

  userID: string = "";
  userMenu: any = [];
  activeMenu: any;

  isPlanPurchased:boolean=false

  @ViewChild("confirmationModel") confirmationModel: any;
  route_type: string;
  currentAddress: string;
  userType: any;
  Url: any;

  constructor(
    private readonly _coreService: CoreService,
    private readonly sadminServce: SuperAdminService,
    private readonly route: Router,
    private readonly modalService: NgbModal,
    private readonly activateroute: ActivatedRoute,
    private readonly indservice: IndiviualDoctorService,

  ) {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    this.doctorRole = loginData?.role;
    this.userID = loginData._id;
    this.userType = loginData?.type;
  }
  ngOnInit(): void {
    this.activateroute.paramMap.subscribe(params => {
      this.route_type = params.get('path');
    });
    if(this.doctorRole === "INDIVIDUAL" || this.doctorRole === "STAFF"){
      this.getUserMenus();
    }
    this.activeMenu = window.location.pathname;
    this.sidebarnavigation();
    this.indservice.activeMenu$.subscribe((menuName) => {
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
    this.Url = routePath.split("/")[2];
    this.route.navigate([routePath]);
  }

  public handleClose() {
    this.modalService.dismissAll("close");
  }

  purchasePlan() {
    this.route.navigate([`/portals/dashboard/${this.route_type}`]);
    this.handleClose();
  }

  public openActionPopup(actionPopup: any) {
    this.modalService.open(actionPopup, { centered: true, size: "lg" });
  }

  // showSubmenu(itemEl: HTMLElement) {
  //   itemEl.classList.toggle("showMenu");
  // }

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

}

