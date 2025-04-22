import { doctor } from "@igniteui/material-icons-extended";

import { Component, OnInit, ViewEncapsulation, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { SuperAdminService } from "src/app/modules/super-admin/super-admin.service";
import { IndiviualDoctorService } from "../../indiviual-doctor.service";
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { Router } from "@angular/router";

export interface PeriodicElement {
  patientname: string;
  eprescriptionid: string;
  dateandtime: string;
  consultationtype: string;
  reasonforappt: string;
  fee: string;
  status: string;
}
const ELEMENT_DATA: PeriodicElement[] = [
  {
    patientname: "Cameron Williamson",
    eprescriptionid: "#1515411215",
    dateandtime: "08-25-2022 | 10:30AM",
    consultationtype: "Online",
    reasonforappt: "Lorem Ipsum simply",
    fee: "$200",
    status: "Completed",
  },
  {
    patientname: "Cameron Williamson",
    eprescriptionid: "#1515411215",
    dateandtime: "08-25-2022 | 10:30AM",
    consultationtype: "Online",
    reasonforappt: "Lorem Ipsum simply",
    fee: "$200",
    status: "Completed",
  },
  {
    patientname: "Cameron Williamson",
    eprescriptionid: "#1515411215",
    dateandtime: "08-25-2022 | 10:30AM",
    consultationtype: "Online",
    reasonforappt: "Lorem Ipsum simply",
    fee: "$200",
    status: "Completed",
  },
  {
    patientname: "Cameron Williamson",
    eprescriptionid: "#1515411215",
    dateandtime: "08-25-2022 | 10:30AM",
    consultationtype: "Online",
    reasonforappt: "Lorem Ipsum simply",
    fee: "$200",
    status: "Completed",
  },
  {
    patientname: "Cameron Williamson",
    eprescriptionid: "#1515411215",
    dateandtime: "08-25-2022 | 10:30AM",
    consultationtype: "Online",
    reasonforappt: "Lorem Ipsum simply",
    fee: "$200",
    status: "Completed",
  },
];

@Component({
  selector: "app-eprescriptionlist",
  templateUrl: "./eprescriptionlist.component.html",
  styleUrls: ["./eprescriptionlist.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class EprescriptionlistComponent implements OnInit {
  displayedColumns: string[] = [
    "patientname",
    "eprescriptionid",
    "dateandtime",
    // "appointmenttype",
    "consultationtype",
    "reasonforappt",
    "fee",
    // "status",
    "action",
  ];
  dataSource: any[] = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  doctorId: any = "";

  pageSize: number = 5;
  totalLength: number = 0;
  page: any = 1;

  selectedType: any = "ALL";

  sortColumn: string = 'appointment.patientDetails.patientFullName';
  sortOrder: 1 | -1 = 1;
  sortIconClass: string = 'arrow_upward';
  userRole: any;
  innerMenuPremission:any=[];
  constructor(
    private sadminService: SuperAdminService,
    private indiviualDoctorService: IndiviualDoctorService,
    private coreService: CoreService,
    private toastr: ToastrService,
    private router: Router
  ) {
    let loginData = JSON.parse(localStorage.getItem("loginData"));
    let adminData = JSON.parse(localStorage.getItem("adminData"));

    this.userRole = loginData?.role;

    if(this.userRole === "HOSPITAL_STAFF"){
      this.doctorId = adminData?.for_doctor;

    }else if(this.userRole === "INDIVIDUAL_DOCTOR_STAFF"){
      this.doctorId = adminData?.in_hospital;
    }else{
      this.doctorId = loginData?._id;

    }
  }

  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 1? -1 : 1;
    this.sortIconClass = this.sortOrder === 1? 'arrow_upward' : 'arrow_downward';
    this.getAllEprescription(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {  

    this.getAllEprescription(`${this.sortColumn}:${this.sortOrder}`);
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 2000);
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission(){

    let userPermission = this.coreService.getLocalStorage("loginData").permissions;

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
  giveInnerPermission(value){
    if(this.userRole === "INDIVIDUAL_DOCTOR_STAFF" || this.userRole === "HOSPITAL_STAFF"){
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    }else{
      return true;
    }

  
  }


  handleSelectFliterList(event: any) {
    this.selectedType = event.value;
    this.getAllEprescription();
  }

  getAllEprescription(sort:any='') {
    let reqData = {
      doctorId: this.doctorId,
      page: this.page,
      limit: this.pageSize,
      appointmentType: this.selectedType,
      sort:sort
    };

    this.indiviualDoctorService
      .listAllEprescription(reqData)
      .subscribe((res) => {
        let response = this.coreService.decryptObjectData({ data: res });

        if (response.status) {
          this.dataSource = response?.body?.result;
          this.totalLength = response?.body?.totalRecords;
        }
      });
  }

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllEprescription();
  }
}
