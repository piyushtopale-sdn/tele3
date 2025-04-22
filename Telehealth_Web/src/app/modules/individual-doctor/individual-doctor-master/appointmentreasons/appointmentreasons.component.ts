import { Component, OnInit } from "@angular/core";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { CoreService } from "src/app/shared/core.service";
import { ToastrService } from "ngx-toastr";
import { Router } from "@angular/router";
import { IndiviualDoctorService } from "../../indiviual-doctor.service";
import { NgxUiLoaderService } from "ngx-ui-loader";

export interface PeriodicElement {
  reasonsname: string;
  status: string;
}
const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: "app-appointmentreasons",
  templateUrl: "./appointmentreasons.component.html",
  styleUrls: ["./appointmentreasons.component.scss"],
  // encapsulation:ViewEncapsulation.None
})
export class AppointmentreasonsComponent implements OnInit {
  displayedColumns: string[] = ["reasonsname","locationname", "status", "action"];
  dataSource = ELEMENT_DATA;
  appointmentReasonForm!: FormGroup;
  isSubmitted: boolean = false;
  editappointmentReasonForm!: FormGroup;
  appointmentReasonId: any;
  page: any = 1;
  pageSize: number = 5;
  totalLength: number = 0;
  searchText: any = "";
  userId: any = "";
  selectedFiles: any;

  selectfilename: any = "";

  // sortColumn: string = 'name';
  // sortOrder: 'asc' | 'desc' = 'asc';
  // sortIconClass: string = 'arrow_upward';

  sortColumn: string = 'createdAt';
  sortOrder: 1 | -1 = 1;
  sortIconClass: string = 'arrow_upward';

  allLocations: any= [];
  overlay: false;
  selectedlocationvalue: any;
  selectedlocationId: any;
  userRole: any;
  innerMenuPremission:any=[];

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private doctorService: IndiviualDoctorService,
    private _coreService: CoreService,
    private toastr: ToastrService,
    private router: Router,
    private loader: NgxUiLoaderService
  ) {
    this.appointmentReasonForm = this.fb.group({
      appointmentReasonsss: this.fb.array([]),
      selectedlocation : ["",[Validators.required]]
    });

    let loginData = JSON.parse(localStorage.getItem("loginData"));
    let adminData = JSON.parse(localStorage.getItem("adminData"));

    this.userRole = loginData?.role;

    if(this.userRole === "HOSPITAL_STAFF"){
      this.userId = adminData?.for_doctor;

    }else if(this.userRole === "INDIVIDUAL_DOCTOR_STAFF"){
      this.userId = adminData?.in_hospital;
    }else{
      this.userId = loginData?._id;

    }

    this.editappointmentReasonForm = this.fb.group({
      appointmentReasonId: ["", [Validators.required]],
      name: ["", [Validators.required]],
      active: ["", [Validators.required]],
      doctorId: ["", [Validators.required]],
      selectedlocation : ["",[Validators.required]]
    });
  }

  onSortData(column:any) {
    this.sortColumn = column;
    // this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    // this.sortIconClass = this.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    this.sortIconClass = this.sortOrder === 1 ? 'arrow_upward' : 'arrow_downward';
    this.getAllappointmentReason(`${column}:${this.sortOrder}`);
 

  }

  ngOnInit(): void {
    this.getLocationDetails();
    this.addnewappointmentReason();
    this.getAllappointmentReason(`${this.sortColumn}:${this.sortOrder}`);
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 2000);
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission(){

    let userPermission = this._coreService.getLocalStorage("loginData").permissions;

    let menuID = sessionStorage.getItem("currentPageMenuID");

    let checkData = this.findObjectByKey(userPermission, "parent_id",menuID)

    if(checkData){
      if(checkData.isChildKey == true){

        var checkSubmenu = checkData.submenu;      

        if (checkSubmenu.hasOwnProperty("appointmentreasons")) {
          this.innerMenuPremission = checkSubmenu['appointmentreasons'].inner_menu;

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

  clearAll() {
    this.searchText = "";
    this.selectedlocationId="";
    this.getAllappointmentReason();
  }
  getAllappointmentReason(sort:any='') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      searchText: this.searchText,
      doctorId:this.userId,
      listFor:'doctor',
      sort:sort,
      selectedlocation:this.selectedlocationId 
    };
    this.doctorService.listAppointmentReason(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      this.totalLength = response?.body?.totalCount;
      this.dataSource = response?.body?.data;
    });
  }
  appointmentReasonExcleForm: FormGroup = new FormGroup({
    appointment_reason_excel: new FormControl("", [Validators.required]),
    selectedlocation:new FormControl("", []),
  });
  excleSubmit() {
    // if (this.appointmentReasonExcleForm.invalid) {
    //   return;
    // }
    this.isSubmitted = true;
    if (this.appointmentReasonExcleForm.value.selectedlocation == '' || this.appointmentReasonExcleForm.invalid) {
      this._coreService.showError("","Please enter required fields")
      return;
    }
    this.isSubmitted=false;
    const formData = new FormData();
    formData.append("user_id", this.userId);
    formData.append("file", this.selectedFiles);
    formData.append('selectedlocation',this.appointmentReasonExcleForm.value.selectedlocation)
   
    // uploadExcelMedicine
    this.doctorService
      .uploadExcelAppointmentReason(formData)
      .subscribe({
        next: (res) => {
          
          let encryptedData = { data: res };
          let response = this._coreService.decryptObjectData(encryptedData);
          if (response.status) {
            this.getAllappointmentReason();
            this.toastr.success(response.message);
            this.closePopup();
          } else {
            this.toastr.error(response.message);
          }
        },
        error:(error: ErrorEvent) => {
          
          let encryptedData = { data: error.error };
          let response = this._coreService.decryptObjectData(encryptedData);
          if(!response.status) {
            this.toastr.error(response.message);
          }
        }
        
      
    });
  }
  addAppointmentReasons() {
    this.isSubmitted = true;
    if (this.appointmentReasonForm.value.selectedlocation == '' || this.appointmentReasonForm.invalid) {
      this._coreService.showError("","Please enter required fields")
      return;
    }
    
    this.isSubmitted = false;
    this.loader.start();
    let reqData = {
      appointmentReasonArray:
        this.appointmentReasonForm.value.appointmentReasonsss,
      doctorId: this.userId,
      selectedlocation: this.appointmentReasonForm.value.selectedlocation 
    };
    this.doctorService
      .addAppointmentReasonApi(reqData)
      .subscribe((res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.loader.stop();
          this.toastr.success(response.message);
          this.getAllappointmentReason();
          this.closePopup();
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      });
  }
  updateAppointmentReasons() {
    this.loader.start();
    this.doctorService
      .updateAppointmentReasonApi(this.editappointmentReasonForm.value)
      .subscribe((res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);

        if (response.status) {
          this.loader.stop();
          this.getAllappointmentReason();
          this.toastr.success(response.message);
          this.closePopup();
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      });
  }

  deleteAppointmentReasons() {
    let reqData = {
      appointmentReasonId: this.appointmentReasonId,
      action_name: "delete",
      action_value: true,
    };
    this.loader.start();
    this.doctorService
      .deleteAppointmentReasonApi(reqData)
      .subscribe((res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.loader.stop();
          this.getAllappointmentReason();
          this.toastr.success(response.message);
          this.closePopup();
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      });
  }

  handleSearch(event: any) {
    this.searchText = event.target.value.trim();
    this.getAllappointmentReason();
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getAllappointmentReason();
  }
  handletoggleChange(event: any, data: any) {
    this.editappointmentReasonForm.patchValue({
      appointmentReasonId: data._id,
      name: data?.name,
      active: event.checked,
      doctorId: data?.doctorId,
    });
    this.updateAppointmentReasons();
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.isSubmitted = false;
    this.appointmentReasonForm.reset();
    this.appointmentReasonsss.clear();
    this.appointmentReasonExcleForm.reset();
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.getAllappointmentReason();
    this.addnewappointmentReason()
    this.selectfilename = "";
    this.selectedFiles = null;
  }

  //-------Form Array Handling----------------
  newappointmentReasonForm(): FormGroup {
    return this.fb.group({
      name: ["", [Validators.required]],
      active: [true, [Validators.required]],
    });
  }

  get appointmentReasonsss(): FormArray {
    return this.appointmentReasonForm.get("appointmentReasonsss") as FormArray;
  }

  addnewappointmentReason() {
    this.appointmentReasonsss.push(this.newappointmentReasonForm());
  }

  removeappointmentReason(i: number) {
    this.appointmentReasonsss.removeAt(i);
  }
  // add
  openVerticallyCenteredaddreason(addreasoncontent: any) {
    // this.getLocationDetails();
    this.modalService.open(addreasoncontent, {
      centered: true,
      size: "lg",
      windowClass: "add_reasons",
    });
  }
  //  Edit appointmentReason service modal
  openVerticallyCenterededitappointmentReasonservice(
    editappointmentReasonservicecontent: any,
    data: any
  ) {
    // this.getLocationDetails();
    this.selectedlocationvalue =data?.locationDetails?.hospital_or_clinic_location?.hospital_id;
    this.editappointmentReasonForm.patchValue({
      appointmentReasonId: data._id,
      name: data?.name,
      active: data?.active,
      doctorId: data?.doctorId,
    });
    this.modalService.open(editappointmentReasonservicecontent, {
      centered: true,
      size: "md",
      windowClass: "edit_appointmentReason_service",
    });
  }
  //delete popup
  openVerticallyCenteredsecond(deletePopup: any, appointmentReasonId: any) {
    this.appointmentReasonId = appointmentReasonId;
    this.modalService.open(deletePopup, { centered: true, size: "sm" });
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

  downloadSampleExcel() {
    const link = document.createElement("a");
    link.setAttribute("target", "_blank");

    link.setAttribute("href", "assets/doc/appointment-reasons.xlsx");
    link.setAttribute("download", `appointment-reasons.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  selectFile(event) {
    let fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      let file: File = fileList[0];
      this.selectedFiles = file;
    }
  }

  openVerticallyCenteredEditplan(imporsubscriber: any) {
    // this.csvFor = csvFor;
    // this.getLocationDetails();
    this.modalService.open(imporsubscriber, {
      centered: true,
      windowClass: "import_subscribes",
    });
  }

  getLocationDetails() {
    let reqData = {
      portal_user_id:  this.userId,
    }
    this.doctorService.getLocationDetailsById(reqData).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        let arr= response.body[0]?.hospital_or_clinic_location;
        arr.map((curentval: any) => {
          this.allLocations.push({
            label: curentval?.hospital_name,
            value: curentval?.hospital_id,
          });
        });
      },
    );
  }

  handleLocationFilter(value: any) {
    this.selectedlocationId = value.value;
    this.getAllappointmentReason();
  }
}
