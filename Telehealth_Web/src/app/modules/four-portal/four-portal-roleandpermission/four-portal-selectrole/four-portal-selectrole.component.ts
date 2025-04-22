import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
} from "@angular/forms";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { ActivatedRoute, Router } from "@angular/router";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { IndiviualDoctorService } from "src/app/modules/individual-doctor/indiviual-doctor.service";
import { CoreService } from "src/app/shared/core.service";
import { FourPortalService } from "../../four-portal.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
// import { IndiviualDoctorService } from "../../indiviual-doctor.service";

export interface PeriodicElement {
  sectionname: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  // { sectionname: 'View'},
  // { sectionname: 'Add'},
  // { sectionname: 'Delete'},
  // { sectionname: 'Edit'},
];

@Component({
  selector: "app-four-portal-selectrole",
  templateUrl: "./four-portal-selectrole.component.html",
  styleUrls: ["./four-portal-selectrole.component.scss"],
})
export class FourPortalSelectroleComponent implements OnInit {
  displayedColumns: string[] = ["sectionname", "selectall"];
  dataSource = ELEMENT_DATA;

  roleList: any[] = [];

  panelOpenState = false;
  userID: any;
  staffList: any[] = [];
  allMenus: any[];
  children: {};
  checkedMenuArray: any = [];
  menuCheckedArray: any = {};
  allSubmenuesData: any = [];

  staffID: any;
  staffError: boolean = false;
  menuWiseSubmenu: any = [];
  menuName: any;
  newMenu: any;
  subMenuKeys: any = [];
  newKey: any;
  objectMenus: any = [];
  selectedOptionSubMenu: any = [];
  selectedOptioninnerSubMenu: any = [];
  activeSubmenuId: number;
  activeSubmenuIdsubmenu: any;
  selectedMenuItem: any = [];
  activemainmenuselectedid: any;
  alllogindata = [];
  isSubmitted: boolean = false;
  roleForm: FormGroup;
  overlay: false;
  initialValue: any;
  selectall: any = false;
  route_type: string;
  userType: any;
  currentUrl: any = [];

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private _route: Router,
    private activateRoute: ActivatedRoute,
    private fourPortalService: FourPortalService,
    private doctorService: IndiviualDoctorService,
    private _coreService: CoreService,
    private loader: NgxUiLoaderService
  ) {
    const userData = this._coreService.getLocalStorage("loginData");
    this.userID = userData._id;
    this.userType = userData?.type;
    // this.roleForm = this.fb.group({
    //   name: ["", [Validators.required]],
    //   status: [true],
    // });
    this.roleForm = this.fb.group({
      roles: this.fb.array([]),
    });

    this.initialValue = this.roleForm.value;
  }

  ngOnInit(): void {
    this.activateRoute.paramMap.subscribe((params) => {
      this.route_type = params.get("path");
    });

    this.getStaffList();
    // this.getAllMenus()
    this.addnewRole();
    this.getLoginMenus();
    this.currentUrl = this._route.url;
    this.onNavigate(this.currentUrl);
  }

  openVerticallyCommonModal(commanModalForAll: any, id: any, name: any) {
    this.menuName = name;
    this.activemainmenuselectedid = id;
    let data = this.allSubmenuesData.filter((el: any) => {
      return el.parent_id === id;
    });

    if (data && data.length > 0) {
      this.menuWiseSubmenu = data[0].submenu;
      for (var key in this.menuWiseSubmenu) {
        var obj = this.menuWiseSubmenu[key];
        if (obj.inner_submenu.length > 0) {
          this.objectMenus.push(obj.inner_submenu);
        }
      }
      this.modalService.open(commanModalForAll, {
        centered: true,
        backdrop: "static",
        size: "md",
        windowClass: "permission_commit",
      });
    } else {
    }
  }
  objectKeys(obj) {
    return Object.keys(obj);
  }

  toggle(item, event: MatCheckboxChange, i) {
    if (event.checked) {
      this.selectedOptionSubMenu.push(item?.name);

      if (i == this.activeSubmenuId) {
        this.objectMenus[this.activeSubmenuId].forEach((ele: any) => {
          const index = this.selectedOptioninnerSubMenu[
            this.activeSubmenuId
          ].indexOf(ele?.name);
          if (index >= 0) {
            this.selectedOptioninnerSubMenu[this.activeSubmenuId].push(
              ele?.name
            );
          }
        });
      }
    } else {
      const index = this.selectedOptionSubMenu.indexOf(item?.name);
      if (index >= 0) {
        this.selectedOptionSubMenu.splice(index, 1);
        if (i == this.activeSubmenuId) {
          this.selectedOptioninnerSubMenu[this.activeSubmenuId].length = 0;
        }
      }
    }
  }

  check(i, submenu) {
    this.activeSubmenuId = i;
    this.activeSubmenuIdsubmenu = submenu;
  }

  exists(id, item, i) {
    //  this.activeSubmenuId = i

    if (i == this.activeSubmenuId) {
      let data = this.isCheckedInner();
      if (data == true) {
        if (this.selectedOptionSubMenu.indexOf(id) == -1) {
          this.selectedOptionSubMenu.push(item?.name);
          return true;
        }
      } else {
        if (
          this.selectedOptionSubMenu.length > 0 &&
          this.selectedOptioninnerSubMenu[this.activeSubmenuId].length == 0 &&
          this.objectMenus[this.activeSubmenuId].length != 0
        ) {
          const index = this.selectedOptionSubMenu.indexOf(item?.name);
          if (index >= 0) {
            this.selectedOptionSubMenu.splice(index, 1);
          }
        }
      }
    } else {
    }
    return this.selectedOptionSubMenu.indexOf(id) > -1;
  }

  existsInner(id) {
    return (
      this.selectedOptioninnerSubMenu[this.activeSubmenuId].indexOf(id) > -1
    );
  }

  isIndeterminate() {
    return this.selectedOptionSubMenu.length > 0 && !this.isChecked();
  }
  isIndeterminateInner(item: any) {
    if (item == this.activeSubmenuId) {
      return (
        this.selectedOptioninnerSubMenu[this.activeSubmenuId].length > 0 &&
        !this.isCheckedInner()
      );
    } else {
      return false;
    }
  }

  isCheckedInner(i = "") {
    if (this.selectedOptioninnerSubMenu[this.activeSubmenuId].length > 0) {
      return (
        this.selectedOptioninnerSubMenu[this.activeSubmenuId].length ===
        this.objectMenus[this.activeSubmenuId].length
      );
    } else {
      return false;
    }
  }

  isChecked() {
    return (
      this.selectedOptionSubMenu.length ===
      this.objectKeys(this.menuWiseSubmenu).length
    );
  }

  toggleAll(event: MatCheckboxChange) {
    if (event.checked) {
      this.objectKeys(this.menuWiseSubmenu).forEach(
        (pharmacy: any, index: any) => {
          if (
            this.selectedOptionSubMenu.indexOf(
              this.menuWiseSubmenu[pharmacy].name
            ) == -1
          ) {
            this.selectedOptionSubMenu.push(
              this.menuWiseSubmenu[pharmacy].name
            );
          }
          this.objectMenus[index].forEach((ele: any) => {
            if (
              this.selectedOptioninnerSubMenu[index].indexOf(ele?.name) == -1
            ) {
              this.selectedOptioninnerSubMenu[index].push(ele?.name);
            }
          });
        }
      );
    } else {
      this.selectedOptionSubMenu.forEach((ele: any, index) => {
        this.selectedOptioninnerSubMenu[index].length = 0;
      });

      this.selectedOptionSubMenu.length = 0;
    }
  }

  toggleInner(item, event: MatCheckboxChange) {
    if (event.checked) {
      if (
        this.selectedOptioninnerSubMenu[this.activeSubmenuId].indexOf(
          item?.name
        ) == -1
      ) {
        this.selectedOptioninnerSubMenu[this.activeSubmenuId].push(item?.name);
      }
    } else {
      const index = this.selectedOptioninnerSubMenu[
        this.activeSubmenuId
      ].indexOf(item?.name);
      if (index >= 0) {
        this.selectedOptioninnerSubMenu[this.activeSubmenuId].splice(index, 1);
      }
    }
    // this.association_group_selected_insuranceService = this.selectedOptionSubMenu.join(",");
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.activeSubmenuId;
    this.activeSubmenuIdsubmenu;
    this.objectMenus = [];
    this.menuWiseSubmenu = [];
  }

  openVerticallyCenteredsubscription_commit(Subscription: any) {
    this.modalService.open(Subscription, {
      centered: true,
      size: "md",
      windowClass: "permission_commit",
    });
  }

  openVerticallyCenteredstaffmanagement_commit(staffmanagement: any) {
    this.modalService.open(staffmanagement, {
      centered: true,
      size: "md",
      windowClass: "permission_commit",
    });
  }

  openVerticallyCenteredrevenuemanagement_commit(revenuemanagement: any) {
    this.modalService.open(revenuemanagement, {
      centered: true,
      size: "md",
      windowClass: "permission_commit",
    });
  }

  openVerticallyCenteredmedicineclaims_commit(medicineclaims: any) {
    this.modalService.open(medicineclaims, {
      centered: true,
      size: "md",
      windowClass: "permission_commit",
    });
  }

  openVerticallyCenteredpaymenthistory_commit(paymenthistory: any) {
    this.modalService.open(paymenthistory, {
      centered: true,
      size: "md",
      windowClass: "permission_commit",
    });
  }

  openVerticallyCenteredpaymentratingandreviews_commit(ratingandreviews: any) {
    this.modalService.open(ratingandreviews, {
      centered: true,
      size: "md",
      windowClass: "permission_commit",
    });
  }

  openVerticallyCenteredpaymentCommunication_commit(Communication: any) {
    this.modalService.open(Communication, {
      centered: true,
      size: "md",
      windowClass: "permission_commit",
    });
  }

  openVerticallyCenteredpaymentmailbox_commit(mailbox: any) {
    this.modalService.open(mailbox, {
      centered: true,
      size: "md",
      windowClass: "permission_commit",
    });
  }

  openVerticallyCenteredpaymentlogs_commit(logs: any) {
    this.modalService.open(logs, {
      centered: true,
      size: "md",
      windowClass: "permission_commit",
    });
  }

  openVerticallyCenteredpaymentcomplaintmanagement_commit(
    complaintmanagement: any
  ) {
    this.modalService.open(complaintmanagement, {
      centered: true,
      size: "md",
      windowClass: "permission_commit",
    });
  }

  openVerticallyCenteredpaymentmedicalproductstests_commit(
    medicalproductstests: any
  ) {
    this.modalService.open(medicalproductstests, {
      centered: true,
      size: "md",
      windowClass: "permission_commit",
    });
  }

  // navigate() {
  //   this.router.navigateByUrl("/pharmacy/roleandpermission/view");
  // }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  // private getAllStaff() {
  //   this._insuranceService.gettAllStaffListing({for_user:this.userID}).subscribe({
  //     next: (result: any) => {
  //       const decryptedData = this._coreService.decryptObjectData(result);
  //       this.staffList = decryptedData.body;
  //       // this.staffData = decryptedData.body;
  //     },
  //     error: (err: ErrorEvent) => {
  //       this._coreService.showError("", "Staff Load Failed");
  //     },
  //   });
  // }

  getStaffList() {
    let params = {
      portalId: this.userID,
      type: this.userType,
    };
    this.fourPortalService
      .getAllStaffWithoutPagination(params)
      .subscribe((res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          let staffArray = [];

          // response?.body.forEach((element) => {
          //   staffArray.push({
          //     staffName: element?.profileinfos?.name,
          //     id: element?.profileinfos?.for_portal_user,
          //   });
          // });

          response?.body.map((curentval, index: any) => {
            if (curentval?.staffprofiles?.for_portal_user !== null) {
              if (
                this.staffList.indexOf({
                  label: curentval?.staffprofiles?.name,
                  value: curentval?.staffprofiles?.for_portal_user,
                }) == -1
              ) {
                staffArray.push({
                  label: curentval?.staffprofiles?.name,
                  value: curentval?.staffprofiles?.for_portal_user,
                });
              }
            }
          });
          this.staffList = staffArray;

          // response?.body.map((curentval, index: any) => {
          //   staffArray.push({
          //     label: curentval?.profileinfos?.name,
          //     value: curentval?.profileinfos?.for_portal_user,
          //   });
          // });
        }
      });
  }

  assignSubmit() {
    var childrenarraynew = {};
    var menuarray = {};
    this.selectedMenuItem.forEach((element: any, index: any) => {
      var objData1 = Object.keys(element)[0];
      var submenuidmenu_order = "";
      this.alllogindata.forEach((element111: any) => {
        if (element111.menu_id._id == objData1) {
          submenuidmenu_order = element111.menu_order;
        }
      });
      if (submenuidmenu_order != "" && element.isMenuSelected) {
        menuarray[objData1] = submenuidmenu_order;
      }

      if (this.selectedMenuItem[index][objData1].length > 0) {
        var newarray = [];
        this.selectedMenuItem[index][objData1].forEach((element1: any) => {
          var objData11 = Object.keys(element1)[0];
          if (element1.isChildKey && element1.isFinalStatus) {
            var submenuid = "";
            this.alllogindata.forEach((element111: any) => {
              if (element111.menu_id.name == element1.name) {
                submenuid = element111.menu_id._id;
              }
            });
            if (submenuid != "") {
              newarray.push(submenuid);
            }
          }
        });
        if (newarray.length > 0) {
          childrenarraynew[objData1] = newarray;
        }
      }
    });
    var completeSubmenuData = [];

    this.selectedMenuItem.forEach((ele1) => {
      let subKey = {};

      let objData = Object.keys(ele1)[0];
      if (ele1[objData].length > 0 && ele1.isMenuSelected) {
        subKey["parent_id"] = objData;
        subKey["module_type"] = this.userType;
        subKey["isChildKey"] = true;
        subKey["status"] = true;

        let otherKeys = {};
        ele1[objData].forEach((ele2) => {
          if (ele2.isFinalStatus) {
            let objDataOtherKey = Object.keys(ele2)[0];
            subKey["isChildKey"] = ele2.isChildKey;
            otherKeys[objDataOtherKey] = {
              name: ele2.name,
              isChild: ele2[objDataOtherKey].length > 0 ? true : false,
              inner_menu: ele2[objDataOtherKey],
            };
          }
        });

        subKey["submenu"] = otherKeys;
        completeSubmenuData.push(subKey);
      }
    });

    const data = {
      menu_array: menuarray,
      children_array: childrenarraynew,
      user_id: this.staffID,
    };

    if (this.staffID) {
      this.staffError = false;
      this.fourPortalService.asignMenuSubmit(data).subscribe(
        (res: any) => {
          const decryptedData = this._coreService.decryptObjectData(res);
          if (decryptedData.status) {
            this._coreService.showSuccess(decryptedData.message, "Success");
            this.saveSubMenusInfo(completeSubmenuData);
          } else {
            this._coreService.showError(decryptedData.message, "");
          }
        },
        (err) => {
          console.log(err);
        }
      );
    } else {
      this.staffError = true;
    }
  }

  saveSubMenusInfo(data) {
    let datatoPass = {
      portal_user_id: this.staffID,
      permission_data: data,
      module_name: "labradio",
    };

    this.fourPortalService
      .addSubmenusInfo(datatoPass)
      .subscribe((response: any) => {
        let subMenuInfos = this._coreService.decryptObjectData(response);
      });
  }
  getLoginMenus() {
    this.selectedMenuItem = [];
    const params = {
      module_name: "superadmin",
      user_id: this.userID,
    };
    return new Promise(async (resolve, reject) => {
      this.doctorService.getUserMenus(params).subscribe(
        async (res: any) => {
          const decryptedData = this._coreService.decryptObjectData(res);

          this.alllogindata = decryptedData.body;
          const parendData = [];
          const childrenArray = {};
          for (const data of decryptedData.body) {
            if (
              data.menu_id.name != "Staff Management" &&
              data.menu_id.name != "Role Permissions"
            ) {
              if (data.parent_id === "") {
                const menuobj = {};
                menuobj[data.menu_id._id] = [];
                menuobj["isMenuSelected"] = false;
                this.selectedMenuItem.push(menuobj);

                parendData.push({
                  id: data.menu_id._id,
                  name: data.menu_id.name,
                  menu_order: data.menu_id.menu_order,
                  parent_id: data.menu_id.parent_id,
                });
              } else {
                if (data.menu_id.parent_id in childrenArray) {
                  let val = childrenArray[data.menu_id.parent_id];

                  val.push(data.menu_id._id);

                  childrenArray[data.menu_id.parent_id] = val;
                } else {
                  childrenArray[data.menu_id.parent_id] = [data.menu_id._id];
                }
              }
            }
          }

          await this.getAllSubmenus();

          this.allMenus = parendData;
          this.children = childrenArray;

          resolve(true);
        },
        (err) => {
          reject(true);
          console.log(err);
        }
      );
    });
  }
  private getAllMenus() {
    const params = {
      module_name: "superadmin",
      module_type: this.userType,
    };
    this.fourPortalService.getAllMenus(params).subscribe(
      (res: any) => {
        const decryptedData = this._coreService.decryptObjectData(res);
        const data = [];
        const childrenArray = {};
        for (const menu of decryptedData.body) {
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
      // this.menuCheckedArray[menuID] = order;
      var checkIndex;
      this.selectedMenuItem.forEach((element: any, index: any) => {
        var objData = Object.keys(element)[0];
        if (objData == menuID) {
          checkIndex = index;
        }
      });
      this.selectedMenuItem[checkIndex].isMenuSelected = true;
      var sunMenuLength = this.selectedMenuItem[checkIndex][menuID].length;
      if (sunMenuLength > 0) {
        this.selectedMenuItem[checkIndex][menuID].forEach(
          (element1: any, index1: any) => {
            var objData1;

            this.selectedMenuItem[checkIndex][menuID][index1].isFinalStatus =
              true;
            this.selectedMenuItem[checkIndex][menuID].forEach(
              (element2: any, index2: any) => {
                objData1 = Object.keys(element2)[0];
                var subMenuLength1 = element2[objData1].length;

                if (subMenuLength1 > 0) {
                  element2[objData1].forEach((element3: any, index3: any) => {
                    this.selectedMenuItem[checkIndex][menuID][index2][objData1][
                      index3
                    ].status = true;
                  });
                }
              }
            );
          }
        );
      }
    } else {
      // for (const key in this.menuCheckedArray) {
      //   const getOrder = this.menuCheckedArray[key];
      //   if (getOrder === order) {
      //     delete this.menuCheckedArray[key];
      //   }
      // }
      var checkIndex;
      this.selectedMenuItem.forEach((element: any, index: any) => {
        var objData = Object.keys(element)[0];

        if (objData == menuID) {
          checkIndex = index;
        }
      });

      this.selectedMenuItem[checkIndex].isMenuSelected = false;
      var sunMenuLength = this.selectedMenuItem[checkIndex][menuID].length;
      if (sunMenuLength > 0) {
        this.selectedMenuItem[checkIndex][menuID].forEach(
          (element1: any, index1: any) => {
            var objData1;

            this.selectedMenuItem[checkIndex][menuID][index1].isFinalStatus =
              false;
            this.selectedMenuItem[checkIndex][menuID].forEach(
              (element2: any, index2: any) => {
                objData1 = Object.keys(element2)[0];
                var subMenuLength1 = element2[objData1].length;

                if (subMenuLength1 > 0) {
                  element2[objData1].forEach((element3: any, index3: any) => {
                    this.selectedMenuItem[checkIndex][menuID][index2][objData1][
                      index3
                    ].status = false;
                  });
                }
              }
            );
          }
        );
      }
    }
  }

  checkedmainMenuArray(menuid) {
    var checkIndex;
    this.selectedMenuItem.forEach((element: any, index: any) => {
      var objData = Object.keys(element)[0];
      if (objData === menuid) {
        checkIndex = element.isMenuSelected;
      }
    });

    return checkIndex;
  }

  checkedmainMenuArrayintermidiate(menuid) {
    var checksubmenutreu = [];
    var checksubmenufalse = [];
    var checksubmenutreu = [];
    var checkIndex = false;
    this.selectedMenuItem.forEach((element: any, index: any) => {
      var objData = Object.keys(element)[0];
      if (objData == menuid) {
        if (!element.isMenuSelected) {
          checkIndex = true;
        }
        if (element[menuid].length > 0) {
          element[menuid].forEach((element1: any, index1: any) => {
            var objData1 = Object.keys(element1)[0];
            if (!element1.isFinalStatus) {
              checkIndex = true;
              checksubmenufalse.push(true);
            } else {
              checksubmenutreu.push(true);
            }

            if (checksubmenutreu.length > 0) {
              checkIndex = false;
            }

            if (checksubmenutreu.length > 0) {
              element.isMenuSelected = true;
            } else {
              element.isMenuSelected = false;
            }

            if (element1[objData1].length > 0) {
              element1[objData1].forEach((element2: any, index2: any) => {
                if (!element2.status) {
                  checkIndex = true;
                } else {
                  checksubmenutreu.push(true);
                }
                if (checksubmenutreu.length > 0) {
                  checkIndex = false;
                }
                if (checksubmenutreu.length > 0) {
                  element.isMenuSelected = true;
                } else {
                  element.isMenuSelected = false;
                }
              });
            }
          });
        }
        if (element[menuid].length == checksubmenufalse.length) {
          checkIndex = null;
        }
      }
    });
    return checkIndex;
  }

  checkedsubMenuArray(menuid, submenu) {
    var checkIndex;
    this.selectedMenuItem.forEach((element: any, index: any) => {
      var objData = Object.keys(element)[0];
      if (objData == menuid) {
        if (element[menuid].length > 0) {
          element[menuid].forEach((element1: any, index1: any) => {
            var objData1 = Object.keys(element1)[0];
            if (objData1 == submenu) {
              checkIndex = element1.isFinalStatus;
            }
          });
        }
      }
    });
    return checkIndex;
  }

  checkedinnerMenuArrayintermidiate(menuid, submenu) {
    var checkIndex = false;
    if (this.activeSubmenuIdsubmenu) {
      this.selectedMenuItem.forEach((element: any, index: any) => {
        var objData = Object.keys(element)[0];
        if (objData == menuid) {
          if (element[menuid].length > 0) {
            element[menuid].forEach((element1: any, index1: any) => {
              var checksubmenutreu = [];
              var checksubmenufalse = [];
              var objData1 = Object.keys(element1)[0];
              if (objData1 == this.activeSubmenuIdsubmenu) {
                if (element1[objData1].length > 0) {
                  element1[objData1].forEach((element2: any, index2: any) => {
                    if (!element2.status) {
                      checkIndex = true;
                      checksubmenufalse.push(true);
                    } else {
                      checksubmenutreu.push(true);
                    }
                    if (checksubmenutreu.length > 0) {
                      checkIndex = false;
                    }

                    if (checksubmenutreu.length > 0) {
                      element1.isFinalStatus = true;
                    } else {
                      element1.isFinalStatus = false;
                    }
                  });
                }
                if (element1[objData1].length == checksubmenufalse.length) {
                  checkIndex = null;
                }
              }
            });
          }
        }
      });
    } else {
      checkIndex = null;
    }
    return checkIndex;
  }

  checkedinnnersubMenuArray(menuid, submenu, innersubmenuslug) {
    var checkIndex;
    this.selectedMenuItem.forEach((element: any, index: any) => {
      var objData = Object.keys(element)[0];
      if (objData == menuid) {
        if (element[menuid].length > 0) {
          element[menuid].forEach((element1: any, index1: any) => {
            var objData1 = Object.keys(element1)[0];
            if (objData1 == submenu) {
              if (element1[submenu].length > 0) {
                element1[submenu].forEach((element2: any, index2: any) => {
                  if (element2.slug == innersubmenuslug) {
                    checkIndex = element2.status;
                  }
                });
              }
              // checkIndex=element1.isFinalStatus;
            }
          });
        }
      }
    });
    return checkIndex;
  }

  removesubmenu(menuid, submenu, event) {
    if (event.checked) {
      this.selectedMenuItem.forEach((element: any, index: any) => {
        var objData = Object.keys(element)[0];
        if (objData == menuid) {
          if (element[menuid].length > 0) {
            element[menuid].forEach((element1: any, index1: any) => {
              var objData1 = Object.keys(element1)[0];
              if (objData1 == submenu) {
                element1.isFinalStatus = true;
                if (element1[submenu].length > 0) {
                  element1[submenu].forEach((element2: any, index2: any) => {
                    element2.status = true;
                  });
                }
                // element1.isFinalStatus=false;
              }
              var checkfalsecount = 0;
              element[menuid].forEach((element3: any, index3: any) => {
                if (!element3.isFinalStatus) {
                  checkfalsecount++;
                }
              });

              if (checkfalsecount == element[menuid].length) {
                element.isMenuSelected = false;
              } else {
                element.isMenuSelected = true;
              }
            });
          }
        }
      });
    } else {
      this.selectedMenuItem.forEach((element: any, index: any) => {
        var objData = Object.keys(element)[0];
        if (objData == menuid) {
          if (element[menuid].length > 0) {
            element[menuid].forEach((element1: any, index1: any) => {
              var objData1 = Object.keys(element1)[0];
              if (objData1 == submenu) {
                element1.isFinalStatus = false;
                if (element1[submenu].length > 0) {
                  element1[submenu].forEach((element2: any, index2: any) => {
                    element2.status = false;
                  });
                }
                var checkfalsecount = 0;
                element[menuid].forEach((element3: any, index3: any) => {
                  if (!element3.isFinalStatus) {
                    checkfalsecount++;
                  }
                });

                if (checkfalsecount == element[menuid].length) {
                  element.isMenuSelected = false;
                } else {
                  element.isMenuSelected = true;
                }

                // element1.isFinalStatus=false;
              }
            });
          }
        }
      });
    }
  }

  removeinnersubmenu(menuid, submenu, innersubmenu, event) {
    if (event.checked) {
      this.selectedMenuItem.forEach((element: any, index: any) => {
        var objData = Object.keys(element)[0];
        if (objData == menuid) {
          if (element[menuid].length > 0) {
            element[menuid].forEach((element1: any, index1: any) => {
              var objData1 = Object.keys(element1)[0];
              if (objData1 == submenu) {
                if (element1[submenu].length > 0) {
                  element1[submenu].forEach((element2: any, index2: any) => {
                    if (innersubmenu == element2.slug) {
                      element2.status = true;
                    }
                  });
                }
                var checkfalsecount = 0;
                element1[submenu].forEach((element3: any, index3: any) => {
                  if (!element3.status) {
                    checkfalsecount++;
                  }
                });

                if (checkfalsecount == element1[submenu].length) {
                  element1.isFinalStatus = false;
                } else {
                  element1.isFinalStatus = true;
                }

                // element1.isFinalStatus=false;
              }
            });

            var checkSubmenuFalseCount = 0;
            element[menuid].forEach((element4: any, index4: any) => {
              if (!element4.isFinalStatus) {
                checkSubmenuFalseCount++;
              }
            });

            if (checkSubmenuFalseCount == element[menuid].length) {
              element.isMenuSelected = false;
            } else {
              element.isMenuSelected = true;
            }
          }
        }
      });
    } else {
      this.selectedMenuItem.forEach((element: any, index: any) => {
        var objData = Object.keys(element)[0];
        if (objData == menuid) {
          if (element[menuid].length > 0) {
            element[menuid].forEach((element1: any, index1: any) => {
              var objData1 = Object.keys(element1)[0];
              if (objData1 == submenu) {
                if (element1[submenu].length > 0) {
                  element1[submenu].forEach((element2: any, index2: any) => {
                    if (innersubmenu == element2.slug) {
                      element2.status = false;
                    }
                  });
                }
                var checkfalsecount = 0;
                element1[submenu].forEach((element3: any, index3: any) => {
                  if (!element3.status) {
                    checkfalsecount++;
                  }
                });

                if (checkfalsecount == element1[submenu].length) {
                  element1.isFinalStatus = false;
                }
              }
            });

            var checkSubmenuFalseCount = 0;
            element[menuid].forEach((element4: any, index4: any) => {
              if (!element4.isFinalStatus) {
                checkSubmenuFalseCount++;
              }
            });

            if (checkSubmenuFalseCount == element[menuid].length) {
              element.isMenuSelected = false;
            } else {
              element.isMenuSelected = true;
            }
          }
        }
      });
    }
  }

  falseAllMenu(data) {
    data.forEach((el: any) => {
      el.isMenuSelected = false;
      let objectData = Object.keys(el)[0];
      if (el[objectData].length > 0) {
        el[objectData].forEach((ele) => {
          ele.isFinalStatus = false;

          let newObj = Object.keys(ele)[0];

          if (ele[newObj].length > 0) {
            ele[newObj].forEach((element) => {
              element.status = false;
            });
          }
        });
      }
    });
  }

  public handleStaffChange(value: any) {
    // this.selectedMenuItem = [];
    // this.getLoginMenus();
    this.selectall = false;

    if (value) {
      this.staffID = value.value;
      this.getUserMenus();
      this.staffError = false;
    } else {
      this.falseAllMenu(this.selectedMenuItem);
      this.staffID = "";
      this.checkedMenuArray = [];
    }
  }
  private getUserMenus() {
    this.falseAllMenu(this.selectedMenuItem);

    const params = {
      module_name: "superadmin",
      user_id: this.staffID,
    };
    this.fourPortalService.getUserMenus(params).subscribe(
      (res: any) => {
        const decryptedData = this._coreService.decryptObjectData(res);

        if (decryptedData?.status) {
          for (const data of decryptedData.body) {
            if (!data.parent_id) {
              var parentid = data.menu_id._id;

              this.selectedMenuItem.forEach((element: any, index: any) => {
                var objData1 = Object.keys(element)[0];

                if (objData1 == parentid) {
                  this.selectedMenuItem[index].isMenuSelected = true;
                } else {
                }
              });
            } else {
              var parentid = data.parent_id;
              var parentidmenuname = data.menu_id.name;
              this.selectedMenuItem.forEach((element1: any, index1: any) => {
                var objData1 = Object.keys(element1)[0];

                if (objData1 == parentid) {
                  this.selectedMenuItem[index1][parentid].forEach(
                    (element2: any, index2: any) => {
                      if (
                        parentidmenuname ==
                        this.selectedMenuItem[index1][parentid][index2].name
                      ) {
                        this.selectedMenuItem[index1][parentid][
                          index2
                        ].isFinalStatus = true;
                      }
                    }
                  );
                } else {
                }
              });
            }
          }
          this.submenudatabyuser();
        }
        // this.checkedMenuArray = checkedData;
      },
      (err) => {
        console.log(err);
      }
    );
  }
  submenudatabyuser() {
    this.fourPortalService
      .submenudatabyuser({
        user_id: this.staffID,
        module_name: "labradio",
      })
      .subscribe((result: any) => {
        var decodedata = this._coreService.decryptObjectData(result);
        if (decodedata?.status) {
          let userPermission = decodedata.body.user_permissions.permissions;
          this.selectedMenuItem.forEach((element: any, index: any) => {
            var objData1 = Object.keys(element)[0];
            userPermission.forEach((element1: any, index1: any) => {
              if (objData1 == element1.parent_id) {
                this.selectedMenuItem[index][objData1].forEach(
                  (element2: any, index2: any) => {
                    var objData11 = Object.keys(element2)[0];
                    for (let key in userPermission[index1]["submenu"]) {
                      if (objData11 == key) {
                        this.selectedMenuItem[index][objData1][
                          index2
                        ].isFinalStatus = true;

                        this.selectedMenuItem[index][objData1][index2][
                          objData11
                        ] =
                          userPermission[index1]["submenu"][key]["inner_menu"];
                      }
                    }
                  }
                );
              }
            });
          });
        }
      });
  }

  getAllSubmenus() {
    const params = {
      module_name: "superadmin",
      module_type: this.userType,
    };
    return new Promise((resolve, reject) => {
      this.fourPortalService.getAllSubMenus(params).subscribe((res: any) => {
        const decryptedData = this._coreService.decryptObjectData(res);
        this.allSubmenuesData = decryptedData.body;

        this.allSubmenuesData.forEach((data: any) => {
          var submenuArray = [];
          var indexItem;
          for (let ele in data.submenu) {
            const obj = {};

            data.submenu[ele].inner_submenu.forEach((item: any, index: any) => {
              item["status"] = false;
              data.submenu[ele].inner_submenu[index] = item;
            });

            obj[ele] = data.submenu[ele].inner_submenu;
            obj["isChildKey"] = data.isChildKey;
            obj["name"] = data.submenu[ele].name;
            obj["isFinalStatus"] = false;
            submenuArray.push(obj);
          }

          this.selectedMenuItem.forEach((element: any, index: any) => {
            var objData = Object.keys(element)[0];
            if (objData == data.parent_id) {
              indexItem = index + 1;
            }
          });

          if (indexItem) {
            this.selectedMenuItem[indexItem - 1][data.parent_id] = submenuArray;
          }
        });
        resolve(true);
      });
    });
  }

  makeJSONAll(value: any) {
    this.selectall = true;
    this.allMenus.forEach((ele) => {
      this.makeJSON(value, ele.id, ele.menu_order);
    });
  }

  //  Add Role modal
  openVerticallyCenteredaddrole(addrolecontent: any) {
    this.modalService.open(addrolecontent, {
      centered: true,
      size: "md",
      windowClass: "add_role",
    });
  }

  get roleFormControl(): { [key: string]: AbstractControl } {
    return this.roleForm.controls;
  }

  addRole() {
    this.isSubmitted = true;
    if (this.roleForm.invalid) {
      return;
    }
    this.roleForm.value["userId"] = this.userID;
    this.loader.start();
    // let reqData = {
    //   name: this.roleForm.value["name"],
    //   status: this.roleForm.value["status"],
    //   userId: this.roleForm.value["userId"],
    //   type : this.userType
    // };
    let reqData = {
      rolesArray: this.roleForm.value.roles,
      for_user: this.roleForm.value["userId"],
      type: this.userType,
    };
    this.fourPortalService.addRole(reqData).subscribe(
      (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        if (result.status) {
          this.loader.stop();
          this._coreService.showSuccess(result.message, "");
          this.roleForm.markAsUntouched();
          this.roleForm.reset(this.initialValue);
          this.handleClose();
          this._route.navigate([
            `/portals/rolepermission/${this.route_type}/view`,
          ]);
        } else {
          this.loader.stop();
          this._coreService.showError("", result?.message);
        }
      },
      (error) => {
        this.loader.stop();
      }
    );
  }

  public handleClose() {
    let modalRespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalRespose);
    this.roleForm.reset(this.initialValue);
  }
  routeToView() {
    this._route.navigate([`/portals/rolepermission/${this.route_type}/view`]);
  }

  newRoleForm(): FormGroup {
    return this.fb.group({
      name: ["", [Validators.required]],
      status: [true],
    });
  }

  get roles(): FormArray {
    return this.roleForm.get("roles") as FormArray;
  }

  addnewRole() {
    this.roles.push(this.newRoleForm());
  }

  removeRole(i: number) {
    this.roles.removeAt(i);
  }
  onNavigate(url: any): void {
    const menuitems = JSON.parse(localStorage.getItem("activeMenu"));
    this.currentUrl = url;

    const matchedMenu = menuitems.find(
      (menu) => menu.route_path === this.currentUrl
    );
    this._route.navigate([url]).then(() => {
      this.doctorService.setActiveMenu(matchedMenu.name);
    });
  }
}
