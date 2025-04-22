import { ToastrService } from "ngx-toastr";
import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray
} from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { Router } from "@angular/router";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { AuthService } from "src/app/shared/auth.service";
import { CoreService } from "src/app/shared/core.service";
import { IndiviualDoctorService } from "../../indiviual-doctor.service";
import { NgxUiLoaderService } from "ngx-ui-loader";

export interface PeriodicElement {
  rolename: string;
}

const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: "app-viewrole",
  templateUrl: "./viewrole.component.html",
  styleUrls: ["./viewrole.component.scss"],
})
export class ViewroleComponent implements OnInit {
  @ViewChild("activateDeactivate") activateDeactivate: TemplateRef<any>;
  isSubmitted: boolean = false;
  displayedColumns: string[] = ["creationdate","rolename", "status", "action"];
  userID: string = "";
  dataSource: any;
  roleId: string = "";
  // dataSource = ELEMENT_DATA;
  roleForm: FormGroup;
  editForm: FormGroup;
  initialValue: any;
  roleIdForUpdate: void;

  page: any = 1;
  pageSize: number = 5;
  totalLength: number = 0;
  searchText: any = "";

  roleStatus: any = "Activate";

  sortColumn: string = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private _route: Router,
    private doctorService: IndiviualDoctorService,
    private _coreService: CoreService,
    private auth: AuthService,
    private toastr: ToastrService,
    private loader: NgxUiLoaderService
  ) {
    const userData = this._coreService.getLocalStorage("loginData");
    this.userID = userData._id;
    // this.roleForm = this.fb.group({
    //   name: ["", [Validators.required]],
    //   status: [true],
    // });
    this.roleForm = this.fb.group({
      roles: this.fb.array([]),
    });

    this.editForm = this.fb.group({
      name: ["", [Validators.required]],
      status: [true],
    });
    this.initialValue = this.roleForm.value;
  }

  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortIconClass = this.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.roleList(`${column}:${this.sortOrder}`);
 

  }


  ngOnInit(): void {
    this.roleList(`${this.sortColumn}:${this.sortOrder}`);
    this.addnewRole();
  }

  ngAfterViewInit(): void {
    this.roleList();
  }

  roleData: any;

  handleToggleChangeForActive(roleData: any, event: any) {
    this.roleData = {
      id: roleData.id,
      name: roleData.rolename,
      status: event,
      is_delete: "No",
    };
    if (event === false) {
      this.roleStatus = "Deactivate";
    } else {
      this.roleStatus = "Activate";
    }
    this.modalService.open(this.activateDeactivate);
  }

  public handleClose() {
    let modalRespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalRespose);
    this.roleId = "";
    this.roleList();
    this.roleForm.reset(this.initialValue)
  }

  roleList(sort:any='') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      userId: this.userID,
      searchText: this.searchText,
      sort:sort
    };
    this.doctorService.getAllStaffRoles(reqData).subscribe(
      (res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
        if (response.status) {
          let allRoleData: any = [];
          response?.body?.data.forEach(function (val: any) {
            allRoleData.push({
              rolename: val.name,
              status: val.status,
              action: '',
              id: val._id,
              createdAt:val?.createdAt
            })
          });
          this.dataSource = allRoleData;
          this.totalLength = response?.body?.totalCount;
        }
      },
      //  (error) => {

      // }
      )

  }

  get roleFormControl(): { [key: string]: AbstractControl } {
    return this.roleForm.controls;
  }

  //  Add Role modal
  openVerticallyCenteredaddrole(addrolecontent: any) {
    this.modalService.open(addrolecontent, {
      centered: true,
      size: "md",
      windowClass: "add_role",
    });
  }

  editVerticallyCenteredaddrole(editrolecontent: any, data: any) {
    this.roleIdForUpdate = data.id;
    this.editForm.patchValue({
      id: data.id,
      name: data.rolename,
      status: data.status,
    });

    this.modalService.open(editrolecontent, {
      centered: true,
      size: "md",
      windowClass: "edit_role",
    });
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

  updateStatus() {
    this.loader.start();
    this.doctorService.updateStaffRole(this.roleData).subscribe((res: any) => {
      let response = this._coreService.decryptObjectData({ data: res });

      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.modalService.dismissAll("Closed");
        this.roleList();
      }
    });
  }

  submitAction() {
    this.loader.start();
    const data = {
      id: this.roleId,
      is_delete: "Yes",
    };
    this.doctorService.deleteStaffRole(data).subscribe(
      (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        this._coreService.showSuccess(result.message, "");
        if(result.status){
        this.loader.stop();
        this.handleClose();
        this.roleList();
      }
    },
      (error) => {
        this.loader.stop();
      }
    );
  }

  addRole() {
    this.isSubmitted = true;
    if (this.roleForm.invalid) {
      return;
    }
    this.roleForm.value["userId"] = this.userID;
    this.loader.start();
    // let reqData = {
    //   name: this.roleForm.value["name"],
    //   status: this.roleForm.value["status"],
    //   userId: this.roleForm.value["userId"],
    // };
    let reqData = {
      rolesArray: this.roleForm.value.roles,
      for_user: this.roleForm.value['userId']
    };
    this.doctorService.addRole(reqData).subscribe(
      (res) => {
        let result = this._coreService.decryptObjectData({ data: res });
        if (result.status) {
        this.loader.stop();
          this._coreService.showSuccess(result.message, "");
          this.roleForm.markAsUntouched();
          this.roleForm.reset(this.initialValue);      
          this.handleClose();
  
        }else{
        this.loader.stop();
          this._coreService.showError("",result?.message)
        }
        
      },
      (error) => {
        this.loader.stop();
      }
    );

  }

  editRole() {
    this.loader.start();
    let formValues = this.editForm.value;
    let dataToPass = {
      id: this.roleIdForUpdate,
      name: formValues.name,
      status: formValues.status,
      is_delete: "No",
    };

    this.doctorService.updateRole(dataToPass).subscribe((res: any) => {
      let DecryptResponse = this._coreService.decryptObjectData({ data: res });

      if (DecryptResponse.status == true) {
        this.loader.stop();
        this.modalService.dismissAll("Closed");
        this.roleList();
      }
    });
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.roleList();
  }

  //Delete Modal
  openVerticallyCenteredsecond(deleteModal: any, _id: any) {
    this.roleId = _id;
    this.modalService.open(deleteModal, { centered: true, size: "sm" });
  }

  newRoleForm(): FormGroup {
    return this.fb.group({
      name: ["", [Validators.required]],
      status: [true],
    });
  }

  get roles(): FormArray {
    return this.roleForm.get("roles") as FormArray;
  }

  addnewRole() {
    this.roles.push(this.newRoleForm());
  }

  removeRole(i: number) {
    this.roles.removeAt(i);
  }
}
