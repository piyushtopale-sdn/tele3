import { CoreService } from "./../../../shared/core.service";
import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  HostListener,
} from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {
  FormGroup,
  FormBuilder,
  FormArray,
  Validators,
  AbstractControl,
  FormControl,
} from "@angular/forms";
import { SuperAdminService } from "../super-admin.service";
import { ToastrService } from "ngx-toastr";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { Router } from "@angular/router";
import { Editor, Toolbar } from "ngx-editor";

export interface PeriodicElement {
  _id: string;
  planname: string;
  features: string;
  price: string;
  timeinterval: string;
  plantype: string;
  status: string;
  togglestatus: string;
  action: string;
  createdAt: string;
}

const ELEMENT_DATA: PeriodicElement[] = [];
@Component({
  selector: "app-super-subscriptionplan",
  templateUrl: "./super-subscriptionplan.component.html",
  styleUrls: ["./super-subscriptionplan.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class SuperSubscriptionplanComponent implements OnInit {
  loginID: any;
  innerMenuPremission: any = [];
  loginrole: any;
  @HostListener("document:keydown", ["$event"]) //On pressing Escape
  onKeyDownHandler(event: KeyboardEvent) {
    if (event.key === "Escape") {
      this.closePopup();
    }
  }

  displayedColumns: string[] = [
    "createdAt",
    "planname",
    "features",
    "price",
    "timeinterval",
    "status",
    "togglestatus",
    "action",
  ];
  dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  isSubmitted: any = false;
  editPlan!: FormGroup;
  addPlan!: FormGroup;
  service_name_array: any;
  subscriptionPlanId = "";
  pageSize: number = 5;
  totalLength: number = 0;
  page: any = 1;
  search_with_plan_name: any = "";
  is_activated: any = "all";
  plan_for: any = "all";

  sortColumn: string = 'plan_name';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';
  portalName: any;
  isTrialControl: FormControl;
  currentUrl:any =[];
  abouteditor!: Editor;
  abouteditor_arabic!: Editor;
  toolbar: Toolbar = [
    ["bold", "italic", "underline", "text_color", "background_color", "strike"],
    ["align_left", "align_center", "align_right", "align_justify"],
    ["ordered_list", "bullet_list"],
    ["code", "blockquote"],
    [{ heading: ["h1", "h2", "h3", "h4", "h5", "h6"] }],
    // ["link", "image"],
  ];

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private service: SuperAdminService,
    private toastr: ToastrService,
    private _coreService: CoreService,
    private loader: NgxUiLoaderService,
    private router : Router
  ) {

    const userData = this._coreService.getLocalStorage('loginData')
    this.loginrole = this._coreService.getLocalStorage("adminData").role;

    this.loginID = userData._id
    this.isTrialControl = new FormControl(false);

    this.editPlan = this.fb.group({
      _id: [""],
      plan_for: ["patient"],
      plan_name: ["", [Validators.required]],
      plan_name_arabic: ["", [Validators.required]],
      description: ['', Validators.required],
      descriptionArabic:['', Validators.required],
      plan_price: ["", [Validators.required]],
      plan_duration: ["monthly", [Validators.required]],
      trial_period: [""],
      is_activated: [true, [Validators.required]],
      services: this.fb.array([]),
    });

    this.addPlan = this.fb.group({
      trial_period: [""],
      trial_period_description: [""],
      plan_for: ["patient",],
      plan_name: ["", [Validators.required]],
      plan_name_arabic: ["", [Validators.required]],
      description: ['', Validators.required],
      description_arabic: ['',Validators.required],
      // plan_price: ["", [Validators.required]],
      // price_per_member: [""],                                     [[6 Feb 2025 comment Add on per person ]]
      plan_duration: this.fb.array([this.createOption()]),
      is_activated: [true, [Validators.required]],
      // services: this.fb.array([]),
      services: this.fb.array([
        this.fb.group({ name: "consultation", max_number: [0, [Validators.required, Validators.min(0)]] }),
        // this.fb.group({ name: "labtest", max_number: [0, [Validators.required, Validators.min(0)]] }),
        // this.fb.group({ name: "radiology", max_number: [0, [Validators.required, Validators.min(0)]] })
      ]),
    });
  }

  validateNumberInput(event: KeyboardEvent): boolean {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    const keyCode = event.key;

    // Allow control keys like backspace, tab, arrows, etc.
    if (allowedKeys.includes(keyCode)) {
      return true;
    }

    // Block non-numeric characters, except for '.'
    if (!/^[0-9]$/.test(keyCode)) {
      event.preventDefault();
      return false;
    }

    return true;
  }


  get options() {
    return this.addPlan.get('plan_duration') as FormArray;
  }

  createOption(): FormGroup {
    return this.fb.group({
      duration: ['monthly', [Validators.required]],
      price: ["", [Validators.required]],
    });
  }


  addOption() {
    (this.addPlan.get('plan_duration') as FormArray).push(this.createOption());
  }

  removeOption(index: number) {
    (this.addPlan.get('plan_duration') as FormArray).removeAt(index);
  }


  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortIconClass = this.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.getPlans(`${column}:${this.sortOrder}`);
  }

  ngOnInit(): void {
    // this.addNewService();
    this.getPlans(`${this.sortColumn}:${this.sortOrder}`);
    // this.getPeriodicList();
    this.isTrialControl.valueChanges.subscribe(isChecked => {
      this.onTrialCheckboxChange(isChecked);
    });
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 2000);
    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl);
    this.abouteditor = new Editor();
    this.abouteditor_arabic = new Editor();
  }
  ngOnDestroy(): void {
    this.abouteditor.destroy();
    this.abouteditor_arabic.destroy();
  }


  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission() {
    let userPermission = this._coreService.getLocalStorage("adminData").permissions;
    if (userPermission) {
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
  }

  giveInnerPermission(value) {
    if (this.loginrole == 'STAFF_USER') {
      const checkRequest = this.innerMenuPremission.find(request => request.slug === value);
      return checkRequest ? checkRequest.status : false;
    }
    else {
      return true;
    }
  }

  getPlans(sort: any = '') {
    this.service
      .getPlan(
        this.page,
        this.pageSize,
        this.search_with_plan_name,
        this.plan_for,
        this.is_activated, 'createdAt:-1'
      )
      .subscribe((res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        this.dataSource = response.body?.allPlans;
        this.totalLength = response.body?.totalRecords;
      });
  }

  onTrialCheckboxChange(isChecked: boolean) {
    const trialPeriodControl = this.addPlan.get('trial_period');
    const trialPeriodDescriptionControl = this.addPlan.get('trial_period_description');

    if (isChecked) {
      trialPeriodControl.enable();
      trialPeriodDescriptionControl.enable();
    } else {
      trialPeriodControl.disable();
      trialPeriodDescriptionControl.disable();
    }
  }

  addNewPlan() {
    this.isSubmitted = true;
    if (this.addPlan.invalid) {
      return;
    }
    const additionalKey = 'createdBy';
    const additionalValue = this.loginID;
    let plan_duration = [];
    let services = []
    this.addPlan.value.plan_duration.forEach((element) => {
      let obj = element;
      plan_duration.push(obj);
    });
    this.addPlan.value.services.forEach((element) => {
      let obj = element;

      services.push(obj);
    });
    const modifiedData = {
      trial_period: this.addPlan.value.trial_period,
      trial_period_description: this.addPlan.value.trial_period_description,
      plan_for: this.addPlan.value.plan_for,
      plan_name: this.addPlan.value.plan_name,
      plan_name_arabic: this.addPlan.value.plan_name_arabic,
      description: this.addPlan.value.description,                  //description
      descriptionArabic: this.addPlan.value.description_arabic,  
      // price_per_member: this.addPlan.value.price_per_member,              [[6 Feb 2025 comment Add on per person ]]
      plan_duration: plan_duration,
      is_activated: this.addPlan.value.is_activated,
      services: services
    };

    modifiedData[additionalKey] = additionalValue;
    this.loader.start();
    this.isSubmitted = false;
    this.service.addPlan(modifiedData).subscribe((res: any) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.getPlans();
        this.closePopup();
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  // updatePlan() {
  //   this.isSubmitted = true;
  //   if (this.editPlan.invalid) {
  //     return;
  //   }
  //   this.isSubmitted = false;
  //   this.loader.start();
  //   this.service.updatePlan(this.editPlan.value).subscribe((res) => {
  //     let response = this._coreService.decryptObjectData({ data: res });
  //     if (response.status) {
  //       this.loader.stop();
  //       this.toastr.success(response.message);
  //       this.getPlans();
  //       this.closePopup();
  //     } else {
  //       this.loader.stop();
  //       this.toastr.error(response.message);
  //     }
  //   });
  // }

  updatePlan() {
    this.isSubmitted = true;
    if (this.editPlan.invalid) {
      return;
    }
    this.isSubmitted = false;
    this.loader.start();
  
    const formData = this.editPlan.value;
    
    const updatedPlan = {
      ...formData,
      plan_duration: [
        {
          price: formData.plan_price,
          duration: formData.plan_duration 
        }
      ]
    };
    
    this.service.updatePlan(updatedPlan).subscribe(
      (res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        if (response.status) {
          this.loader.stop();
          this.toastr.success(response.message);
          this.getPlans();
          this.closePopup();
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      },
      (error) => {
        console.error('API error:', error);
        this.loader.stop();
        this.toastr.error('An error occurred while updating the plan.');
      }
    );
  }

  // handleToggelUpdate(data: any, event: any) {
   
  //   for (let i of data.services) {
  //     this.addEditService();
  //   }
  //   this.editPlan.patchValue({
  //     _id: data._id,
  //     plan_for: data.plan_for,
  //     plan_name: data.plan_name,
  //     plan_name_arabic: data.plan_name_arabic,
  //     plan_price: data.plan_duration[0].price,
  //     plan_duration: data.plan_duration[0].duration,
  //     trial_period: data.trial_period,
  //     is_activated: event.checked,
  //     services: data.services,
  //   });
  //   this.loader.start();
  //   this.service.updatePlan(this.editPlan.value).subscribe((res) => {
  //     let response = this._coreService.decryptObjectData({ data: res });
  //     if (response.status) {
  //       this.loader.stop();
  //       this.toastr.success(response.message);
  //       this.getPlans();
  //       this.closePopup();
  //     } else {
  //       this.loader.stop();
  //       this.toastr.error(response.message);
  //     }
  //   });
  // }

  handleDeletePlan() {
    this.loader.start();
    this.service.deletePlan(this.subscriptionPlanId).subscribe((res: any) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.getPlans();
        this.closePopup();
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  // getPeriodicList() {
  //   this.service.getPeriodicList().subscribe((res) => {
  //     let response = this._coreService.decryptObjectData({ data: res });
  //     this.periodicList = response.body.allPeriodicalPlans;
  //   });
  // }

  // getPlanDetails() {
  //   this.service.getPlanDetails().subscribe((res) => {
  //     let response = this._coreService.decryptObjectData(res);
  //   });
  // }

  handleChangePlanFor(event: any) {
    this.service.getPlanFor(event).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      this.service_name_array = response.body;
      this.portalName = response?.body[0]?.plan_for;
    });
  }

  handleStatusFilter(event: any) {
    this.is_activated = event;
    this.getPlans();
  }

  handlePlanForFilter(event: any) {
    this.plan_for = event;
    this.getPlans();
  }

  handleSearchFilter(event: any) {
    this.search_with_plan_name = event.target.value.trim();
    this.getPlans();
  }

  clearFilter() {
    this.search_with_plan_name = "";
    this.plan_for = "all";
    this.is_activated = "all";
    this.getPlans();
  }

  handleRadioChange(event: any, string: any, index: any) {
    if (event.value && string === "add") {
      this.services.at(index).patchValue({
        max_number: null,
      });
    }

    if (event.value && string === "edit") {
      this.editService.at(index).patchValue({
        max_number: null,
      });
    }
  }

  //---------------------FromArray handling------------------------

  get services() {
    return this.addPlan.controls["services"] as FormArray;
  }

  addNewService() {
    const serviceArray = this.addPlan.get('services') as FormArray;
    serviceArray.clear();
    const initialServices = [
      { name: 'consultation', max_number: 0 },
      // { name: 'labtest', max_number: 0 },
      // { name: 'radiologytest', max_number: 0 }
    ];

    initialServices.forEach(service => {
      serviceArray.push(this.fb.group(service));
    });    
  }

  // Add a getter method for convenience
  get serviceControls() {
    return this.services.controls;
  }

  get editService() {
    return this.editPlan.controls["services"] as FormArray;
  }

  addEditService() {
    const serviceEditForm = this.fb.group({
      name: ["", [Validators.required]],
      is_unlimited: [false, [Validators.required]],
      max_number: [0],
    });
    this.editService.push(serviceEditForm);
  }

  deleteService(index: number) {
    this.services.removeAt(index);
    this.onChangeService();
  }

  deleteEditService(index: number) {
    this.editService.removeAt(index);
  }

  openVerticallyCenteredsecond(deleteModal: any, _id: any) {
    this.subscriptionPlanId = _id;
    this.modalService.open(deleteModal, { centered: true, size: "md" });
  }

  openVerticallyCenteredadd(addmodal: any) {
    this.addPlan.get('is_activated').setValue(true);
    this.addPlan.get('plan_for').setValue('patient');
    this.addNewService();
    this.modalService.open(addmodal, { centered: true, size: "lg" });
    this.onChangeService();
  }

  openEditPopup(editmodal: any, data: any) {
    this.editService.clear();
  
    if (data.services && data.services.length > 0) {
      this.editService.push(
        this.fb.group({
          name: [data.services[0].name, [Validators.required]],
          is_unlimited: [data.services[0].is_unlimited],
          max_number: [data.services[0].max_number || 0],
        })
      );
    } else {
      this.editService.push(
        this.fb.group({
          name: ["No. of Consultations", [Validators.required]],
          is_unlimited: [false, [Validators.required]],
          max_number: [0],
        })
      );
    }
  
    const currentDuration = data.plan_duration && data.plan_duration.length > 0 
      ? data.plan_duration[0].duration || "monthly" 
      : "monthly";
  
    this.editPlan.patchValue({
      _id: data._id,
      plan_for: data.plan_for,
      plan_name: data.plan_name,
      plan_name_arabic: data.plan_name_arabic,
      description: data.description,
      descriptionArabic: data.descriptionArabic,
      plan_price: data.plan_duration[0].price,
      plan_duration: currentDuration, // Set the duration type
      trial_period: data.trial_period,
      is_activated: data.is_activated,
    });
    
    this.modalService.open(editmodal, { centered: true, size: "lg" });
  }
  closePopup() {
    this.modalService.dismissAll("close");
    this.isSubmitted = false;
    this.addNewService(); // Reinitialize services after reset
    // const services = this.addPlan.get('services') as FormArray;
    // services.controls.forEach((service) => {
    //   service.get('duration')?.patchValue('monthly');
    // });
    this.addPlan.reset();

  }


  handlePageEvent(data: any) {
    this.page = data.pageIndex + 1;
    this.pageSize = data.pageSize;
    this.getPlans();
  }

  /**Feb 6 AP */
  handletoggleChange(event: any, data: any) {
      this.loader.start();
      let reqData = {
        id: data?._id,
        action_name: "active",
        action_value: event.checked,
      };
   
      this.service.deleteSubscriptionPlan(reqData).subscribe((res: any) => {
        let encryptedData = { data: res };
        let response = this._coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.loader.stop();
          // this.getAllList();
          this.getPlans()
          this.toastr.success(response.message);
        } else {
          this.loader.stop();
          this.toastr.error(response.message);
        }
      });
    }

  get addPlanControl(): { [key: string]: AbstractControl } {
    return this.addPlan.controls;
  }

  get editPlanControl(): { [key: string]: AbstractControl } {
    return this.editPlan.controls;
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

  selectedService1 = []
  onChangeService() {
    this.selectedService1 = this.services.value.map(ele => ele.name);

  }

  selectedEditService1 = []
  onChangeEditService() {
    this.selectedEditService1 = this.editService.value.map(ele => ele.name);

  }

  onNavigate(url: any): void {
    const menuitems = JSON.parse(localStorage.getItem("activeMenu"));
    this.currentUrl = url;
  
    const findMenuItem = (menuItems, url) => {
      for (const menu of menuItems) {
        if (menu.route_path === url) {
          return menu; 
        }
  
        if (menu.children && menu.children.length > 0) {
          const matchedChild = findMenuItem(menu.children, url);
          if (matchedChild) {
            return matchedChild;
          }
        }
      }
      return null; 
    };
  
    const matchedMenu = findMenuItem(menuitems, this.currentUrl);
  
    if (matchedMenu) {
      this.router.navigate([url]).then(() => {
        this.service.setActiveMenu(matchedMenu.name);
      });
    } else {
      console.error("No matching menu found for URL:", this.currentUrl);
    }
  }

}
