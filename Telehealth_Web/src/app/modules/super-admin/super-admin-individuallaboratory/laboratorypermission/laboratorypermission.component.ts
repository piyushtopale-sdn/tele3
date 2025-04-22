import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { CoreService } from "src/app/shared/core.service";
import { ActivatedRoute, Router } from "@angular/router";
import { LabimagingdentalopticalService } from "../../labimagingdentaloptical.service";

@Component({
  selector: 'app-laboratorypermission',
  templateUrl: './laboratorypermission.component.html',
  styleUrls: ['./laboratorypermission.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LaboratorypermissionComponent implements OnInit {

  allMenus: any = [];
  menuCheckedArray: any = {};
  checkedMenuArray: any = [];
  children: any = {};
  labId: string = "";

  constructor(
    private service: LabimagingdentalopticalService,
    private coreService: CoreService,
    private activateRouted: ActivatedRoute,
    private route: Router
  ) { }

  ngOnInit(): void {
    let paramId = this.activateRouted.snapshot.paramMap.get("id");
    this.labId = paramId;
    this.getAllMenus();
    this.getUserMenus();
  }

  handleAssignPerminssions() {
    const reqData = {
      menu_array: this.menuCheckedArray,
      children_array: this.children,
      user_id: this.labId,
    };

    this.service.asignMenuSubmit(reqData).subscribe(
      (res: any) => {
        const response = this.coreService.decryptObjectData(res);
        this.coreService.showSuccess(response.message, "Success");
        this.route.navigate(["/super-admin/laboratory"]);
      },
      (err) => {
        console.log(err);
      }
    );
  }

  getUserMenus() {
    const params = {
      module_name: "superadmin",
      user_id: this.labId,
    };

    this.service.getUserMenus(params).subscribe((res: any) => {
      const decryptedData = this.coreService.decryptObjectData(res)

      const checkedData = []
      for (const data of decryptedData.body) {
        if (!data.parent_id) {
          this.menuCheckedArray[data?.menu_id?._id] = data?.menu_order
        }
        checkedData.push(data?.menu_id?._id)
      }
      this.checkedMenuArray = checkedData
    },
      (err) => {
        console.log(err);
      }
    );
  }

  getAllMenus() {
    const params = {
      module_name: "superadmin",
      module_type: "Laboratory",
    };
    this.service.getMenus(params).subscribe(
      (res: any) => {
        const response = this.coreService.decryptObjectData(res);
        const data = [];
        const childrenArray = {};
        for (const menu of response.body) {
          if (menu.parent_id === "0") {
            data.push({
              id: menu._id,
              name: menu.name,
              menu_order: menu.menu_order,
              parent_id: menu.parent_id,
            });
          } else {
            if (menu.parent_id in childrenArray) {
              let val = childrenArray[menu.parent_id];
              val.push(menu._id);
              childrenArray[menu.parent_id] = val;
            } else {
              childrenArray[menu.parent_id] = [menu._id];
            }
          }
        }
        this.allMenus = data;
        this.children = childrenArray;
      },
      (err) => {
        console.log(err);
      }
    );
  }

  makeJSON(value: any, menuID: any, order: any) {
    if (value) {
      this.menuCheckedArray[menuID] = order;
    } else {
      for (const key in this.menuCheckedArray) {
        const getOrder = this.menuCheckedArray[key];
        if (getOrder === order) {
          delete this.menuCheckedArray[key];
        }
      }
    }
  }

  makeSelectAll(event: any) {


    this.allMenus.forEach((data) => {
      if (event.checked == true) {
        this.checkedMenuArray.push(data.id);
        this.menuCheckedArray[data.id] = data.menu_order

      }
      else {
        this.checkedMenuArray = [""];
        for (const key in this.menuCheckedArray) {
          const getOrder = this.menuCheckedArray[key]
          if (getOrder === data.menu_order) {
            delete this.menuCheckedArray[key]
          }
        }
      }

    })
  }


}
