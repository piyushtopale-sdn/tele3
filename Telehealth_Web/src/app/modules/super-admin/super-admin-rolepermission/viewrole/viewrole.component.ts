import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators,FormArray } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/shared/auth.service';
import { CoreService } from 'src/app/shared/core.service';
import { SuperAdminService } from "../../../super-admin/super-admin.service";
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({
  selector: 'app-viewrole',
  templateUrl: './viewrole.component.html',
  styleUrls: ['./viewrole.component.scss']
})
export class ViewroleComponent implements OnInit {

  isSubmitted: boolean = false;
  displayedColumns: string[] = ['creationdate','rolename', 'status', 'action'];
  userID: string = '';
  dataSource: any;
  roleId: string = '';
  // dataSource = ELEMENT_DATA;
  roleForm: FormGroup;
  roleUpdateForm: FormGroup;
  initialValue: any;
  roleIdForUpdate: any;
  page: any = 1;
  pageSize: number = 5;
  totalLength: number = 0;
  userType: any;
  searchText: any = "";


  sortColumn: string = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';

  constructor(private modalService: NgbModal, private fb: FormBuilder, private _route: Router,
    private _superAdminService: SuperAdminService,
    private _coreService: CoreService, private auth: AuthService, private toastr: ToastrService,
    private loader: NgxUiLoaderService
  ) {
    const userData = this._coreService.getLocalStorage('loginData')
    this.userID = userData._id
    // this.roleForm = this.fb.group({
    //   name: ['', [Validators.required]],
    //   status: [true]
    // })

    this.roleForm = this.fb.group({
      roles: this.fb.array([]),
    });

    this.roleUpdateForm = this.fb.group({
      name: ['', [Validators.required]],
      status: [true]
    })
    this.initialValue = this.roleForm.value
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
  }

  addRole() {
    this.isSubmitted = true;
    if (this.roleForm.invalid) {
      return;
    }
    this.loader.start();
    this.roleForm.value['userId'] = this.userID

    let addData = {
      rolesArray: this.roleForm.value.roles,
      for_user: this.roleForm.value['userId']
    };
    // this._superAdminService.addRole(this.roleForm.value).subscribe(
    this._superAdminService.addRole(addData).subscribe(
      (res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);

        if (response.status) {
          this.loader.stop();
          // this._coreService.showSuccess(response.message, '');
          this.toastr.success(response.message);
          this.roleForm.markAsUntouched();
          this.handleClose()
        }else{
          this.loader.stop();
          this.toastr.error(response.message);
        }

      }, (error) => {
        this.loader.stop();
      })


  }

  public handleClose() {
    let modalRespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalRespose);
    this.roleId = '';
    this.roleList();
    this.roleForm.reset(this.initialValue);

  }

  public openActionPopup(actionPopup: any, id: string) {
    this.roleId = id
    this.modalService.open(actionPopup, { centered: true, size: 'lg' });
  }

  public submitAction() {
    const data = {
      id: this.roleId,
      is_delete: "Yes"
    }
    this.loader.start();
      this._superAdminService.deleteRole(data).subscribe(
        (res: any) => {
          let encryptedData = { data: res };
          let response = this._coreService.decryptObjectData(encryptedData);
          if(response.status){
            this.loader.stop();
            this.toastr.success(response.message);
            this.handleClose()
          }
      // this.roleList();
    }, (error) => {
      this.loader.stop();
    })
  }


  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.roleList();
  }

  roleList(sort:any='') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      userId: this.userID,
      searchText: this.searchText,
      sort:sort
    };
    this._superAdminService.allRoleSuperAdmin(reqData).subscribe(
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
      }, (error) => {

      })

  }

  get roleFormControl(): { [key: string]: AbstractControl } {
    return this.roleForm.controls;
  }

  //  Add Role modal
  openVerticallyCenteredaddrole(addrolecontent: any) {
    this.modalService.open(addrolecontent, { centered: true, size: 'md', windowClass: "add_role" });
  }

  editVerticallyCenteredaddrole(editrolecontent: any, data: any) {
    this.roleIdForUpdate = data.id
    this.roleUpdateForm.patchValue({
      id: data.id,
      name: data.rolename,
      status: data.status
    });

    this.modalService.open(editrolecontent, { centered: true, size: 'md', windowClass: "edit_role" })


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

  editRole() {
    let formValues = this.roleUpdateForm.value
    let dataToPass = {
      id: this.roleIdForUpdate,
      name: formValues.name,
      status: formValues.status,
      is_delete: "No"

    }
    this.loader.start();
      this._superAdminService.updateRole(dataToPass).subscribe(
        (res: any) => {
          let encryptedData = { data: res };
          let response = this._coreService.decryptObjectData(encryptedData);

      if (response.status == true) {
        this.loader.stop();
        this.modalService.dismissAll("Closed")
        this.handleClose();
        this.roleList();
      }

    },(error) => {
      this.loader.stop();
    })
  }

  updateStatus(data: any, event) {

    let dataToPass = {
      id: data.id,
      name: data.name,
      status: event.checked,
      is_delete: "No"
    }
    this.loader.start();
    this._superAdminService.updateRole(dataToPass).subscribe((res: any) => {
      let DecryptResponse = this._coreService.decryptObjectData({data:res})

      if (DecryptResponse.status == true) {
        this.loader.stop();
        this.modalService.dismissAll("Closed")
        this.roleList();
      }
    },(error) => {
      this.loader.stop();
    })

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
