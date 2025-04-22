import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/shared/auth.service';
import { CoreService } from 'src/app/shared/core.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SuperAdminService } from '../super-admin.service';

@Component({
  selector: 'app-super-admin-questionaire-management',
  templateUrl: './super-admin-questionaire-management.component.html',
  styleUrls: ['./super-admin-questionaire-management.component.scss']
})
export class SuperAdminQuestionaireManagementComponent {
  isSubmitted: boolean = false;
  displayedColumns: string[] = ['questions', 'question_for', 'order', 'status', 'action'];
  dataSource: any;
  page: any = 1;
  pageSize: number = 10;
  totalLength: number = 0;
  searchText = "";
  assessmentId: any;
  questionFor: any ='';
  action_name: string;
  action_value: any;
  action_type: any;

  constructor(private modalService: NgbModal, private fb: FormBuilder, private _route: Router,
    private _superAdminService: SuperAdminService,
    private _coreService: CoreService, private auth: AuthService,
    private loader: NgxUiLoaderService,
    private cd: ChangeDetectorRef
  ) { }


  ngOnInit(): void {
    this.listQuestionaire();
  }

  ngAfterViewInit(): void {
  }

  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.listQuestionaire();
  }

  handleSearchFilter(text: any) {
    this.searchText = text.trim();
    this.listQuestionaire();
  }

  listQuestionaire() {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      searchText: this.searchText,
      questionFor:this.questionFor
    };
    this._superAdminService.list_Questionnaire(reqData).subscribe(
      (res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.dataSource = response?.body?.result;
          this.totalLength = response?.body?.totalRecords;
        } else {
          // this._coreService.showError("", response.message);
        }
      }, (error) => {
        // this._coreService.showError("", error.error.message);
      })

  }


  updateStatus(action_name: any) {
    let dataToPass = {}
    if (action_name === 'isActivated') {      
      dataToPass = {
        assessmentId: this.assessmentId,
        action_name: action_name,
        action_value: this.action_value,
        questionForType: this.action_type
      }
    } else {
      dataToPass = {
        assessmentId: this.assessmentId,
        action_name: action_name,
        action_value: true,
      }
    }
    this.loader.start();
    this._superAdminService.delete_activeQuestionnaire(dataToPass).subscribe((res: any) => {
      let response = this._coreService.decryptObjectData({ data: res })

      if (response.status) {
        this._coreService.showSuccess("", response.message);
        this.loader.stop();
        this.modalService.dismissAll("close");
        this.listQuestionaire();
      } else {
        this.loader.stop();
        this._coreService.showError("", response.message);
      }
    }, (error) => {
      this.loader.stop();
      // this._coreService.showSuccess("", error.error.message);
    })

  }

  routeToEdit(id: any) {
    this._route.navigate([`/super-admin/questionnaire-management/edit-questions/${id}`])
  }

  saveOrder(element: any) {
    let dataToPass = {
      assessmentId: element._id,
      orderNo: element.orderNo
    }
    this._superAdminService.orderNoUpdate_questionnaire(dataToPass).subscribe((res: any) => {
      let response = this._coreService.decryptObjectData({ data: res })

      if (response.status) {
        this.listQuestionaire();
      } else {
        this._coreService.showError("", response.message);
      }
    }, (error) => {
      // this._coreService.showError("", error.error.message);
    })
  }

  //delete popup
  openVerticallyCenteredsecond(deletePopup: any, id: any) {
    this.assessmentId = id;
    this.modalService.open(deletePopup, { centered: true, size: "sm" });
  }

  handleStatus(event: any) {
    this.questionFor = event;
    this.listQuestionaire();
  }


  clearFilter() {
    this.questionFor = '';
    this.listQuestionaire();
  }


   //status popup
   openVerticallystatusPopup(statuspopup: any ,id:any, event:any, type:any, action_name:any) {    
    this.assessmentId = id;
    this.action_value = event;
    this.action_name = action_name;
    this.action_type = type;
    this.modalService.open(statuspopup, { centered: true, size: "sm" }); 
  }

  closePopup() {
    this.modalService.dismissAll("close");
    this.listQuestionaire()
  }
}
