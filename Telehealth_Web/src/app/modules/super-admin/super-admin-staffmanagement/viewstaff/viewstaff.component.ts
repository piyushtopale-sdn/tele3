import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
} from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "src/app/shared/core.service";
import intlTelInput from "intl-tel-input";
import { SuperAdminService } from "../../super-admin.service";
import { IEncryptedResponse } from "src/app/shared/classes/api-response";
import { SuperAdminStaffResponse } from "../addstaff/addstaff.component.type";
import { ToastrService } from "ngx-toastr";
import { ActivatedRoute, Router } from "@angular/router";
import { NgxUiLoaderService } from "ngx-ui-loader";

export interface PeriodicElement {
  staffname: string;
  // username: string;
  role: string;
  phone: string;
  datejoined: string;
}

const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: "app-viewstaff",
  templateUrl: "./viewstaff.component.html",
  styleUrls: ["./viewstaff.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class ViewstaffComponent implements OnInit {
  displayedColumns: string[] = [
    "staffname",
    // "username",
    "role",
    "phone",
    "datejoined",
    "active",
    "lockuser",
    "action",
  ];

  dataSource = ELEMENT_DATA;
  editStaff: any = FormGroup;
  userID: string = "";
  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;
  staffID: any;
  action: string = "";
  actionObject: object = null;
  staffRole: any[] = [];
  isSubmitted: boolean = false;
  // selectedFiles: any = "";
  iti: any;
  selectedCountryCode: any;
  staff_name: any = "";
  role: string = "";
  groupID: any;
  selectedStaff: any[] = [];
  staffProfileUrl: any;
  searchKey: any = "";
  countrycodedb: any = '';
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("countryPhone") countryPhone: ElementRef<HTMLInputElement>;
  adminId: any;
  autoComplete: google.maps.places.Autocomplete;
  loc: any = {};
  selectedLanguages: any = [];

  sortColumn: string = 'staff_name';
  sortOrder: 1 | -1 = 1;
  sortIconClass: string = 'arrow_upward';
  innerMenuPremission:any=[];
  loginrole: any;
  overlay:false;
  locationData : any = {}
  selectedRole: any;
  selected_Role: any;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private _coreService: CoreService,
    private _superAdminService: SuperAdminService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private loader: NgxUiLoaderService
  ) {
    this.editStaff = this.fb.group({
      staff_profile: [""],
      staff_name: [""],
      first_name: ["", [Validators.required]],
      middle_name: [""],
      last_name: ["", [Validators.required]],
      dob: ["", [Validators.required]],
      language: ["", [Validators.required]],
      address: ["", [Validators.required]],
      neighbourhood: [""],
      country: ["", [Validators.required]],
      region: [""],
      province: [""],
      department: [""],
      city: [""],
      village: [""],
      pincode: [""],
      // degree: [""],
      mobile: ["", [Validators.required]],
      email: ["", [Validators.required]],
      role: ["", [Validators.required]],
      // userName: [""],
      about_staff: [""],
    });
    const userData = this._coreService.getLocalStorage("loginData");
    this.loginrole = this._coreService.getLocalStorage("adminData").role;

    this.userID = userData._id;
    this.roleList();
    this.getAllStaff(`${this.sortColumn}:${this.sortOrder}`);
  }


  onSortData(column: any) {
    
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.getAllStaff(`${column}:${this.sortOrder}`);
  }

  /*
 code for country code starts
 */
  onFocus = () => {
    var getCode = this.iti.getSelectedCountryData().dialCode;
    this.selectedCountryCode = "+" + getCode;
  };
  getCountrycodeintlTelInput() {
    var country_code = '';
    const countryData = (window as any).intlTelInputGlobals.getCountryData();
    for (let i = 0; i < countryData.length; i++) {
      if (countryData[i].dialCode === this.countrycodedb.split("+")[1]) {
        country_code = countryData[i].iso2;
        break; // Break the loop when the country code is found
      }
    }
    const input = document.getElementById('mobile') as HTMLInputElement;
    const adressinput = document.getElementById('address') as HTMLInputElement;
    this.iti = intlTelInput(input, {
      initialCountry: country_code,
      separateDialCode: true,
    });
    this.selectedCountryCode = "+" + this.iti.getSelectedCountryData().dialCode;
    const options = {
      fields: [
        "address_components",
        "geometry.location",
        "icon",
        "name",
        "formatted_address",
      ],
      strictBounds: false,
    };
    this.autoComplete = new google.maps.places.Autocomplete(
      adressinput,
      options
    );
    this.autoComplete.addListener("place_changed", (record) => {
      const place = this.autoComplete.getPlace();
      this.loc.type = "Point";
      this.loc.coordinates = [
        place.geometry.location.lng(),
        place.geometry.location.lat(),
      ];
      this.editStaff.patchValue({
        address: place.formatted_address,
        loc: this.loc,
      });
    })
  }
  ngAfterViewInit() {

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

  // private getAllRole() {
  //   this._superAdminService.allRole(this.userID).subscribe((res) => {
  //     let result = this._coreService.decryptObjectData(res);
  //     if (result?.status) {
  //       this.staffRole = result?.body?.data;

  //     }
  //   });
  // }

  roleList() {
    let reqData = {
      page: 1,
      limit: 0,
      searchText: "",
      userId: this.userID,
    };
    this._superAdminService.allRoleSuperAdmin(reqData).subscribe(
      (res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
        const staffRole = response?.body?.data
        staffRole.map((role)=>{
          this.staffRole.push(
            {
              label : role.name,
              value : role._id
            }
          )
        })

      if(!this.editStaff){
        this.selected_Role = this.selectedRole;
      }

      })

  }

  private getSpecificStaffDetails(id) {
    this._superAdminService.getStaffDetails(id).subscribe({
      next: (result: IEncryptedResponse<SuperAdminStaffResponse>) => {
        const staffDetails = this._coreService.decryptObjectData(result);

        this.staffProfileUrl = staffDetails?.data?.documentURL;

        let details = staffDetails?.data?.data[0];
        this.selectedRole = details?.staff_role?._id;
        
        this.selectedLanguages = details.language
        this.locationData = details?.location_id
        
        let city: any = details.location_id.city;
        let dateString: any = new Date(details.dob);
        let dd = String(dateString.getDate()).padStart(2, "0");
        let mm = String(dateString.getMonth() + 1).padStart(2, "0");
        let yyyy = dateString.getFullYear();
        dateString = yyyy + "-" + mm + "-" + dd;
        let address = details.location_id;
        this.getRegionList(address?.country?._id);
        this.getProvienceList(address?.region?._id);
        this.getDepartmentList(address?.province?._id);
        this.getCityList(address?.department?._id);
        this.editStaff.controls["staff_name"].setValue(
          details?.superadmin_id?.first_name + " " + details?.superadmin_id?.middle_name + " " + details?.superadmin_id?.last_name
        );
        this.editStaff.controls["first_name"].setValue(
          details?.superadmin_id?.first_name
        );
        this.editStaff.controls["middle_name"].setValue(
          details?.superadmin_id?.middle_name
        );
        this.editStaff.controls["last_name"].setValue(
          details?.superadmin_id?.last_name
        );
        this.editStaff.controls["dob"].setValue(dateString);
        this.editStaff.controls["language"].setValue(details.language);
        this.editStaff.controls["address"].setValue(
          details?.location_id?.address
        );
        this.editStaff.controls["neighbourhood"].setValue(
          details?.location_id?.neighborhood
        );
        this.editStaff.controls["country"].setValue(address?.country?._id);
        this.editStaff.controls["region"].setValue(address?.region?._id);
        this.editStaff.controls["province"].setValue(address?.province?._id);
        this.editStaff.controls["department"].setValue(address?.department?._id);
        this.editStaff.controls["city"].setValue(address?.city?._id);
        this.editStaff.controls["village"].setValue(address?.village?._id);
        this.editStaff.controls["pincode"].setValue(
          details.location_id.pincode
        );
        // this.editStaff.controls["degree"].setValue(
        //   details.superadmin_id.degree
        // );
        this.editStaff.controls["mobile"].setValue(
          details.superadmin_id?.mobile
        );
        this.editStaff.controls["email"].setValue(details.superadmin_id.email);
        this.editStaff.controls["role"].setValue(details.staff_role._id);
        // this.editStaff.controls["userName"].setValue(
        //   details.superadmin_id.user_name
        // );
        this.editStaff.controls["about_staff"].setValue(details?.about_staff);
        this.countrycodedb = details?.superadmin_id?.country_code;
        this.getCountrycodeintlTelInput();
      },

      error: (err: ErrorEvent) => {
        console.log(err, "err");
      },
    });
  }

  onGroupIconChange(event: any) {
    if (event.target.files && event.target.files[0]) {
      let file = event.target.files[0];
      this.editStaff.patchValue({
        staff_profile: file,
      });
      // this.editStaff.controls["staff_profile"].setValue(file);
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.staffProfileUrl = event.target.result;

      };

      reader.readAsDataURL(event.target.files[0]);
    }
  }

  public handleClose() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.staffID = "";
  }

  //  New Invitation modal
  openVerticallyCenterededitstaff(editstaffcontent: any, _id: any) {
    this.staffID = _id;

    this.groupID = _id;
    this.getSpecificStaffDetails(_id);

    this.modalService.open(editstaffcontent, {
      centered: true,
      size: "xl",
      windowClass: "edit_staffnew",
    });
  }

  ngOnInit(): void {
    let id = this.activatedRoute.snapshot.paramMap.get("id");
    this.staffID = id;

    let loginUser = this._coreService.getLocalStorage("loginData");
    this.adminId = loginUser._id;

    this.getCountryList();
    this.getSpokenLanguage();

    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 2000);
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
  
          if (checkSubmenu.hasOwnProperty("claim-process")) {
            this.innerMenuPremission = checkSubmenu['claim-process'].inner_menu;
  
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
    if (this.loginrole == 'STAFF_USER') {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    }
    else {
      return true;
    }
  }

  get addStaffFormControl(): { [key: string]: AbstractControl } {
    return this.editStaff.controls;
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllStaff();
  }

  private getAllStaff(sort:any ='') {
    // this.isSubmitted = true;
    const params = {
      admin_id: this.userID,
      page: this.page,
      limit: this.pageSize,
      role_id: this.role,
      searchKey: this.searchKey,
      sort:sort
    };
    this._superAdminService.getAllStaff(params).subscribe({
      next: (result: IEncryptedResponse<SuperAdminStaffResponse>) => {
        const decryptedData = this._coreService.decryptObjectData(result);

        const data = [];
        for (const staff of decryptedData.data?.data) {
          data.push({
            staffname: staff.staff_name,
            // username: staff.for_portal_user?.user_name,
            role: staff.role !== undefined ? staff.role.name : "",
            // phone: staff.for_portal_user.mobile,
            phone: staff.for_portal_user?.phone_number,

            datejoined: this._coreService.createDate(new Date(staff.createdAt)),
            id: staff._id,
            is_locked: staff.for_portal_user?.lock_user,
            is_active: staff.for_portal_user?.isActive,
          });
        }

        this.totalLength = decryptedData.data?.totalCount;
        this.dataSource = data;
        // this._coreService.showSuccess("", "Staff loaded successfully");
      },
      error: (err: ErrorEvent) => {
        console.log(err, "err");

        this._coreService.showError("", "Staff Load Failed");
      },
    });
  }

  handleRoleFilter(value: any) {
    this.role = value;
    this.getAllStaff();
  }

  handleSearchFilter(event: any) {
    this.searchKey = event.target.value;
    this.getAllStaff();

  }

  clearFilter() {
    this.searchKey = "",
      this.role = ""
    this.getAllStaff();
  }

  updateStaff() {
    this.isSubmitted = true;
    if (this.editStaff.invalid) {
      this._coreService.showError("", "Please Fill All Fields!")
      return null;
    }
    this.loader.start();
    let formaData: any = new FormData();
    let data = this.editStaff.value;
    formaData.append("staff_profile", data.staff_profile);
    formaData.append("staff_name", data.first_name + " " + data.middle_name + " " + data.last_name);
    formaData.append("first_name", data.first_name);
    formaData.append("middle_name", data.middle_name);
    formaData.append("last_name", data.last_name);
    formaData.append("dob", data.dob);
    formaData.append("language", JSON.stringify(this.selectedLanguages));
    formaData.append("address", data.address);
    formaData.append("neighborhood", data.neighbourhood);
    formaData.append("country", data.country);
    formaData.append("region", data.region ? data.region : "");
    formaData.append("province", data.province ? data.province : "");
    formaData.append("department", data.department ? data.department : "");
    formaData.append("city", data.city ? data.city : "");
    formaData.append("village", data.village ? data.village : "");
    formaData.append("pincode", data.pincode);
    formaData.append("mobile", data.mobile);
    formaData.append("email", data.email);
    formaData.append("about_staff", data?.about_staff);
    formaData.append("id", this.staffID);
    formaData.append("country_code", this.selectedCountryCode);
    formaData.append("userId", this.userID);
    for (let [key, value] of formaData) {
    }
    this._superAdminService.editStaff(formaData).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData(res);
        if (response.status) {
          this.loader.stop();
          this.toastr.success("updated");
          this.closePopup();
          // this.router.navigate(["super-admin/staffmanagement"]);
          this.getAllStaff();

        } else {
          this.toastr.error("failed");
          this.loader.stop();
        }
      },
      (err) => {
        let response = this._coreService.decryptObjectData({ data: err.error });
        this.toastr.error(response.message);
        this.loader.stop();
      }
    );
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  //................................deleteStaff............................
  closePopup() {
    this.modalService.dismissAll("close");
  }

  // handleDeleteGroup(actionValue: boolean, action: any) {
  //   let reqData = {
  //     action: action,
  //     actionValue: actionValue,
  //     id: this.groupID,
  //   };

  //   this._superAdminService
  //     .deleteActiveAndLockStaff(reqData)
  //     .subscribe((res) => {
  //       let response = this._coreService.decryptObjectData(res);
  //       if (response.status) {
  //         this.toastr.success(response.message);
  //         this.getAllStaff();
  //         this.closePopup();
  //       } else {
  //         this.toastr.error(response.message);
  //       }
  //     });
  // }

  // handleToggeleChange(event: any, groupID: any) {
  //   this.groupID = groupID;
  //   this.handleDeleteGroup(event.checked, "lock");
  // }

  // handleCheckBoxChange(event: any, groupID: any) {
  //   this.groupID = groupID;
  //   this.handleDeleteGroup(event.checked, "active");
  // }
  public submitAction() {
    this.loader.start();
    this._superAdminService
      .deleteActiveAndLockStaff(this.actionObject)
      .subscribe({
        next: (result) => {
          const decryptedData = this._coreService.decryptObjectData(result);
          if(decryptedData.status){
            this.loader.stop();
          this.handleClose();
          this.getAllStaff();
          this._coreService.showSuccess(
            "",
            `Successfully ${this.action} Pharmacy staff`
          );
        }
        },
        error: (err: ErrorEvent) => {
          console.log(err, "err");
        },
      });
  }

  // openActionPopup(deleteModal: any, _id: any) {
  //   this.groupID = _id;
  //   this.modalService.open(deleteModal, { centered: true, size: "sm" });
  // }

  public openActionPopup(
    actionPopup: any,
    id: any,
    action: string,
    event: any = null
  ) {
    let status: string;
    if (action === "delete") {
      this.actionObject = {
        action: action,
        actionValue: true,
        id: id,
      };
    } else {
      let child = event.target.firstChild;
      let checked: boolean;
      if (action === "active" || action === "inactive") {
        status = !child.checked ? "active" : "inactive";
        checked = !child.checked;
      } else if (action === "lock" || action === "unlock") {
        if (child) {
          status = !child.checked ? "lock" : "unlock";
          checked = !child.checked;
        } else {
          status = !event.target.parentElement.parentElement.children[0].checked
            ? "lock"
            : "unlock";
          checked =
            !event.target.parentElement.parentElement.children[0].checked;
        }
      }
      this.actionObject = {
        action:
          action === "active" || action === "inactive" ? "active" : action,
        actionValue: checked,
        id: id,
      };
    }
    this.staffID = id;
    this.action = status ? status : action;
    this.modalService.open(actionPopup, { centered: true, size: "lg" });
  }

  //-----Calling address API's---------------
  countryList: any[] = [];
  regionList: any[] = [];
  provienceList: any[] = [];
  departmentList: any[] = [];
  cityList: any[] = [];
  villageList: any[] = [];
  spokenLanguages: any[] = [];

  getSpokenLanguage() {
    this._superAdminService.spokenLanguage().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });

      this.spokenLanguages = response.body?.spokenLanguage;
    });
  }

  getCountryList() {
    this._superAdminService.getcountrylist().subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        const countryList = result.body?.list;
        countryList.map((country)=>{
          this.countryList.push(
            {
              label :country.name,
              value :country._id
            }
          )
        })
        // this.editStaff.get("country").patchValue(this.locationData?.country?._id)
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getRegionList(countryID: any) {
    this.regionList = []
    if (!countryID) {
      return;
    }
    this._superAdminService.getRegionListByCountryId(countryID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        const regionList = result.body?.list;
        regionList.forEach(region => {
          const exists = this.regionList.findIndex(item => item.label === region?.name && item.value === region?._id) !== -1;
          if (!exists) {
            this.regionList.push({
              label: region?.name,
              value: region?._id,
            });
          }
        });
        this.editStaff.get("region").patchValue(this.locationData?.region?._id)      
        
        if(!this.editStaff.get("region").value){
          this.editStaff.get("department").patchValue("")
          this.editStaff.get("city").patchValue("")
          this.editStaff.get("village").patchValue("")
          this.editStaff.get("province").patchValue("")
          }
        
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getProvienceList(regionID: any) {
    this.provienceList = []
    if (!regionID) {
      return;
    }
    this._superAdminService.getProvinceListByRegionId(regionID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        const provienceList = result.body?.list;
        provienceList.forEach(province => {
          const exists = this.provienceList.findIndex(item => item.label === province?.name && item.value === province?._id) !== -1;
          if (!exists) {
            this.provienceList.push({
              label: province?.name,
              value: province?._id,
            });
          }
        });
        this.editStaff.get("province").patchValue(this.locationData?.province?._id)
        if(!this.editStaff.get("province").value){
          this.editStaff.get("department").patchValue("")
          this.editStaff.get("city").patchValue("")
          this.editStaff.get("village").patchValue("")
          }
        
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getDepartmentList(provinceID: any) {
    this.departmentList = []
    if (!provinceID) {
      return;
    }
    this._superAdminService
      .getDepartmentListByProvinceId(provinceID)
      .subscribe({
        next: (res) => {
          let result = this._coreService.decryptObjectData({ data: res });
          const departmentList = result.body?.list;
          departmentList.forEach(department => {
            const exists = this.departmentList.findIndex(item => item.label === department?.name && item.value === department?._id) !== -1;
            if (!exists) {
              this.departmentList.push({
                label: department?.name,
                value: department?._id,
              });
            }
          });
          this.editStaff.get("department").patchValue(this.locationData?.department?._id)
          if(!this.editStaff.get("department").value){
            this.editStaff.get("city").patchValue("")
            this.editStaff.get("village").patchValue("")
            }
        },
        error: (err) => {
          console.log(err);
        },
      });
  }

  getCityList(departmentID: any) {
    this.cityList = []
    this.villageList = []
    if (!departmentID) {
      return;
    }
    this._superAdminService.getCityListByDepartmentId(departmentID).subscribe({
      next: (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        const cityList = result.body.list;
        cityList.forEach(city => {
          const exists = this.cityList.findIndex(item => item.label === city?.name && item.value === city?._id) !== -1;
          if (!exists) {
            this.cityList.push({
              label: city?.name,
              value: city?._id,
            });
          }
        });
        this.editStaff.get("city").patchValue(this.locationData?.city?._id)
      },
      error: (err) => {
        console.log(err);
      },
    });

    this._superAdminService
      .getVillageListByDepartmentId(departmentID)
      .subscribe({
        next: (res) => {
          let result = this._coreService.decryptObjectData({ data: res });
          const villageList = result.body.list;
          villageList.forEach(village => {
            const exists = this.villageList.findIndex(item => item.label === village?.name && item.value === village?._id) !== -1;
            if (!exists) {
              this.villageList.push({
                label: village?.name,
                value: village?._id,
              });
            }
          });
          this.editStaff.get("village").patchValue(this.locationData?.village?._id)
        },
        error: (err) => {
          console.log(err);
        },
      });
  }
  handleRemoveLogo() {
    this.staffProfileUrl = ''
  }


  onSelectionChange(event: any): void {
    this.selectedLanguages = this.editStaff.value.language;

  }

}
