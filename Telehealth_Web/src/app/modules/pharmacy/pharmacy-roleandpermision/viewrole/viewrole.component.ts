import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators,FormArray } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/shared/auth.service';
import { CoreService } from 'src/app/shared/core.service';
import { PharmacyService } from '../../pharmacy.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';


export interface PeriodicElement {
  rolename: string;
}

// const ELEMENT_DATA: PeriodicElement[] = [
//   { rolename: 'Paramedical Consultation' },
//   { rolename: 'Paramedical Consultation' },
//   { rolename: 'Paramedical Consultation' },
//   { rolename: 'Paramedical Consultation' },
//   { rolename: 'Paramedical Consultation' },
//   { rolename: 'Paramedical Consultation' },
// ];

const ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: 'app-viewrole',
  templateUrl: './viewrole.component.html',
  styleUrls: ['./viewrole.component.scss']
})
export class ViewroleComponent implements OnInit {

  isSubmitted: boolean = false;
  displayedColumns: string[] = ["creationdate",'rolename', 'status', 'action'];
  userID: string = '';
  dataSource: any;
  roleId: string = '';
  // dataSource = ELEMENT_DATA;
  roleForm: FormGroup;
  editForm: FormGroup
  initialValue: any;
  roleIdForUpdate: void;
  page: any = 1;
  pageSize: number = 5;
  totalLength: number = 0;
  userType: any;
  searchText: any = "";
  constructor(private modalService: NgbModal, private fb: FormBuilder, private _route: Router,
    private _pharmacyServices: PharmacyService,
    private loader: NgxUiLoaderService,
    private _coreService: CoreService, private auth: AuthService, 
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

    this.editForm = this.fb.group({
      name: ['', [Validators.required]],
      status: [true]
    })
    this.initialValue = this.roleForm.value
  }
  sortColumn: string = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';

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
    this.roleForm.value['userId'] = this.userID
    this.loader.start();
    let addData = {
      rolesArray: this.roleForm.value.roles,
      for_user: this.roleForm.value['userId']
    };
    this._pharmacyServices.addRole(addData).subscribe((res) => {
    // this._pharmacyServices.addRole(this.roleForm.value).subscribe((res) => {
      let result = this._coreService.decryptObjectData({data:res});
      if (result.status) {
        this._coreService.showSuccess(result.message, '');
        this.loader.stop()
        this.roleForm.reset(this.initialValue);
        this.roleForm.markAsPristine();
        this.roleForm.markAsUntouched();
        this.handleClose()
        this.roleList()
      }else{
        this.loader.stop();
        this._coreService.showError("",result?.message)
      }

    }, (error) => {
      this.loader.stop();

    })


  }

  public handleClose() {
    let modalRespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalRespose);
    this.roleForm.reset();
    this.roleId = '';
  }

  public openActionPopup(actionPopup: any, id: string) {
    this.roleId = id
    this.modalService.open(actionPopup, { centered: true, size: 'lg' });
  }

  public submitAction() {
    this.loader.start();

    const data = {
      id: this.roleId,
      is_delete: "Yes"
    }
    this._pharmacyServices.deleteRole(data).subscribe((res) => {
      let result = this._coreService.decryptObjectData(res);
      this.loader.stop();
      this._coreService.showSuccess(result.message, '');

      this.handleClose()
      this.roleList();
    }, (error) => {
      console.log('error in add role', error);
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
    this._pharmacyServices.allRoles(reqData).subscribe(
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

  // roleList() {
  //   this._pharmacyServices.allRole(this.userID).subscribe((res) => {
  //     let result = this._coreService.decryptObjectData(res);

  //     if (result.status) {
  //       let allRoleData: any = [];
  //       result.body.forEach(function (val: any) {
  //         allRoleData.push({
  //           rolename: val.name,
  //           status: val.status,
  //           action: '',
  //           id: val._id
  //         })
  //       });
  //       this.dataSource = allRoleData;
  //     }
  //   }, (error) => {

  //   })

  // }





  get roleFormControl(): { [key: string]: AbstractControl } {
    return this.roleForm.controls;
  }
  get editFormControl(): { [key: string]: AbstractControl } {
    return this.editForm.controls;
  }



  //  Add Role modal
  openVerticallyCenteredaddrole(addrolecontent: any) {
    this.modalService.open(addrolecontent, { centered: true, size: 'md', windowClass: "add_role" });
  }

  editVerticallyCenteredaddrole(editrolecontent: any, data: any) {
    this.roleIdForUpdate = data.id
    this.editForm.patchValue({
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
    let formValues = this.editForm.value
    this.loader.start();

    let dataToPass = {
      id: this.roleIdForUpdate,
      name: formValues.name,
      status: formValues.status,
      is_delete: "No"

    }

    this._pharmacyServices.updateRole(dataToPass).subscribe((res: any) => {
      let DecryptResponse = this._coreService.decryptObjectData(res)
      if (DecryptResponse.status == true) {
        this._coreService.showSuccess(DecryptResponse.message, "")
        this.loader.stop();
        this.modalService.dismissAll("Closed")
        this.roleList();

      } else {
        this.loader.stop();
        this._coreService.showSuccess(DecryptResponse.message, "")
      }

    })
  }

  updateStatus(data: any, event) {
    this.loader.start();

    let dataToPass = {
      id: data.id,
      name: data.name,
      status: event.checked,
      is_delete: "No"
    }
    this._pharmacyServices.updateRole(dataToPass).subscribe((res: any) => {
      let DecryptResponse = this._coreService.decryptObjectData(res)
      if (DecryptResponse.status == true) {
        if (event.checked) {
           this.loader.stop();
           
          this._coreService.showSuccess("status Active", '')
        } else {
          this.loader.stop();

          this._coreService.showSuccess("status inactive", '')
        }
        //  this._coreService.showSuccess()
        this.loader.stop();

        this.modalService.dismissAll("Closed")

        this.roleList();

      }

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