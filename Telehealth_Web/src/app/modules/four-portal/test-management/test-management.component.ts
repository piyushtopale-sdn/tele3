import { Component, ViewEncapsulation, ViewChild, } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "src/app/shared/core.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Route, Router } from "@angular/router";
import * as XLSX from "xlsx";
import { LabimagingdentalopticalService } from "../../super-admin/labimagingdentaloptical.service";
import { IndiviualDoctorService } from "../../individual-doctor/indiviual-doctor.service";
// Pending request table
export interface PendingPeriodicElement {
  radio_centre: string;
  test: number;
}


@Component({
  selector: 'app-test-management',
  templateUrl: './test-management.component.html',
  styleUrls: ['./test-management.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TestManagementComponent {
  pendingdataSource: any = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  portalId: any;
  tabNumber: number;
  labUserList: any = [];
  userID: any;
  dataSource: any = [];
  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;
  isSubmitted: boolean = false;
  searchText = "";
  startDate: string = null;
  endDate: string = null;
  pendingdisplayedColumns: string[] = [];
  displayedColumns: string[] = [];
  isReadOnly = true; 
  sortColumn: string = 'for_portal_user.createdAt';
  sortOrder: 1 | -1 = -1;
  radioTestForm: FormGroup
  radioUserList: any = [];
  studyUserList: any = [];

  sortIconClass: string = 'arrow_upward';
  innerMenuPremission: any = [];
  loginrole: any;
  labtest_configId: any;
  portalType: any;
  currentUrl:any=[]

  constructor(
    private modalService: NgbModal,
    private coreService: CoreService,
    private fb: FormBuilder,
    private lad_radioService: LabimagingdentalopticalService,
    private loader: NgxUiLoaderService,
    private route: Router,
    private service: IndiviualDoctorService,

  ) {
    this.loginrole = this.coreService.getLocalStorage("loginData").role;
    this.portalType = this.coreService.getLocalStorage("loginData").type;
    if( this.loginrole === 'ADMIN'){
      this.userID = ''
    }else{
      this.userID = this.coreService.getLocalStorage("loginData")._id;
    }

    if (this.portalType === "Laboratory") {
      this.displayedColumns = [
        "test_name", "type_of_result",
        "high",
        "low",
        "critical_high",
        "critical_low",
        "interpretive_data", "action"]
    }
    if (this.portalType === "Radiology") {
      this.displayedColumns = [
        "test", "notes", "action"]
    }

    this.radioTestForm = this.fb.group({
      centre_name: ["", [Validators.required]],
      studyTypeId: ["", [Validators.required]],
      test: ["", [Validators.required]],
      loincCode: ["", [Validators.required]],
      testFees: ["", [Validators.required]],
      couponCode: [""],
      notes: [""]
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
    this.getRadioList();
    this.getStudyList();
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 300);
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

  getTestList(sort: any = '') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      searchText: this.searchText,
      sort: sort,
      labRadiologyId: this.userID
    };

    if (this.portalType === "Laboratory") {
      this.lad_radioService.getLabTestConfigLIstAPi(reqData).subscribe(async (res) => {
        let response = await this.coreService.decryptObjectData({ data: res });

        if (response.status) {
          this.totalLength = response?.body?.totalRecords;
          this.pendingdataSource = response?.body?.result;
        }

      });
    }

    if (this.portalType === "Radiology") {
      this.lad_radioService.getRadioTestLIstAPi(reqData).subscribe(async (res) => {
        let response = await this.coreService.decryptObjectData({ data: res });

        if (response.status) {
          this.totalLength = response?.body?.totalRecords;
          this.dataSource = response?.body?.result;
        }

      });
    }
  }


  closePopup() {
    this.modalService.dismissAll("close");
    this.getTestList();
  }

  handleSearchFilter(text: any) {
    this.searchText = text.trim();
    this.page = 1
    this.getTestList()
  }



  clearFilter() {
    this.searchText = "";
    this.getTestList();
  }



  //  Delete modal
  openVerticallyCentereddetale(deletemodal: any, id: any) {
    this.labtest_configId = id;
    this.modalService.open(deletemodal, { centered: true, size: "md" });
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

  openVerticallyCenteredAddspecialityservicecontent(
    addcontent: any
  ) {
    this.modalService.open(addcontent, {
      centered: true,
      size: "lg",
      windowClass: "master_modal add_content",
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
  deleteRadioTest() {
    let reqData = {
      id: this.labtest_configId
    }

    this.loader.start();
    this.lad_radioService.deleteLabTestConfigApi(reqData).subscribe(async (res) => {
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



  /* radio-test-view */
  openVerticallyCenteredViewcontent(
    viewcontent: any, data: any
  ) {
    this.getradioTest(data._id); 

    this.modalService.open(viewcontent, {
      centered: true,
      size: "lg",
      windowClass: "master_modal add_content",
    });

    this.radioTestForm.get('centre_name').disable(); 
    this.radioTestForm.get('studyTypeId').disable(); 

  }

  getradioTest(id: any) {
    let reqData = {
      id: id
    }

    this.lad_radioService.getRadioTestBYID(reqData).subscribe({
      next: (result) => {
        let response = this.coreService.decryptObjectData({ data: result });

        if (response.status) {
          let data = response?.body?.result[0];
          this.radioTestForm.patchValue({
            test: data?.testName,
            notes: data?.notes,
            studyTypeId: data?.studyTypeId,
            centre_name:data?.radiologyId?._id,
            testFees: data?.testFees,
            loincCode: data?.loinc?.loincCode,
            couponCode: data?.couponCode[0]?.couponCode
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

  getRadioList() {
    let reqData = {
      limit: 0,
      status: "APPROVED",
      type: "Radiology"
    };

    this.lad_radioService.laboratoryList(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      
      if (response.status) {
        const radioUserListArray = response?.data?.data
        radioUserListArray.map((user) => {
          this.radioUserList.push(
            {
              label: user?.centre_name,
              value: user?.for_portal_user?._id
            }
          )
        })       
      }

    });
  }

  getStudyList() {
    let reqData = {
      page: 1,
      limit: 0,
      searchText: '',
      status: "active",
    };

    this.lad_radioService.studyTypeList(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      
      if (response.status) {
        let studyUserListArray = response?.body?.result;
        studyUserListArray.map((user) => {
          this.studyUserList.push(
            {
              label: user?.studyTypeName,
              value: user?._id
            }
          )
        })       
      }
    });
  }



  /* lab-test-view */
  routeToview(id: any) {
    this.route.navigate([`/portals/manage-test/Laboratory/lab-test-view/${id}`]);
  }


  exportManageTest() {
    var data: any = [];
    this.pageSize = 0;
    if(this.portalType === 'Radiology'){
      let reqData = {
        page: this.page,  limit:this.pageSize, searchText:this.searchText,
        radioId :this.userID
      }
      this.lad_radioService.listRadioTestForExport(reqData)
        .subscribe((res) => {
          let result = this.coreService.decryptObjectData({ data: res });
          if (result.status) {
            this.loader.stop();
            var array = [
              "Test Name",
              "Note",
              "Radiology Center"
            ];
            data = result.data.array
            data.unshift(array);
            var fileName = 'Radiology_Tests.xlsx';
            const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
            /* generate workbook and add the worksheet */
            const wb: XLSX.WorkBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            /* save to file */
            XLSX.writeFile(wb, fileName);
          }
        });
    }

    if(this.portalType === 'Laboratory'){
      let reqData = {
        page: this.page,  limit:this.pageSize, searchText:this.searchText,
        labId :this.userID
      }
      this.lad_radioService.labTestConfigForExport(reqData)
        .subscribe((res) => {
          let result = this.coreService.decryptObjectData({ data: res });
          
          if (result.status) {
            this.loader.stop();
            var array = [
              "Test Name",
              "Note",
              "Test Configuration"
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

  }
  onNavigate(url: any): void {
    const menuitems = JSON.parse(localStorage.getItem("activeMenu"));
    this.currentUrl = url;

    const matchedMenu = menuitems.find(
      (menu) => menu.route_path === this.currentUrl
    );
    this.route.navigate([url]).then(() => {
      this.service.setActiveMenu(matchedMenu.name);
    });
  }
}