import { Component, OnInit, ViewEncapsulation,ViewChild,TemplateRef } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { CoreService } from "./../../../../shared/core.service";
import { IndiviualDoctorService } from 'src/app/modules/individual-doctor/indiviual-doctor.service';
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { DatePipe } from "@angular/common";
import * as moment from "moment";
import * as XLSX from 'xlsx'
import { MatCheckboxChange } from "@angular/material/checkbox";
import { MatSelectChange } from "@angular/material/select";
import { FormBuilder, FormGroup } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SuperAdminService } from '../../super-admin.service';

export interface PeriodicElement {
  patientname: string;
  gender: string;
  dateofbirth: string;
  joineddate: string;
  insuranceprovider: string;
  phonenumber: string;
  email: string;
  
}

const ELEMENT_DATA: PeriodicElement[] = [
  { patientname: '',
  gender: '', 
  dateofbirth:'',
   joineddate: '', 
   insuranceprovider: '',
    phonenumber: '',
     email: ''
    },

];


@Component({
  selector: 'app-viewpatient',
  templateUrl: './viewpatient.component.html',
  styleUrls: ['./viewpatient.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class ViewpatientComponent implements OnInit {
  @ViewChild("filterModal") filterModal: TemplateRef<any>;
  displayedColumns: string[] = ['patientname', 'mrn_number', 'gender', 'dateofbirth','phonenumber', 'email', 'subscription_status','lockuser','action'];
  dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
  exportFilterArrays: any [] = [];
  patientlistsource : any[] = []
  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;
  searchText = "";
  insurancePresent="";
  patientId: any = "";
  doctorId: any = "";
  abc: any = "Lock";
  efg: any = "Deactivate";
  patientdeleteId:any;
  dateFilter: any = "";
  activebutton:any=''
  patientList: any[] = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("activateDeactivate") activateDeactivate: TemplateRef<any>;
  @ViewChild("lockOrUnloackmodal") lockOrUnloackmodal: TemplateRef<any>;
  public date: moment.Moment;
  startDateFilter: any="";
  endDateFilter: any="";
  statusValue: any = "all";
  type: any;
  isSubmitted: any = false;
  filteredForm!: FormGroup;
  patientsList:any;
  sortColumn: string = 'createdAt:-1';
  sortOrder: 1 | -1 = 1;
  sortIconClass: string = 'arrow_upward';
  innerMenuPremission:any=[];
  loginrole: any;
  patientDetails : any[] = [];
  savedFilters: any;
  plansList:any[]=[];
  overlay = false;
  search_with_plan_name: any = "";
  is_activated: any = "all";
  plan_for: any = "all";
  selectedplan: any = null;
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }


  constructor(private modalService: NgbModal,
    private coreService: CoreService,
    private service: IndiviualDoctorService,
    private superAdminService : SuperAdminService,
    private route: Router,
    private toastr: ToastrService,
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private _coreService: CoreService,
    private loader: NgxUiLoaderService,
    private cdr: ChangeDetectorRef) {
      this.filteredForm = this.fb.group({
        limit: [0],
        page: [1],
        searchText: [''],
        fromDate: [''],
        toDate: [''],
        sort: ['createdAt:-1'],
        gender: [''],
        subscription: [''],
        patientName:[''],
        phoneNumber: [],
        mrnNumber: [''],
        email: [],
        city:[],
        country:[],
        registrationfromDate:[],
        registrationtoDate:[],
        lastLogin:[],
        planName:[],
        lastUsedfrom:[],
        lastUsedto:[]
      });
    this.loginrole = this.coreService.getLocalStorage("adminData").role;
  }

  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1? -1 : 1;
    this.sortIconClass = this.sortOrder === 1? 'arrow_upward' : 'arrow_downward';
    this.getPatientList(`${column}:${this.sortOrder}`);
  }


  ngOnInit(): void {
     this.getPatientList(`${this.sortColumn}:${this.sortOrder}`)
     this.getAllPlansList();
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission(){
    let userPermission = this.coreService.getLocalStorage("adminData").permissions;
    let menuID = sessionStorage.getItem("currentPageMenuID");
    if(userPermission){
      let checkData = this.findObjectByKey(userPermission, "parent_id",menuID)
      if(checkData){
        if(checkData.isChildKey == true){
          var checkSubmenu = checkData.submenu;      
          if (checkSubmenu.hasOwnProperty("pharmacy")) {
            this.innerMenuPremission = checkSubmenu['pharmacy'].inner_menu;
  
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
    if (this.loginrole === 'STAFF_USER') {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    }else {
      return true;
    }
  }

  allPatients(event:any){
    this.activebutton=event;
    this.insurancePresent=event
    this.getPatientList()

  }

  extendDateFormat(mydate){
    mydate.setHours(mydate.getHours() + 5); // Add 5 hours
    mydate.setMinutes(mydate.getMinutes() + 30);
    return mydate
  }
  
  getPatientList(sort: any = '') {
    let reqData = {
      searchText: this.searchText,
      page: this.page,
      limit: this.pageSize,
      planId:  this.selectedplan ? this.selectedplan : "" ,
      sort: sort || "createdAt:-1" 
    };
  
    this.service.getAllPatientForSuperAdmin(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
  
      if (response.status) {
        this.dataSource = response?.body?.data || [];
        this.patientlistsource = response?.body?.data || [];
        this.totalLength = response?.body?.totalRecords || 0;
  
        this.patientDetails = response?.body?.data?.map((patient) => {
          const planDetails = patient?.subscriptionPlan || {};
        const subscription = patient?.subscriptionDetails || {};
        const isPlanActive = subscription?.isPlanActive || false;

        const maxConsultations = planDetails?.services?.[0]?.max_number ?? 0;

        const consultationsRemaining = isPlanActive ? (subscription.services?.consultation ?? 0) : 0;

        const addonConsultations = isPlanActive ? (subscription.addonServices?.consultation ?? 0) : 0;

        const medicalConsultationsUsed = Math.max(0, maxConsultations - consultationsRemaining + addonConsultations);

          return {
            _id: patient._id,
            full_name: patient.full_name || "N/A",
            mrn_number: patient.mrn_number || "N/A",
            gender: patient.gender || "N/A",
            dob: patient.dob ? new Date(patient.dob).toLocaleDateString() : "N/A",
            country_code: patient.country_code || "",
            mobile: patient.mobile || "N/A",
            email: patient.email || "N/A",
            lock_user: patient.lock_user || false,
            // Subscription details
            isPlanActive: isPlanActive,
            plan_name: isPlanActive ? (planDetails.plan_name || "No Plan Found") : "No Plan Found",
            expiry_date: isPlanActive ? (subscription.period?.end ? new Date(subscription.period.end).toLocaleDateString() : "N/A") : "N/A",
        
            // Services
            consultations_remaining: consultationsRemaining, 
            medical_consultations_used: medicalConsultationsUsed,  
          };
        });
        
      }
    });
  }

  getAllPatientListForExport(): Promise<any[]> {
    let reqData = {
      searchText: this.searchText,
      page: 1,       
      limit: 10000,  
      sort: ''
    };
  
    return new Promise((resolve, reject) => {
      this.service.getAllPatientForSuperAdmin(reqData).subscribe(
        (res) => {
          let response = this.coreService.decryptObjectData({ data: res });
  
          if (response.status) {
            resolve(response?.body?.data || []);
          } else {
            reject("Failed to fetch patient data.");
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  }
  
  

  exportToExcelPatientDetails() {
    if (this.exportFilterArrays.length > 0) {
      this.exportDataToExcel(this.exportFilterArrays);
    } else {
      this.getAllPatientListForExport()
        .then((allPatients: any[]) => {
          if (!allPatients || allPatients.length === 0) {
            console.warn("No patient data available for export.");
            return;
          }
          this.exportDataToExcel(allPatients);
        })
        .catch((error) => {
          console.error("Error fetching data for export:", error);
        });
    }
  }
  cleanValue(value: any): string {
    if (value === undefined || value === null || value === "undefined undefined" || value === "N/A") {
        return "";
    }
    return value;
}

  exportDataToExcel(data: any[]) {
    const formattedData = data.map(patient => ({
      'Patient Name': this.cleanValue(patient.full_name),
      'Plan Name':this.cleanValue(patient.subscriptionPlan?.plan_name),
      'MRN Number': this.cleanValue(patient.mrn_number),
      'Gender': this.cleanValue(patient.gender),
      'Date of Birth': patient.dob ? new Date(patient.dob).toLocaleDateString() : "",
      'Expiry Date': patient.subscriptionDetails?.period?.end
        ? new Date(patient.subscriptionDetails.period.end).toLocaleDateString()
        : "",
      'Phone Number': patient.country_code ? `${patient.country_code} ${patient.mobile}` : patient.mobile || "N/A",
      'Email': patient.email || "",
      'Subscription Status': patient.subscriptionDetails?.isPlanActive ? "Active" : "Inactive",
      'Consultations Remaining': patient.subscriptionDetails?.services?.consultation || 0,
      'Medical Consultations Used': Math.max(0, 
        (patient.subscriptionPlan?.services?.[0]?.max_number ?? 0) -
        (patient.subscriptionDetails?.services?.consultation ?? 0) +
        (patient.subscriptionDetails?.addonServices?.consultation ?? 0)
      ),
     'Last Login': patient?.lastLoginTime && patient?.lastLoginTime !== "No Login Data"
      ? new Date(patient.lastLoginTime).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true 
    })
    : '',
      "Registration Date": patient.createdAt ? patient.createdAt.split("T")[0] : "",
      'Last Updated': patient?.lastUsedDate 
      ? new Date(patient.lastUsedDate).toLocaleDateString('en-GB') 
      : ""
    }));
  
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    ws['!cols'] = [
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 10 },
      { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 30 },
      { wch: 15 }, { wch: 20 }, { wch: 20 },
    ];
  
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Patient Details');
  
    const fileName = `Patient_Details.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
  
  
  
  handleSearchFilter(text: any) {
    this.searchText = text.trim();
    this.page = 1; 
    this.getPatientList();
  }
  
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.fetchFilteredPatients();
  }
  handleSelectStartDateFilter(event: any) {    
    const originalDate = new Date(event.value);
    this.extendDateFormat(originalDate)  
    const formattedDate = originalDate.toISOString();
    this.startDateFilter = formattedDate
    this.getPatientList();
  }
  
  handleSelectEndDateFilter(event: any) {    
    const originalDate = new Date(event.value);
    this.extendDateFormat(originalDate)  
    const formattedDate = originalDate.toISOString();
    this.endDateFilter = formattedDate
    this.getPatientList();
  } 

  handleFilter(value: any) {
    this.statusValue = value
  
    this.getPatientList();
  }
  clearAll(){
    this.startDateFilter ="";
    this.endDateFilter ="";
    this.searchText= "";
    this.statusValue ="";
    
    this.getPatientList();
  }
  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

    openVerticallyCentereddetale(addsecondsubsriber: any, id:any) {
      this.patientId=id;
      this.modalService.open(addsecondsubsriber,{ centered: true,size: 'md',windowClass : "delete_data" });
    }
  
    private getDismissReason(reason: any): string {
      if (reason === ModalDismissReasons.ESC) {
        return 'by pressing ESC';
      } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
        return 'by clicking on a backdrop';
      } else {
        return `with: ${reason}`;
      }
    }
    calculateAge(dob: any) {
      let timeDiff = Math.abs(Date.now() - new Date(dob).getTime());
      let patientAge = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);
      return patientAge;
    }
    handleToggleChangeForActive(event: any, id: any) {
      this.patientId = id;
      if (event === false) {
        this.efg = "Deactivate";
      } else {
        this.efg = "Activate";
      }
      this.modalService.open(this.activateDeactivate);
    }

  handleToggleChangeForLock(event: any, id: any) {
    this.patientId = id;
    if (event === false) {
      this.abc = "Unlock";
    } else {
      this.abc = "Lock";
    }
    this.modalService.open(this.lockOrUnloackmodal);
  }


  activeLockDeleteDoctor(action: string, value: boolean) {
    let reqData = {
      patientId: this.patientId,
      fieldName: "lock_user",
      fieldValue: value,
    };

    this.service.activeAndLockPatient(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      this.modalService.dismissAll("close");
      if (response.status) {
        this.toastr.success(response.message);
      }
    });
  }
  
  routeToEdit(id) {
    sessionStorage.setItem("tabIndexForDoctor", "0");
    this.route.navigate(["/individual-doctor/patientmanagement/edit", id]);
  }    


  onSubscriptionChange(isChecked: boolean, type: string) {
    let selectedSubscriptions = this.filteredForm.get('subscription').value || [];

    if (isChecked) {
        if (type === 'both') {
            selectedSubscriptions = ['both'];
        } else {
            selectedSubscriptions = selectedSubscriptions.filter(s => s !== 'both');

            if (type === 'true') {
                selectedSubscriptions = selectedSubscriptions.filter(s => s !== 'false');
            } else if (type === 'false') {
                selectedSubscriptions = selectedSubscriptions.filter(s => s !== 'true');
            }

            if (!selectedSubscriptions.includes(type)) {
                selectedSubscriptions.push(type);
            }
        }
    } else {
        selectedSubscriptions = selectedSubscriptions.filter(s => s !== type);
    }

    if (selectedSubscriptions.length === 0) {
        selectedSubscriptions = ['both'];
    }

    this.filteredForm.get('subscription').setValue([...selectedSubscriptions]);
}

  
  

    closePopup(): void {
      this.modalService.dismissAll();
      this.filteredForm.reset();
      
    }

submitSelection() {
  this.loader.start()
  this.isSubmitted = true;

  if (this.filteredForm.invalid) {
    return;
  }

  let reqData: any = {};

  const addFilter = (key: string, formKey: string) => {
    let value = this.filteredForm.get(formKey)?.value;
    if (value !== null && value !== undefined && value !== '') {
      reqData[key] = typeof value === 'string' ? value.trim() : value;
    }
  };

  addFilter('full_name', 'patientName');
  addFilter('mobile', 'phoneNumber');
  addFilter('email', 'email');
  addFilter('gender', 'gender');
  addFilter('isPlanActive', 'subscription');
  addFilter('mrn_number', 'mrnNumber');
  addFilter('registeredFromDate', 'registrationfromDate'); 
  addFilter('registeredToDate', 'registrationtoDate');
  addFilter('lastUsedFromDate', 'lastUsedfrom'); 
  addFilter('lastUsedToDate', 'lastUsedto'); 
  addFilter('city', 'city');
  addFilter('country', 'country');
  addFilter('subscriptionPlanId', 'planName');

  reqData['limit'] = this.pageSize; 
  reqData['page'] = 1; 
  this.savedFilters = reqData; 

  this.fetchFilteredPatients(); 
  this.closePopup();
  this.loader.stop();

}


fetchFilteredPatients() {
  let reqData: any = { ...this.savedFilters }; 

  reqData['limit'] = this.pageSize; 
  reqData['page'] = this.page; 


  this.service.getAllPatientForSuperAdmin(reqData).subscribe(
    (res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      this.loader.stop();

      if (response.status) {
        this.dataSource = response.body.data;
        this.totalLength = response.body.totalRecords;
        

        this.fetchFullFilteredData(reqData)

      } else {
        this.toastr.error(response.message);
      }
    },
    (error) => {
      console.error("API Error:", error);
    }
  );
}


fetchFullFilteredData(filters: any) {
  let reqData = { ...filters };

  reqData['limit'] = 0; 
  reqData['page'] = this.page; 

  this.service.getAllPatientForSuperAdmin(reqData).subscribe(
    (res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status) {
        this.exportFilterArrays = response.body.data;
      } else {
        this.toastr.error("Error fetching full filtered data.");
      }
    },
    (error) => {
      console.error("Error fetching full filtered data for export:", error);
    }
  );
}

    
    
    onShareOptionChange(event: MatSelectChange){

    }
    onGenderChange(event: MatCheckboxChange, value: string) {
      let selectedGenders = this.filteredForm.get('gender').value || []; 
      if (event.checked) {
        if (value === 'both') {
          selectedGenders = ['both']; 
        } else {
          selectedGenders = selectedGenders.filter(g => g !== 'both'); 
          selectedGenders.push(value);
        }
      } else {
        selectedGenders = selectedGenders.filter(g => g !== value);
      }
    
      if (selectedGenders.length === 0) {
        selectedGenders.push('both');
      }
    
      this.filteredForm.get('gender').setValue([...selectedGenders]); 
    }
    openPopup(modal): void {
      if (!this.filteredForm) {
        console.error("Form is not initialized yet!");
        return;
      }
  
      this.modalService.open(modal, {
        centered: true,
        size: 'xl',
        windowClass: 'master_modal filter_Modal',
      });
    }
    clearFilter() {
      this.savedFilters = null
      this.page = 1;
      this.pageSize = 10
      this.loader.start()
      this.getPatientList();
      if (this.paginator) {
        this.paginator.firstPage();
      }
      this.loader.stop();
      
    }
    onSelect2ChangePlan(event: any): void {
      this.selectedplan = event.value
      if (this.paginator) {
        this.paginator.firstPage();
    }
    }
    
    getAllPlansList(): void {
      this.superAdminService.getPlan(
        this.page,
        10000,  // Altamash 11 April 2025
        this.search_with_plan_name,
        this.plan_for,
        this.is_activated,
        'createdAt:-1'
      ).subscribe(async (res) => {
        try {
          const response = await this.coreService.decryptObjectData({ data: res });
    
          if (response?.status && response?.body?.allPlans?.length) {
            this.plansList = response.body.allPlans.map((plan: any) => ({
              label: plan.plan_name,
              value: plan._id,
            }));
            
          } else {
            this.plansList = [];
          }
        } catch (error) {
          this.plansList = [];
        }    
      }, error => {
        this.plansList = [];
        console.error("API Error:", error);
      });
    }
    
    
}
