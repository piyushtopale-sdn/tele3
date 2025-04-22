import { Component, OnInit, Inject, ViewEncapsulation, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute } from "@angular/router";
import { FormioOptions, FormioHookOptions } from "angular-formio";
import { ToastrService } from "ngx-toastr";
import { CoreService } from "src/app/shared/core.service";

import { IndiviualDoctorService } from '../../indiviual-doctor.service';
import { NgxUiLoaderService } from "ngx-ui-loader";


export interface PeriodicElement {
  orderno: number;
  question: string;
  controlname: string;
  options: string;
  status: string;
  isrequired: string;
}
const ELEMENT_DATA: PeriodicElement[] = [
  {
    orderno: 3,
    question: "Do you smoke?",
    controlname: "Radio Button",
    options: "yes, no",
    status: "Active",
    isrequired: "Yes",
  },
  {
    orderno: 4,
    question: "Do you smoke?",
    controlname: "Radio Button",
    options: "yes, no",
    status: "Active",
    isrequired: "Yes",
  },
  {
    orderno: 5,
    question: "Do you smoke?",
    controlname: "Radio Button",
    options: "yes, no",
    status: "Active",
    isrequired: "Yes",
  },
];

@Component({
  selector: "app-questionnaire",
  templateUrl: "./questionnaire.component.html",
  styleUrls: ["./questionnaire.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class QuestionnaireComponent implements OnInit {
  Questionnaire: FormGroup
  loginUserId: any
  displayedColumns: string[] = [
    'orderno',
    'question',
    'controlname',
    'options',
    'status',
    'isrequired',
    'action'];


  dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
  userId: any;
  page: any = 1;
  searchText: any = "";
  pageSize: number = 5;
  totalLength: number = 0;
  submitted: boolean = false;
  questionnaireId: any;
  textFieldTypes: any[];
  controlsList: any[];
  selectedControlType: any;
  isShowAddOptions = false;
  controlsFormGroup: FormGroup;
  type: any
  isUpdate: boolean = false
  innerMenuPremission:any=[];
  sortColumn: string = 'question';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';

  @ViewChild(MatPaginator) paginator: MatPaginator;
  userRole: any;
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  constructor(
    private modalService: NgbModal,
    private _coreService: CoreService,
    private activatedRoute: ActivatedRoute,
    private doctorService: IndiviualDoctorService,
    private toastr: ToastrService,
    private loader: NgxUiLoaderService,
    private formBuilder: FormBuilder,
    private _individualdoctorSevice: IndiviualDoctorService,
    private coreService: CoreService) {

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

    this.type = "";
    this.textFieldTypes = [{ name: 'Text', value: 'text' }, { name: 'Numeric', value: 'number' }];
    this.controlsList = [{ id: 'textbox', value: 'text', hasOptions: false }, { id: 'checkbox', value: 'text', hasOptions: true }, { id: 'selectlist', value: 'text', hasOptions: true }, { id: 'radiobutton', value: 'text', hasOptions: true }, { id: 'textarea', value: 'text', hasOptions: false }]
    this.createForm("");
  }

  onSortData(column:any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortIconClass = this.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.getlist(`${column}:${this.sortOrder}`);
 

  }

  ngOnInit(): void {
    this.getlist(`${this.sortColumn}:${this.sortOrder}`);
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

        if (checkSubmenu.hasOwnProperty("questionnairemanagement")) {
          this.innerMenuPremission = checkSubmenu['questionnairemanagement'].inner_menu;

        } else {
          console.log(`does not exist in the object.`);
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


  createForm(providerQuestion: any | null) {

    this.controlsFormGroup = this.formBuilder.group({
      questionText: [providerQuestion ? providerQuestion.question : undefined, [Validators.required]],
      id: [providerQuestion ? providerQuestion.questionId : undefined],
      options: this.formBuilder.array([]),
      questionnaireTypeControlId: [providerQuestion ? providerQuestion.controller : undefined, [Validators.required]],
      order: [providerQuestion ? providerQuestion.questionId : undefined],
      isActive: [providerQuestion ? providerQuestion.active : true],
      isRequired: [providerQuestion ? providerQuestion.required : true],
      type: [(providerQuestion && providerQuestion.control && providerQuestion.control.type) ? providerQuestion.control.type : undefined],
    });

    if (providerQuestion && providerQuestion.controller && providerQuestion.options && providerQuestion.options.length > 0) {
      this.isShowAddOptions = true;
      const optionsObjs = [...providerQuestion.options];

      const options = [...optionsObjs.map(x => x.option)];
      this.bindOptions(options);
    }
    if (providerQuestion) {
      this.selectedControlType = providerQuestion.controller;
    }

  }










  onControltypeChange(value: any) {

    const controlType = this.controlsList.find(x => x.id === value);

    this.isShowAddOptions = controlType.hasOptions;
    if (controlType.hasOptions) {
      if (this.optionsControlFormGroup.length == 0) {
        this.addQuestionnaireControlOption('');
      }
    } else {
      this.controlsFormGroup.controls['options'] = this.formBuilder.array([]);
    }


    const isShowType = controlType.id === 'textbox' ? true : false;



    if (isShowType) {
      if (!this.controlsFormGroup.controls['type'].value)
        this.controlsFormGroup.controls['type'].setValue('text');
    }
  }



  get optionsControlFormGroup() {
    return <FormArray>this.controlsFormGroup.controls['options'];
  }


  addQuestionnaireControlOption(option: string) {

    const control = this.formBuilder.group({
      option: [option ? option : undefined, [Validators.required]]
    })
    this.optionsControlFormGroup.push(control);
  }

  removeOption(index) {

    this.optionsControlFormGroup.removeAt(index);
  }


  get f() { return this.controlsFormGroup.controls; }

  get isShowType(): boolean {
    {
      if (this.controlsList && this.controlsList.length > 0 && this.selectedControlType) {
        const texTcontrol = this.controlsList.find(x => x.id === 'textbox');
        return (texTcontrol && texTcontrol.id == this.selectedControlType) ? true : false;
      } else {
        return false;
      }
    }
  }

  bindOptions(options: string[]) {
    options.forEach(o => {
      this.addQuestionnaireControlOption(o);
    });
  }











  getlist(sort:any='') {
    let reqData = {
      page: this.page,
      limit: this.pageSize,
      searchText: this.searchText,
      doctorId: this.userId,
      sort:sort
    };
    this.doctorService.questiinnaireListApi(reqData).subscribe((res) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      this.totalLength = response?.body?.totalCount;
      this.dataSource = response?.body?.data;
    });
  }
  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getlist();
  }

  deleteQestionnaire(action_value: boolean, action_name: any) {
    let reqData = {
      questionnaireId: this.questionnaireId,
      action_name: action_name,
      action_value: action_value,
    };
    this.doctorService.deleteQuestionnaireApi(reqData).subscribe((res: any) => {
      let encryptedData = { data: res };
      let response = this._coreService.decryptObjectData(encryptedData);
      if (response.status) {
        this.getlist();
        this.toastr.success(response.message);
        this.closePopup();
      } else {
        this.toastr.error(response.message);
      }
    });
  }
  closePopup() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
    
  }

  addQuestionnaire() {
    let param = {
      controller: this.controlsFormGroup.value.questionnaireTypeControlId,
      question: this.controlsFormGroup.value.questionText,
      type: this.controlsFormGroup.value.type,
      options: this.controlsFormGroup.value.options,
      active: this.controlsFormGroup.value.isActive? this.controlsFormGroup.value.isActive:false,
      required: this.controlsFormGroup.value.isRequired?this.controlsFormGroup.value.isRequired:false,

    }
    if (this.isUpdate) {
      this.loader.start();
      param['questionnaireId'] = this.questionnaireId
      this._individualdoctorSevice.updateQuestionnaire(param).subscribe({
        next: (res) => {
          let result = this.coreService.decryptObjectData({ data: res })
          if(result?.status){
          this.loader.stop();
          this.toastr.success(result.message)
          this.closePopup()
          this.getlist()
          this.controlsFormGroup.reset()
        }
        },

        error: (err) => {
          this.loader.stop();
          console.log(err)
        }
      })
    }
    else {
      this.loader.start();
      param['doctorId'] = this.userId
      this._individualdoctorSevice.addQuestionnaire(param).subscribe({
        next: (res) => {

          let result = this.coreService.decryptObjectData({ data: res })
          if(result.status){
          this.loader.stop();
          this.toastr.success(result.message)
          this.closePopup()
          this.getlist()
          this.controlsFormGroup.reset()
        }
        },

        error: (err) => {
          this.loader.stop();
          console.log(err)
        }
      })

    }

  }


  getquestionDetails(id: any) {
    let param = { questionnaireId: id }
    this._individualdoctorSevice.getQuestionnaireDetails(param).subscribe({
      next: (res) => {

        let result = this.coreService.decryptObjectData({ data: res })
        this.createForm(result.body);
      },

      error: (err) => {
        console.log(err)
      }
    })

  }












  //  Add Leave modal
  openVerticallyCenteredaddquestion(addquestioncontent: any) {
    this.isUpdate = false;
    this.modalService.open(addquestioncontent, {
      centered: true,
      size: "lg",
      windowClass: "add_question",
      backdrop: "static"
    });
  }
  //  Add Leave modal


  //  Update Leave modal
  openVerticallyCenteredupdatequestion(updatequestioncontent: any, id: any) {
    this.getquestionDetails(id)
    this.questionnaireId = id
    this.isUpdate = true
    this.modalService.open(updatequestioncontent, {
      centered: true,
      size: "lg",
      windowClass: "add_question",
      backdrop: "static"
    });
  }
  //delete popup
  openVerticallyCenteredsecond(deletePopup: any, questionnaireId: any) {
    this.questionnaireId = questionnaireId;
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

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };







}
