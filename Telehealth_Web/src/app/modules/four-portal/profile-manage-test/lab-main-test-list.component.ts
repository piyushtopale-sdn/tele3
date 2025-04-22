import { Component, ViewEncapsulation, ViewChild, } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "src/app/shared/core.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import * as XLSX from "xlsx";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { LabimagingdentalopticalService } from "../../super-admin/labimagingdentaloptical.service";
import { IndiviualDoctorService } from "../../individual-doctor/indiviual-doctor.service";
import { Router } from "@angular/router";
import { SuperAdminService } from "../../super-admin/super-admin.service";


@Component({
  selector: 'app-lab-main-test-list',
  templateUrl: './lab-main-test-list.component.html',
  styleUrls: ['./lab-main-test-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LabMainTestListComponent {
  pendingdataSource: any = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  portalId: any;
  tabNumber: number;
  labUserList: any = [];
  superAdminId: any;

  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;
  isSubmitted: boolean = false;
  searchText = "";
  startDate: string = null;
  endDate: string = null;
  pendingdisplayedColumns: string[] = [];
  displayedColumns: string[] = [
    "test", "subTest", "action"];

  sortColumn: string = 'testName';
  sortOrder: 1 | -1 = -1;
  loincCodeList:any = []
  selectedLoinc:any = '';  couponList: any = [];
  selectedCouponCode: any;
  couponCodeList:any = [];
  sortIconClass: string = 'arrow_upward';
  innerMenuPremission: any = [];
  loginrole: any;
  labTestForm: FormGroup
  testResults: any = [];
  deleted_test: any;
  updateTest_id: any;
  userID: any;
  currentUrl:any=[]
  slectedLonicCode: any;

  constructor(
    private modalService: NgbModal,
    private coreService: CoreService,
    private fb: FormBuilder,
    private lad_radioService: LabimagingdentalopticalService,
    private loader: NgxUiLoaderService,
    private service: IndiviualDoctorService,
    private super_service: SuperAdminService,
    private route: Router,
  ) {
    this.loginrole = this.coreService.getLocalStorage("adminData").role;
    let loginUser = this.coreService.getLocalStorage('loginData')
    if(this.loginrole === "ADMIN"){
      this.userID = "";
    }else{
      this.userID = loginUser?._id;
    }
    this.labTestForm = this.fb.group({
      centre_name: ["", [Validators.required]],
      testName: ["", [Validators.required]],
      selectedTest: ["", [Validators.required]],
      notes: [""],
      loincCode:["",[Validators.required]],
      testFees: ["", [Validators.required]],
      couponCode: [""],
    });
  }

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.getTestList(`${column}:${this.sortOrder}`);
 
  }

  ngOnInit(): void {

    this.getLabUserList();
    this.getTestList(`${this.sortColumn}:${this.sortOrder}`);
    this.getTest_nameList();
    this.currentUrl = this.route.url;
    this.onNavigate(this.currentUrl);
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission() {
    let userPermission = this.coreService.getLocalStorage("adminData").permissions;
    if (userPermission) {

      let menuID = sessionStorage.getItem("currentPageMenuID");
      let checkData = this.findObjectByKey(userPermission, "parent_id", menuID)
      if (checkData) {
        if (checkData.isChildKey == true) {
          var checkSubmenu = checkData.submenu;
          if (checkSubmenu.hasOwnProperty("pharmacy")) {
            this.innerMenuPremission = checkSubmenu['pharmacy'].inner_menu;

          } else {
          }
        } else {
          var checkSubmenu = checkData.submenu;
          let innerMenu = [];
          for (let key in checkSubmenu) {
            innerMenu.push({ name: checkSubmenu[key].name, slug: key, status: true });
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
    } else {
      return true;
    }
  }

  getTest_nameList() {
    let reqData = {
      limit: 0
    };

    this.lad_radioService.getLabTestConfigLIstAPi(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.testResults = response?.body?.result;
      }

    });
  }

  getTestList(sort: any = '') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      searchText: this.searchText,
      sort: sort,
      labRadiologyId: this.userID
    };

    this.lad_radioService.getLabTestLIstAPi(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        
        this.pendingdataSource = response?.body?.result;
        this.totalLength = response?.body?.totalRecords;
      }

    });
  }


  exportManageTest() {
    var data: any = [];
    this.pageSize = 0;
    let reqData = {
      page: this.page,  limit:this.pageSize, searchText:this.searchText,
      labId :this.userID
    }
    this.lad_radioService.listLabTestForExport(reqData)
      .subscribe((res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        if (result.status) {
          this.loader.stop();
          var array = [
            "Profile Name",
            "Note",
            "Laboratory Center"
          ];
          data = result.data.array
          data.unshift(array);
          var fileName = 'Laboratory_Tests.xlsx';
          const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
          /* generate workbook and add the worksheet */
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          /* save to file */
          XLSX.writeFile(wb, fileName);
        }
      });
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.labTestForm.reset();
    this.getTestList();
  }

  handleSearchFilter(text: any) {
    this.searchText = text.trim();
    this.getTestList()
  }



  clearFilter() {
    this.searchText = "";
    this.getTestList();
  }

 
  public handlePageEvent(data: { pageIndex: number; pageSize: number }): void {

    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getTestList();

  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  openVerticallyCenteredAddspecialityEditcontent(
    editcontent: any, id:any
  ) {
    this.updateTest_id = id;
    this.getLabTestPatch(this.updateTest_id) 
    this.modalService.open(editcontent, {
      centered: true,
      size: "lg",
      windowClass: "master_modal add_content",
    });
  }


  getLabTestPatch(id: any) {
    let reqData = {
      id: id
    }

    this.lad_radioService.getLabTestBYID(reqData).subscribe({
      next: (result) => {
        let response = this.coreService.decryptObjectData({ data: result });

        if (response.status) {
          let data = response?.body?.result[0];          
          const selectedTestIds = data.tests.map(test => test.testName);          
          this.labTestForm.patchValue({
            testName: data?.testName,
            notes: data?.notes,
            centre_name:data?.labId?.centre_name,
            selectedTest:selectedTestIds,
            testFees: data?.testFees,
            loincCode:data?.loinc?.loincCode,
            couponCode :data?.couponCode[0]?.couponCode
          });
      
          
        } else {
          this.loader.stop();
          this.coreService.showError("", response.message);
        }
      },
      error: (err: ErrorEvent) => {
        this.loader.stop();
        this.coreService.showError("Error", err.error.message);
      },
    });
  }

  getLabUserList() {
    let reqData = {
      limit: 0,
      status: "APPROVED",
      type: "Laboratory"
    };


    this.lad_radioService.laboratoryList(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        const labUserListArray = response?.data?.data
        labUserListArray.map((user) => {
          this.labUserList.push(
            {
              label: user?.centre_name,
              value: user?.for_portal_user?._id
            }
          )
        })
      }

    });
  }


  deleteTest() {
    let reqData = {
      id: this.deleted_test
    }

    this.loader.start();
    this.lad_radioService.deleteLabTestApi(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.loader.stop();
        this.coreService.showSuccess("", response.message);
        this.closePopup();
      } else {
        this.loader.stop();
        this.coreService.showError("", response.message);
      }
    })
  }
  onNavigate(url: any): void {
    const menuitems = JSON.parse(localStorage.getItem("activeMenu"));
    this.currentUrl = url;
  
    const findMenuItem = (menuItems, url) => {
      for (const menu of menuItems) {
        if (menu.route_path === url) {
          return menu; 
        }
  
        if (menu.children && menu.children.length > 0) {
          const matchedChild = findMenuItem(menu.children, url);
          if (matchedChild) {
            return matchedChild;
          }
        }
      }
      return null; 
    };
  
    const matchedMenu = findMenuItem(menuitems, this.currentUrl);
  
    if (matchedMenu) {
      this.route.navigate([url]).then(() => {
        this.service.setActiveMenu(matchedMenu.name);
      });
    } else {
      console.error("No matching menu found for URL:", this.currentUrl);
    }
  }

}