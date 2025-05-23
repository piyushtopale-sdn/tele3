import { Component, ViewEncapsulation, ViewChild, } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "src/app/shared/core.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import * as XLSX from "xlsx";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { LabimagingdentalopticalService } from "../../labimagingdentaloptical.service";
import { Router } from "@angular/router";
import { SuperAdminService } from "../../super-admin.service";
import { DatePipe } from "@angular/common";
import { debounceTime, distinctUntilChanged } from "rxjs";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";


@Component({
  selector: 'app-radio-test',
  templateUrl: './radio-test.component.html',
  styleUrls: ['./radio-test.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class RadioTestComponent {
  dataSource: any = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
  testID: any;
  tabNumber: number;
  radioUserList: any = [];
  studyUserList: any = [];
  superAdminId: any;
  updatetest_id: any;
  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;
  isSubmitted: boolean = false;
  searchText = "";
  startDate: string = null;
  endDate: string = null;
  displayedColumns: string[] = [
    "radio_centre", "test", "notes", "action"];

  sortColumn: string = 'radiologyName';
  sortOrder: 1 | -1 = -1;

  sortIconClass: string = 'arrow_upward';
  innerMenuPremission: any = [];
  loginrole: any;
  radioTestForm: FormGroup
  currentUrl: any = [];
  loincCodeList: any = []
  selectedLoinc: any = '';
  couponList: any = [];
  selectedCouponCode: any = [];
  couponCodeList:any =[];
  centresList:any = [];
  selectedCentre:any=[];
  selectedCentreId:any=[]
  overlay = false;
  filteredLoincCodes: any[] = [];
  loincCodeInputControl = new FormControl("");
  selectedFiles: any;
  selecteduser: string | Blob;
  
  constructor(
    private readonly modalService: NgbModal,
    private readonly coreService: CoreService,
    private readonly fb: FormBuilder,
    private readonly lad_radioService: LabimagingdentalopticalService,
    private readonly loader: NgxUiLoaderService,
    private readonly router: Router,
    private readonly service: SuperAdminService,
    private readonly datepipe: DatePipe,

  ) {
    this.loginrole = this.coreService.getLocalStorage("adminData").role;

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
    let adminData = JSON.parse(localStorage.getItem("loginData"));
    this.superAdminId = adminData?._id;
    this.getRadioList();
    this.getTestList(`${this.sortColumn}:${this.sortOrder}`);
    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl);
    this.getAllCentresList()


    this.loincCodeInputControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchText: string) => {
        this.getAllLoincCodeList(searchText);
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
      let checkSubmenu;
      if (checkData) {
        if (checkData.isChildKey) {
          checkSubmenu = checkData.submenu;
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

  getTestList(sort: any = '') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      searchText: this.searchText,
      centreName:this.selectedCentre ?? "",
      sort: 'createdAt:-1'
    };

    this.lad_radioService.getRadioTestLIstAPi(reqData).subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });

      if (response.status) {
        this.totalLength = response?.body?.totalRecords;
        this.dataSource = response?.body?.result;
      }

    });
  }

  async submitForm(type: any) {
    
    this.isSubmitted = true;

    const isInvalid = this.radioTestForm.invalid;


    if (isInvalid) {
      this.radioTestForm.markAllAsTouched();

      const firstInvalidField = document.querySelector(
        'input.ng-invalid, input.ng-invalid'
      );
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth' });
      }
      this.coreService.showError("", "Please fill all required fields.")
      return;
    }

    

    if (type === 'add') {
      let reqData = {
        radiologyId: this.radioTestForm.value.centre_name,
        studyTypeId: this.radioTestForm.value.studyTypeId,
        testName: this.radioTestForm.value.test,
        loinc: this.selectedLoinc,
        testFees: this.radioTestForm.value.testFees,
        notes: this.radioTestForm.value.notes
      }
      
      this.loader.start();

      this.lad_radioService.addRadioTestApi(reqData).subscribe({
        next: (result) => {
          let response = this.coreService.decryptObjectData({ data: result });
          if (response.status) {
            this.loader.stop();
            this.coreService.showSuccess("", response.message);
            this.closePopup();

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
    } else {
      let reqData = {
        radiologyId: this.radioTestForm.value.centre_name,
        studyTypeId: this.radioTestForm.value.studyTypeId,
        testName: this.radioTestForm.value.test,
        loinc: this.selectedLoinc,
        testFees: this.radioTestForm.value.testFees,
        notes: this.radioTestForm.value.notes,
        id: this.updatetest_id
      }
      this.loader.start();
      this.lad_radioService.updateRAdioTestApi(reqData).subscribe({
        next: (result) => {
          let response = this.coreService.decryptObjectData({ data: result });
          if (response.status) {
            this.loader.stop();
            this.coreService.showSuccess("", response.message);
            this.closePopup();

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

  closePopup() {
    this.isSubmitted = false;
    this.modalService.dismissAll("close");
    this.radioTestForm.reset();
    this.teamExcelForm.reset();
    this.selectedFiles = '';
    this.selecteduser = '';
    this.loincCodeInputControl.setValue('');
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



  //  Delete modal
  openVerticallyCentereddetale(deletemodal: any, id: any) {
    this.testID = id;
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

  openVerticallyCenteredAddspecialityservicecontent(addcontent: any) {
    this.modalService.open(addcontent, {
      centered: true,
      size: "lg",
      windowClass: "master_modal add_content",
    });
    this.getStudyList();
  }
  getAllLoincCodeList(searchText: string = '') {
    const reqData = {
      page: 1,
      limit: 100,
      searchText: searchText
    };
  
    this.service.getAllLoincCodes(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this.coreService.decryptObjectData(encryptedData);      
      if (response?.status) {
        this.loincCodeList = response?.body?.data?.map((loincCode) => ({
          label: `${loincCode?.loincCode} (${loincCode?.description})`,
          value: loincCode?._id
        })) ?? [];
      } else {
        this.loincCodeList = [];
      }
      this.filteredLoincCodes = [...this.loincCodeList]; // show suggestions
    });
  }
  onSelectionChangLoincCode(event: any) {
    const selectedText = event.option?.value;
    
    const matchedItem = this.loincCodeList.find(item => item?.label === selectedText);
    if(matchedItem){
      this.selectedLoinc = {
        loincCode: selectedText,
        loincId: matchedItem?.value
      };
      this.radioTestForm.patchValue({
        loincCode: this.selectedLoinc?.loincCode
      });
    }
  }
 

  formatDate(date: Date): string {
    return this.datepipe.transform(date, 'MM-dd-yyyy') || '';
  }

  openVerticallyCenteredAddspecialityEditcontent(editcontent: any, data: any) {
    this.updatetest_id = data?._id
    this.getradioTest(this.updatetest_id)
    this.getStudyList();
    this.modalService.open(editcontent, {
      centered: true,
      size: "lg",
      windowClass: "master_modal add_content",
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

  deleteRadioTest() {
    let reqData = {
      id: this.testID
    }
    this.loader.start();
    this.lad_radioService.deleteRAdioTestApi(reqData).subscribe(async (res) => {
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
            testFees: data?.testFees,
            studyTypeId: data?.studyTypeId,
            centre_name: data?.radiologyId?._id,
            loincCode : data?.loinc?.loincCode
          });
          const loincLabel = data?.loinc?.loincCode;
          this.loincCodeInputControl.setValue(loincLabel); // <-- Triggers valueChanges
          this.getAllLoincCodeListFilter(loincLabel);
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

  exportManageTest() {
    let reqData = {
      page: this.page,
      limit: 0,
      searchText: this.searchText,
      centreName:this.selectedCentre ?? "",
      sort: 'createdAt:-1'
    };
    this.lad_radioService.getRadioTestLIstAPiExport(reqData)
      .subscribe((res) => {
        let result = this.coreService.decryptObjectData({ data: res });
        if (result.status) {
          this.loader.stop();
          let array = [
            "Test Name",
            "Note",
            "Radiology Center",
            "Fees(SAR)",
            "Loinc Code",
            "Coupon Code"
          ];
          const formattedData = result.body?.result.map((item: any) => [
            item.testName ?? '',
            item.notes ?? '',
            item.radiologyName ?? '',
            item.testFees ?? '',
            item.loinc?.loincCode ?? '',
            item.couponCode?.map((c: any) => c.couponCode).join(', ') ?? ''
          ]);

          formattedData.unshift(array)
          let fileName = 'Radiology_Tests.xlsx';
          const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(formattedData);
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
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
      this.router.navigate([url]).then(() => {
        this.service.setActiveMenu(matchedMenu.name);
      });
    } else {
      console.error("No matching menu found for URL:", this.currentUrl);
    }
  }
  getAllCouponList() {
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
                label: data.couponCode,
                value: data?._id
              }
            )
          })
        }else{
          this.couponList = [];
        }
      });
  }

  onSelect2ChangeRadio(event: any): void {
    if (!event?.value || !event?.options?.length) return;
    this.loader.start()
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
      type: "Radiology"
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
      
    }, error => {
      this.centresList = [];
      console.error("API Error:", error);
    });
  }
  clearSelect2() {     
    this.loader.start()
    this.selectedCentre = '';
    this.selectedCentreId = '';
    this.getTestList();
    this.loader.stop()
  }


  onFocusShowList() {
    if (!this.filteredLoincCodes.length) {
      this.getAllLoincCodeList(); // Load default list
    }
    setTimeout(() => {
      this.autocompleteTrigger?.openPanel(); // Safe + reliable
    });
  }

  getAllLoincCodeListFilter(searchText: string) {
    if(searchText !== undefined){
      const lowerText = searchText.toLowerCase();
      this.filteredLoincCodes = this.loincCodeList.filter(item =>
        item.label.toLowerCase().includes(lowerText)
      );
    }
  }

    onSelect2Change(event: any): void {    
      this.selecteduser = event.value;
    }
    openVerticallyCenteredimport(importTest: any) {
      this.modalService.open(importTest, {
        centered: true,
        size: "lg",
        windowClass: "master_modal Import",
      });
    }
  
    teamExcelForm: FormGroup = new FormGroup({
      subtestfile: new FormControl("", [Validators.required]),
      centre: new FormControl("", [Validators.required])
    });
  
    excleSubmit() {          
      this.isSubmitted = true;
      if (this.selecteduser === undefined || this.teamExcelForm.invalid ) {
        return;
      }
      const formData = new FormData();
      formData.append("file", this.selectedFiles);
      formData.append("radiologyId", this.selecteduser);
    
      this.loader.start();
      this.lad_radioService.bulkImportRadioTests(formData).subscribe((res: any) => {
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
    link.setAttribute("href", "assets/doc/radiotest.xlsx");
    link.setAttribute("download", `Radio-Test.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}