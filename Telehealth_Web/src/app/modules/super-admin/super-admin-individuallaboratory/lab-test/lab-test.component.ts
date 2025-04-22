import { Component, ViewEncapsulation, ViewChild, ChangeDetectorRef, } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "src/app/shared/core.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import * as XLSX from "xlsx";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { LabimagingdentalopticalService } from "../../labimagingdentaloptical.service";
import { SuperAdminService } from "../../super-admin.service";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';

@Component({
  selector: 'app-lab-test',
  templateUrl: './lab-test.component.html',
  styleUrls: ['./lab-test.component.scss'],
  encapsulation: ViewEncapsulation.None,

})
export class LabTestComponent {
  pendingdataSource: any = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
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
    "lab_centre", "test", "action"];

  sortColumn: string = 'for_portal_user.createdAt';
  sortOrder: 1 | -1 = -1;

  sortIconClass: string = 'arrow_upward';
  innerMenuPremission: any = [];
  loginrole: any;
  labTestForm: FormGroup
  testResults: any = [];
  deleted_test: any;
  updateTest_id: any;
  selectedLab: any;
  currentUrl: any = [];
  loincCodeList:any = []
  selectedLoinc:any = '';  couponList: any = [];
  selectedCouponCode: any;
  couponCodeList:any = [];
  selectedFiles: any;
  selecteduser: string | Blob;
  slectedLonicCode: any;
  selectedCentre:any;
  centresList:any;
  filteredCentres: any[] = [];
  overlay = false;
  selectedCentreId: string | null = null;
  searchControl = new FormControl("");
  selectedTestIds:any[] = [];
  noDataFound: boolean = false; 
  isLoadingTests: boolean = false;

  constructor(
    private readonly modalService: NgbModal,
    private readonly coreService: CoreService,
    private readonly fb: FormBuilder,
    private readonly  lad_radioService: LabimagingdentalopticalService,
    private readonly loader: NgxUiLoaderService,
    private readonly route: Router,
    private readonly service: SuperAdminService,
    private readonly datepipe: DatePipe,
    private readonly cdr: ChangeDetectorRef 

  ) {
    this.loginrole = this.coreService.getLocalStorage("adminData").role;

    this.labTestForm = this.fb.group({
      centre_name: ["", [Validators.required]],
      testName: ["", [Validators.required]],
      selectedTest: ["",[Validators.required]],
      loincCode:["",[Validators.required]],
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
    let adminData = JSON.parse(localStorage.getItem("loginData"));
    this.superAdminId = adminData?._id;
    this.getLabUserList();
    this.getTestList(`${this.sortColumn}:${this.sortOrder}`);

    this.currentUrl = this.route.url;
    this.onNavigate(this.currentUrl);
    this.getAllCentresList();

    this.searchControl.valueChanges
    .pipe(debounceTime(300), distinctUntilChanged())
    .subscribe((searchText) => {
      if (this.selectedLab) {
        this.getTest_nameList(this.selectedLab, searchText);
      }
    });

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
        let checkSubmenu = checkData.submenu;
        if (checkData.isChildKey) {
          if (checkSubmenu.hasOwnProperty("pharmacy")) {
            this.innerMenuPremission = checkSubmenu['pharmacy'].inner_menu;

          }
        } else {
         checkSubmenu = checkData.submenu;
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

  getTest_nameList(id: any, searchText: any) {
    if (!id) return;
  
    let reqData = {
      page:1,
      limit: 100,
      labRadiologyId: id,
      searchText: searchText
    };
  
    this.isLoadingTests = true;
    this.noDataFound = false;
  
    this.lad_radioService.getLabTestConfigLIstAPi(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      this.isLoadingTests = false;
  
      if (response.status) {
        this.testResults = response?.body?.result ?? [];
        this.noDataFound = this.testResults.length === 0;
      } else {
        this.testResults = [];
        this.noDataFound = true;
      }

    });
  }

  getTestList(sort: any = '') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      searchText: this.searchText,
      centreName:this.selectedCentre ?? "",
      sort: sort
    };
    this.lad_radioService.getLabTestLIstAPi(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.pendingdataSource = response?.body?.result;
        this.totalLength = response?.body?.totalRecords;
      }

    });
  }

  async submitForm(type: any) {
    this.isSubmitted = true;

    const isInvalid = this.labTestForm.invalid;


    if (isInvalid) {
      this.labTestForm.markAllAsTouched();

      const firstInvalidField = document.querySelector(
        'input.ng-invalid, input.ng-invalid'
      );
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth' });
      }
      this.coreService.showError("", "Please fill all required fields.")
      return;
    }
      const newSelectedTestArray = this.selectedTestIds.map(test => ({
        testId: test._id,
        testName: test.testName
      }));

        
      let loincElement = this.loincCodeList.find(test => test?.value === this.selectedLoinc);
      let loinc;
      if(loincElement){
        let loinc_code = loincElement?.label.replace(/\s?\(.*\)/, '');
        loinc =  { loincId: loincElement?.value, loincCode: loinc_code };
      }

    
    if(type === 'add'){
      let reqData = {
        labId:this.labTestForm.value.centre_name,
        testName:this.labTestForm.value.testName,
        tests:newSelectedTestArray,
        loinc:loinc,
        notes: this.labTestForm.value.notes,
        testFees: this.labTestForm.value.testFees,
        // couponCode: couponCode
      }
      this.loader.start();
      this.lad_radioService.addLabTestApi(reqData).subscribe({
        next: (result) => {
          let response = this.coreService.decryptObjectData({ data: result });
          if (response.status) {
            this.loader.stop();
            this.coreService.showSuccess("", response.message);
            this.closePopup()
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
    }else{

      let reqData = {
        labId:this.labTestForm.value.centre_name,
        testName:this.labTestForm.value.testName,
        tests:newSelectedTestArray,
        loinc:loinc,
        notes: this.labTestForm.value.notes,
        testFees: this.labTestForm.value.testFees,
        // couponCode: couponCode,
        id: this.updateTest_id
      }
      this.loader.start();
      this.lad_radioService.updateLabTestApi(reqData).subscribe({
        next: (result) => {
          let response = this.coreService.decryptObjectData({ data: result });
          if (response.status) {
            this.loader.stop();
            this.coreService.showSuccess("", response.message);
            this.closePopup()
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

  }

  exportManageTest() {
    let data: any = [];
    let reqData = {
      page: 1,
      limit: 0,
      searchText: this.searchText,
      centreName:this.selectedCentre ?? "",
      sort: 'createdAt:-1'
    };
    this.lad_radioService.getLabTestLIstAPiExport(reqData)
    .subscribe((res) => {
      
        let result = this.coreService.decryptObjectData({ data: res });
        // this.pageSize = pageNo
        if (result.status) {
          this.loader.stop();
          let array = [
            "Profile Name",
            "Note",
            "Laboratory Center",
            "Fees(SAR)",
            "Loinc Code",
            "Coupon Code"
          ];
          data = result.data.array
          data.unshift(array);
          let fileName = 'Laboratory_Tests.xlsx';
          const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          XLSX.writeFile(wb, fileName);
        }
      });
  }

  closePopup() {
    this.isSubmitted = false;
    this.modalService.dismissAll("close");
    this.labTestForm.reset();
    this.teamExcelForm.reset(); 
    this.selecteduser = '';
    this.selectedFiles = '';
    this.testResults=[];
    this.selectedTestIds = []; // Clear selected items list
    this.noDataFound = false; // Reset "No Data Found" flag
  }

  handleSearchFilter(text: any) {
    this.searchText = text.trim();
    this.getTestList()
  }



  clearFilter() {
    this.searchText = "";
    this.getTestList();
  }



  //  Delete modal
  openVerticallyCentereddetale(deletemodal: any, id: any) {
    this.deleted_test = id;
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

  openVerticallyCenteredAddspecialityservicecontent(addcontent: any) {
    this.modalService.open(addcontent, {
      centered: true,
      size: "lg",
      windowClass: "master_modal add_content",
    });
    this.getAllLoincCodeList();
    this.getAllCouponList();
  }

  getAllLoincCodeList(data: any = ''){
    let reqData = {
      page:  1, // this.page,
      limit: 0,//this.pageSize,
    };

    this.service.getAllLoincCodes(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);
      if (response?.status) {
        this.loincCodeList = []
        response?.body?.data?.map((loincCode) => {
          this.loincCodeList.push(
            {
              label: `${loincCode?.loincCode} (${loincCode?.description})`,    //[[6 Feb Lionic code description display]]
              value: loincCode?._id
            }
          )
        })

        if(data !== ''){
          this.slectedLonicCode = data
        }
      } else {
        this.loincCodeList = []       
      }
    });
  }

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'MM-dd-yyyy') || '';
  }

  openVerticallyCenteredAddspecialityEditcontent(editcontent: any, id:any) {
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
          this.selectedTestIds = data?.tests;          
          this.labTestForm.patchValue({
            testName: data?.testName,
            notes: data?.notes,
            centre_name:data?.labId?._id,
            selectedTest:data?.tests,
            // loincCode:data?.loinc?.loincId,
            testFees: data?.testFees,
          });
          this.getAllCouponList(data?.couponCode[0]?.couponCodeId);
          this.getAllLoincCodeList(data?.loinc?.loincId);        
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

  onSelectionChange(event: any): void {
    this.selectedLab = event.value;
    if (this.selectedLab !== undefined) {    
    this.testResults = [];
    this.getTest_nameList(this.selectedLab, '');
    }
  }

  onSelectionChangLoincCode(event: any): void {    
    if(event.value){
     this.selectedLoinc = event.value;
    }
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

  getAllCouponList(data: any ='') {
    this.service.getDiscount(
     1,
      0,
      '',
      'all',
    )
      .subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.couponCodeList = response?.body?.result;

          this.couponList = [];
          response?.body?.result.map((data) => {
            this.couponList.push(
              {
                label: data?.couponCode,
                value: data?._id
              }
            )
          })
          if(data !== ''){
            // setTimeout(() => {
              this.labTestForm.patchValue({
                couponCode: data,
              });
            // }, 1000);
          }

        }else{
          this.couponList = [];
        }
      });
  }

  onSelectedChangeCouponCode(event: any): void {    
    if (event.value) {
      this.selectedCouponCode = event?.value;
    }
  }


  onSelect2Change(event: any): void {    
    this.selecteduser = event.value;
  }
  openVerticallyCenteredimport(importMainTest: any) {
    this.modalService.open(importMainTest, {
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

    this.lad_radioService.bulkImportLabMainTest(formData).subscribe((res: any) => {
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
    link.setAttribute("href", "assets/doc/labmaintest.xlsx");
    link.setAttribute("download", `LabMain_Test.xlsx`);
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
  clearSelect2() {     
    this.loader.start()
    this.selectedCentre = '';
    this.selectedCentreId = '';
    this.getTestList();
    this.loader.stop()
  }

  onInputClick(): void {
    if (!this.testResults?.length && this.selectedLab) {
      this.getTest_nameList(this.selectedLab, '');
    }

    setTimeout(() => {
      this.autocompleteTrigger?.openPanel(); // Safe + reliable
    });
  }

  selectTest(item: any) {    
      const exists = this.selectedTestIds.find(test => test._id === item._id);
      if (!exists) {
        let data =  {
            testId:  item?._id,
            testName: item?.testName,
            _id: item?._id
          }
        this.selectedTestIds.push(data);
        this.labTestForm.patchValue({
          selectedTest: [...this.selectedTestIds]
        });
      }
      this.searchControl.setValue('');
  }
  
  removeSelected(item: any) {
    this.selectedTestIds = this.selectedTestIds.filter(test => test._id !== item._id);
    this.labTestForm.patchValue({
      selectedTest: [...this.selectedTestIds]
    });                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
  }
}