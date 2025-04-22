import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "../../indiviual-doctor.service";
import { NgxUiLoaderService } from "ngx-ui-loader";

export interface PeriodicElement {
  templatename: string;
  templatecategory: string;
}
const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: "app-templatebuilder",
  templateUrl: "./templatebuilder.component.html",
  styleUrls: ["./templatebuilder.component.scss"],
})
export class TemplatebuilderComponent implements OnInit {
  displayedColumns: string[] = ["templatename", "templatecategory", "action"];
  dataSource = ELEMENT_DATA;
  page: any = 1;
  searchText: any = "";
  pageSize: number = 5;
  totalLength: number = 0;
  userId: any;
  templateData: any;
  templateId:any;
  sortColumn: string = 'template_name';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';
  userRole: any;
  innerMenuPremission:any=[];
  constructor(
    private modalService: NgbModal,
    private _coreService: CoreService,
    private doctorService: IndiviualDoctorService,
    private toastr: ToastrService,
    private router: Router,
    private loader: NgxUiLoaderService
  ) {
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
  }

  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortIconClass = this.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.getTemplateBuilderList(`${column}:${this.sortOrder}`);
 

  }

  ngOnInit(): void {
    this.getTemplateBuilderList();
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

        if (checkSubmenu.hasOwnProperty("templatebuilder")) {
          this.innerMenuPremission = checkSubmenu['templatebuilder'].inner_menu;

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
  getTemplateBuilderList(sort:any='') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      doctorId: this.userId,
      searchText: this.searchText,
      sort:sort
    };
    this.doctorService.gettemplateBuilderListApi(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      this.totalLength = response?.body?.count;
      this.dataSource = response?.body?.result;
      this.templateData = response?.body?.result;
    });
  }

  deleteTemplate() {
    let data = {
      templateId: this.templateId,
    };
    this.loader.start();
    this.doctorService.deleteTemplateBuilder(data).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status == true) {
        this.loader.stop();
        this.getTemplateBuilderList();
        this.toastr.success(response.message);
        this.closePopup();
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }
  openEdit(id: any) {
    this.router.navigate(["/individual-doctor/templatebuilder/add"], {
      queryParams: { id: id },
    });
  }

  handleSearchdata(event: any) {
    this.searchText = event.target.value.trim();
    this.getTemplateBuilderList();
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getTemplateBuilderList();
  }
  clearAll() {
    this.searchText = '';
    this.getTemplateBuilderList();
  }
  closePopup() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    this.getTemplateBuilderList();
  }

  //delete popup
  openVerticallyCenteredsecond(deletePopup: any, templateId:any) {
    this.templateId = templateId;
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
}
