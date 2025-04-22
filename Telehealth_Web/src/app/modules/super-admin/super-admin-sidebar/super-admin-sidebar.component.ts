import { Component, OnInit } from '@angular/core';
import { CoreService } from 'src/app/shared/core.service';
import { SuperAdminService } from '../super-admin.service';
declare var $: any;
@Component({
  selector: 'app-super-admin-sidebar',
  templateUrl: './super-admin-sidebar.component.html',
  styleUrls: ['./super-admin-sidebar.component.scss']
})
export class SuperAdminSidebarComponent implements OnInit {

  userID:any;
  userMenu: any = []
  activeMenu: any;
  loginLogo:any='';
  currentLogsID: any;
  currentAddress: string;
  userMenuArray: any = []

  constructor(private service: SuperAdminService, private _coreService: CoreService) { 
    const userData = this._coreService.getLocalStorage('loginData');
    this.userID = userData._id
    this.getUserMenus()
    this.activeMenu = window.location.pathname
    this.sidebarnavigation()
  }
  getUserMenus(){
    const params = {
      module_name: 'superadmin',
      user_id: this.userID
    }
    this.service.getUserMenus(params).subscribe((res: any) => {
      const decryptedData = this._coreService.decryptObjectData(res)
      const menuArray = {}
      for (const data of decryptedData.body) {
        if (data.parent_id) {
          let val = menuArray[data.parent_id]['children']
          let object = menuArray[data.parent_id]
          val.push({
            id: data._id,
            name: data.menu_id.name,
            route_path: data.menu_id.route_path,
            icon: data.menu_id.menu_icon,
            icon_hover: data.menu_id.menu_icon_hover,
            slug: data.menu_id.slug,
            parent_id: data.parent_id
          })
          object['children'] = val
          menuArray[data.parent_id] = object
        } else {
          menuArray[data.menu_id._id] = {
            id: data._id,
            name: data.menu_id.name,
            route_path: data.menu_id.route_path,
            icon: data.menu_id.menu_icon,
            icon_hover: data.menu_id.menu_icon_hover,
            slug: data.menu_id.slug,
            parent_id: data.parent_id,
            children: []
          }
        }
      }
      this.userMenu = menuArray;
      this.userMenuArray = Object.values(this.userMenu); // This will give you an array of the menu items in order
      const Item = localStorage.setItem('activeMenu',JSON.stringify(Object.values(this.userMenu)))  
    },
    (err) => {
      console.log(err);
    }
  );
  }
  handleNavigationClick(value: any,menuName:any){
    
    this.activeMenu = value;
    this._coreService.setMenuInHeader(menuName);
    this._coreService.setLocalStorage(menuName,'menuTitle');
    
  }

  sidebarnavigation(){
    $(document).on('click', "#close-sidebar",function () {
      $(".page-wrapper").removeClass("toggled");
    });
    $(document).on('click', "#show-sidebar",function () {
      $(".page-wrapper").addClass("toggled");
    });
  }

  ngOnInit(): void {
    this.service.activeMenu$.subscribe((menuName) => {
      this.activeMenu = window.location.pathname
      this._coreService.setMenuInHeader(menuName);
    });
  }
  


  showSubmenu(itemEl: HTMLElement) {
    itemEl.classList.toggle("showMenu");
  }

  isSelected = false;

  toggleSelection() {
    this.isSelected = !this.isSelected;
  }
}