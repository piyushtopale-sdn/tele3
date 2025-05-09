import { Component, ViewEncapsulation,ViewChild,} from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "src/app/shared/core.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { LabimagingdentalopticalService } from "../../labimagingdentaloptical.service";
import { Route, Router } from "@angular/router";
import * as XLSX from "xlsx";
import { SuperAdminService } from "../../super-admin.service";

// Pending request table
export interface PendingPeriodicElement {
  radio_centre: string;
  test: number;
}

@Component({
  selector: 'app-lab-config-list',  
  templateUrl: './lab-config-list.component.html',
  styleUrls: ['./lab-config-list.component.scss'],
  encapsulation: ViewEncapsulation.None,

})
export class LabConfigListComponent {
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
    "lab_centre", "test_name", "type_of_result",
    "high",
    "low",
    "critical_high",
    "critical_low",
    "interpretive_data","action"];

  sortColumn: string = 'for_portal_user.createdAt';
  sortOrder: 1 | -1 = -1;

  sortIconClass: string = 'arrow_upward';
  innerMenuPremission: any = [];
  loginrole: any;
  labtest_configId: any;
  currentUrl:any =[];
  selecteduser: any;  
  selectedFiles: any;
  selectedCentre:any;
  selectedCentreId:any;
  centresList:any;
  overlay = false;



  constructor(
    private modalService: NgbModal,
    private coreService: CoreService,
    private fb: FormBuilder,
    private lad_radioService: LabimagingdentalopticalService,
    private loader: NgxUiLoaderService,
    private route: Router,
    private service: SuperAdminService,

  ) {
    this.loginrole = this.coreService.getLocalStorage("adminData").role;    
  }

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.getTestList(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {
    let adminData = JSON.parse(localStorage.getItem("loginData"));
    this.superAdminId = adminData?._id;
    this.getLabUserList();
    this.getTestList(`${this.sortColumn}:${this.sortOrder}`);

    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 300);
    this.currentUrl = this.route.url;
    this.onNavigate(this.currentUrl);
    this.getAllCentresList();
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
      centreName:this.selectedCentre ?? "",
      sort: sort
    };

    this.lad_radioService.getLabTestConfigLIstAPi(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      
      if (response.status) {
        this.totalLength = response?.body?.totalRecords;
        this.pendingdataSource = response?.body?.result;
      }

    });
  }
  closePopup() {
    this.isSubmitted = false;
    this.modalService.dismissAll("close");
    this.selecteduser = '';
    this.selectedFiles = "";
    this.teamExcelForm.reset(); 
    this.getTestList();
  }

  handleSearchFilter(text: any) {
    this.searchText = text.trim();
    this.page = 1;
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
    this.getTestList("for_portal_user.createdAt:-1");

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
  
  routeToedit(id:any){
    this.route.navigate([`/super-admin/test-configuration/edit-test/${id}`])
  }
exportManageTest() {
    var data: any = [];
    this.pageSize = 0;

    let reqData = {
        centreName: this.selectedCentre || "",
        labId: ''
    }

    this.loader.start();
    this.lad_radioService.getLabTestConfigurationExport(reqData)
        .subscribe((res) => {
            let result = this.coreService.decryptObjectData({ data: res });

            if (result.status) {
                this.loader.stop();

                // Header row (column names)
                var array = [
                    "Test Name",
                    "Note",
                    "Test Configuration"
                ];

                // Mapping result data properly
                let mappedData = result?.body?.result.map(item => [
                    item.testName,        
                    item.labName,         
                    item.testConfiguration 
                ]);

                // Add the header row at the beginning
                data = [array, ...mappedData];

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
  onSelect2Change(event: any): void {    
    this.selecteduser = event.value;
  }

  openVerticallyCenteredimport(importSubTest: any) {
    this.modalService.open(importSubTest, {
      centered: true,
      size: "lg",
      windowClass: "master_modal Import",
    });
  }

  teamExcelForm: FormGroup = new FormGroup({
    subtestfile: new FormControl("", [Validators.required]),
    lab_centre: new FormControl("", [Validators.required])
  });

  excleSubmit() {    
    this.isSubmitted = true;
    if (this.selecteduser === undefined || this.teamExcelForm.invalid ) {
      return;
    }
    this.loader.start();
    const formData = new FormData();
    formData.append("added_by", this.superAdminId);
    formData.append("file", this.selectedFiles);
    formData.append("labId", this.selecteduser);

    this.lad_radioService.bulkImportLabSubTest(formData).subscribe(
      (res: any) => {
        let encryptedData = { data: res };
        let response = this.coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.loader.stop();
          this.coreService.showSuccess("",response.message);
          this.closePopup();
        } else {
          this.loader.stop();
          this.coreService.showError("",response.message);
          this.closePopup();
        }        

      },
      (error: any) => {
        let encryptedData = { data: error.error };
        let response = this.coreService.decryptObjectData(encryptedData);
        if (!response.status) {
          this.coreService.showError("",response.message);
          this.loader.stop();
          this.closePopup();
        }
      }
    );
  }
  fileChange(event) {
    let fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      let file: File = fileList[0];
      this.selectedFiles = file;
    }
  }

  downLoadExcel() {
    const link = document.createElement("a");
    link.setAttribute("target", "_blank");
    link.setAttribute("href", "assets/doc/labsubtest.xlsx");
    link.setAttribute("download", `Labsub_Test.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  onSelect2ChangeLab(event: any): void {
    this.loader.start()
    if (!event?.value || !event?.options?.length) return;

    const selectedOption = event?.options?.[0];

    this.selectedCentre = selectedOption?.label ?? "";
    this.selectedCentreId = selectedOption?.value ?? ""

    if (this.paginator) {
      this.paginator.firstPage();
  }
  if(this.selectedCentre){
    this.getTestList()
    this.loader.stop()
  }
  }
  clearSelect2() {     
    this.loader.start()
    this.selectedCentre = '';
    this.selectedCentreId = '';
    this.pageSize = 10,
    this.getTestList();
    this.loader.stop()
  }
  getAllCentresList(): void {
    let reqData = {
      limit: 0,
      status: "APPROVED",
      type: "Laboratory"
    };
    
    this.lad_radioService.laboratoryList(reqData).subscribe(async (res) => {
    
        const response = await this.coreService.decryptObjectData({ data: res });
        if (response?.status && response?.data?.data?.length) {
          const allLabs = response.data.data.map((lab: any) => ({
            label: lab.centre_name ?? "",
            value: lab._id,
            originalData: lab 
          }));
          
          const uniqueLabsMap = new Map();
          allLabs.forEach(lab => {
            if (!uniqueLabsMap.has(lab.label)) {
              uniqueLabsMap.set(lab.label, lab);
            }
          });
          
          this.centresList = Array.from(uniqueLabsMap.values());
          
        } else {
          this.centresList = [];
        }
      }) 
  }
}