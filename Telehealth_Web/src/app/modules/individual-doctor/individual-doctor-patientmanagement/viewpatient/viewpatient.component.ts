import { ToastrService } from "ngx-toastr";
import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  Input,
} from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "../../indiviual-doctor.service";
import { Router } from "@angular/router";

export interface PeriodicElement {
  patientname: string;
  gender: string;
  age: string;
  phonenumber: string;
  location: string;
}
const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: "app-viewpatient",
  templateUrl: "./viewpatient.component.html",
  styleUrls: ["./viewpatient.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class ViewpatientComponent implements OnInit {
  displayedColumns: string[] = [
    "patientname",
    "mrn_number",
    "gender",
    "age",
    "phonenumber",
    "location",
    "action",
  ];
  dataSource:any[] = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("lockOrUnloackmodal") lockOrUnloackmodal: TemplateRef<any>;
  @ViewChild("activateDeactivate") activateDeactivate: TemplateRef<any>;
  @Input() fromParent: any;

  patientId: any = "";
  doctorId: any = "";
  abc: any = "Lock";
  efg: any = "Deactivate";
  searchText = "";

  pageSize: number = 10;
  totalLength: number = 0;
  page: any = 1;

  patientList: any[] = [];
  userList:any [] = [];
  sortColumn: string = 'full_name';
  sortOrder: 1 | -1 = 1;
  sortIconClass: string = 'arrow_upward';
  innerMenuPremission: any = [];
  userRole: any;
  selecteduser: any;
  currentUrl : any = []
  ngAfterViewInit() {
    // this.dataSource.paginator = this.paginator;
  }

  constructor(
    private modalService: NgbModal,
    private service: IndiviualDoctorService,
    private coreService: CoreService,
    private toastr: ToastrService,
    private route: Router
  ) {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    let adminData = JSON.parse(localStorage.getItem("adminData"));
    this.userRole = loginData?.role;
    if (this.userRole === "INDIVIDUAL_DOCTOR") {      
      this.doctorId = loginData?._id;
    }

    
  }

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.getPatientList(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {
    this.getDoctorUserList();
    if(this.fromParent === undefined){

      this.getPatientList(`${this.sortColumn}:${this.sortOrder}`);
    }
    this.currentUrl = this.route.url;
    this.onNavigate(this.currentUrl)
  }

  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission() {

    let userPermission = this.coreService.getLocalStorage("loginData").permissions;

    let menuID = sessionStorage.getItem("currentPageMenuID");

    let checkData = this.findObjectByKey(userPermission, "parent_id", menuID)

    if (checkData) {
      if (checkData.isChildKey == true) {

        var checkSubmenu = checkData.submenu;

        if (checkSubmenu.hasOwnProperty("claim-process")) {
          this.innerMenuPremission = checkSubmenu['claim-process'].inner_menu;

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

  giveInnerPermission(value) {
    if (this.userRole === "INDIVIDUAL_DOCTOR_STAFF" || this.userRole === "HOSPITAL_STAFF") {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    } else {
      return true;
    }
  }

  getPatientList(sort: any = '', id:any= '') {
    let reqData = {};
    if(this.fromParent !== undefined){
      reqData = {
        doctorId: id,
        searchText: this.searchText,
        page: this.page,
        limit: this.pageSize,
        sort: sort
      };
    }else{
      reqData = {
        doctorId: this.doctorId,
        searchText: this.searchText,
        page: this.page,
        limit: this.pageSize,
        sort: sort
      };
    }
    this.service.getPatientListAddedByDoctor(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res }); 
         
      this.dataSource = response?.body?.result;
      this.totalLength = response?.body?.totalRecords;
    }, (error) => {
      console.error('Error fetching patient list:', error);
    });
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

  handleToggleChangeForActive(event: any, id: any) {
    this.patientId = id;
    if (event === false) {
      this.efg = "Deactivate";
    } else {
      this.efg = "Activate";
    }
    this.modalService.open(this.activateDeactivate);
  }

  activeLockDeleteDoctor(action: string, value: boolean) {
    let reqData = {
      patientId: this.patientId,
      action_name: action,
      action_value: value,
    };

    this.service.activeAndLockPatient(reqData).subscribe((res) => {
      let response = this.coreService.decryptObjectData({ data: res });
      this.modalService.dismissAll("close");
      if (response.status) {
        this.toastr.success(response.message);
      }
    });
  }

  handleSearchFilter(text: any) {
    this.searchText = text; 
    this.page = 1;   
    if(this.selecteduser !== undefined){
      this.getPatientList("", this.selecteduser);
    }else{
      this.getPatientList();
    }
  }

  public handlePageEvent(data: { pageIndex: number; pageSize: number }): void {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getPatientList();
  }

  calculateAge(dob: any) {
    let timeDiff = Math.abs(Date.now() - new Date(dob).getTime());
    let patientAge = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);
    return patientAge;
  }

  routeToEdit(id) {
    sessionStorage.setItem("tabIndexForDoctor", "0");
    this.route.navigate(["/individual-doctor/patientmanagement/edit", id]);
  }

  getDoctorUserList(): void {
    this.service.getAllDoctor().subscribe(async (res) => {
      let response = await this.coreService.decryptObjectData({ data: res });

      if (response.status) {
        const arr = response?.body;
        arr.map((curentval: any) => {
          this.userList.push({
            label: curentval?.full_name,
            value: curentval?.for_portal_user,
          });
        });
      }

    });
  }

  onSelect2Change(event: any): void {
    this.selecteduser = event.value;
    this.getPatientList( '',this.selecteduser);
  }
  
  routeBack(id){
    if(this.fromParent !== undefined){
      this.route.navigate([`/individual-doctor/patientmanagement/details/${id}`],
        { queryParams: {patientId: id, adminView: this.fromParent } }
      );      
    }else{
      this.route.navigate([`/individual-doctor/patientmanagement/details/${id}`]);
    }
  }
  onNavigate(url:any): void {
    const menuitems = JSON.parse(localStorage.getItem('activeMenu'))
     this.currentUrl = url
   
    const matchedMenu = menuitems.find(menu => menu.route_path === this.currentUrl);
    this.route.navigate([url]).then(() => {
      
      this.service.setActiveMenu(matchedMenu?.name);
    });
   
  }
}
