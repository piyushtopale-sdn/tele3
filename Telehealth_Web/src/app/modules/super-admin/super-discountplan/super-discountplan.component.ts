import { CoreService } from "../../../shared/core.service";
import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  HostListener,
} from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {
  FormGroup,
  FormBuilder,
  FormArray,
  Validators,
  AbstractControl,
} from "@angular/forms";
import { SuperAdminService } from "../super-admin.service";
import { ToastrService } from "ngx-toastr";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { Router } from "@angular/router";

export interface PeriodicElement {
  _id: string;
  couponCode: string;
  description: string;
  type: string;
  duration: string;
  subscriptionPlanId: string;
  status: string;
  redeemBefore: string;
  action: string;
  createdAt: string;
}

const ELEMENT_DATA: PeriodicElement[] = [];
@Component({
  selector: "app-super-discountplan",
  templateUrl: "./super-discountplan.component.html",
  styleUrls: ["./super-discountplan.component.scss"],
})
export class SuperDiscountplanComponent implements OnInit {
  form: FormGroup;
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
    "couponCode",
    // "planname",
    "type",
    "amountOff",
    "percentOff",
    "duration",
    "numberOfMonths",
    "redeemBefore",
    "action",
  ];
  dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  overlay: false;
  isSubmitted: any = false;
  editPlan!: FormGroup;
  addPlan!: FormGroup;
  service_name_array: any;
  pageSize: number = 5;
  totalLength: number = 0;
  page: any = 1;
  periodicList: any = ['monthly'];
  sortColumn: string = 'plan_name';
  sortOrder: 'asc' | 'desc' = 'asc';
  sortIconClass: string = 'arrow_upward';
  portalName: any;
  selectedType: string = '';
  selectedDuration: string = '';
  planListing: any[] = [];
  couponCode: string;
  description: string;
  type: any;
  percentOff: number = 0;
  amountOff: number = 0;
  duration: any;
  numberOfMonths: number = 0;
  redeemBefore: any;
  status: any = "";
  subscriptionPlanId: any = "";
  search_with_coupon: any = "";
  discountPlanId: any = "";
  currentUrl:any=[]

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

    this.addPlan = this.fb.group({
      couponCode: ['',[Validators.required,Validators.pattern('^[a-zA-Z0-9]*$')]],
      description: [''],
      // subscriptionPlanId: ['', Validators.required],
      type: ['', Validators.required],
      amountOff: [''],
      percentOff: ['', [Validators.min(0), Validators.max(100)]],
      duration: ['', Validators.required],
      numberOfMonths: [0],
      redeemBefore: ['', Validators.required]
    });
  }

  onSortData(column: any) {
    this.sortColumn = column;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortIconClass = this.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
    this.getDiscount();
  }

  ngOnInit(): void {
    this.getAllSubscriptionPan();
    this.getDiscount();
    // setTimeout(() => {
    //   this.checkInnerPermission();
    // }, 2000);
    this.currentUrl = this.router.url;
    this.onNavigate(this.currentUrl);
  }

  onTypeChange(type: string) {
    this.selectedType = type;
  }

  onDurationChange(duration: string) {
    this.selectedDuration = duration;
  }

  getDiscount() {
    this.service.getDiscount(
      this.page,
      this.pageSize,
      this.search_with_coupon,
      this.status,
    )
      .subscribe((res) => {
        let response = this._coreService.decryptObjectData({ data: res });
        let allDisscountPlans = response.body?.result;
        this.dataSource = allDisscountPlans;
        this.totalLength = response.body?.totalRecords || 0;
      });
  }

  getAllSubscriptionPan() {
    this.service.getAllSubscriptionPan().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      let allplans = response.body;
      allplans.map((plans) => {
        this.planListing.push(
          {
            label: plans.plan_name,
            value: plans._id
          }
        )
      })
    });
  }

  getCouponCode() {
    this.service.getCoupon().subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      this.couponCode = response.body.coupon;

      this.addPlan.patchValue({
        couponCode:  this.couponCode
      });
    });
  }

  addDiscountPlan() {
    this.isSubmitted = true;
    if (this.addPlan.invalid) {
      return;
    }
    this.loader.start();
    const additionalKey = 'createdBy';
    const additionalValue = this.loginID;
    const modifiedData = { ...this.addPlan.value };
    modifiedData[additionalKey] = additionalValue;
    this.isSubmitted = false;
    this.service.addDiscountPlan(modifiedData).subscribe((res: any) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.getDiscount();
        this.closePopup();
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  handleDeletePlan() {
    this.loader.start();
    this.service.deleteDiscountPlan(this.discountPlanId).subscribe((res: any) => {
      let response = this._coreService.decryptObjectData({ data: res });
      if (response.status) {
        this.loader.stop();
        this.toastr.success(response.message);
        this.getDiscount();
        this.closePopup();
      } else {
        this.loader.stop();
        this.toastr.error(response.message);
      }
    });
  }

  closePopup() {
    this.addPlan.reset();
    this.modalService.dismissAll("close");
    this.couponCode = '';
    this.isSubmitted = false;
  }

  findObjectByKey(array, key, value) {
    return array.find(obj => obj[key] === value);
  }

  checkInnerPermission() {
    let userPermission = this._coreService.getLocalStorage("adminData").permissions;
    if(userPermission){
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

  handleStatusFilter(event: any) {
    this.getDiscount();
  }

  handlePlanForFilter(event: any) {
    this.getDiscount();
  }

  handleSearchFilter(event: any) {
    this.search_with_coupon = event.target.value;
    this.getDiscount();
  }

  clearFilter() {
    this.search_with_coupon = "";
    this.getDiscount();
  }


  //---------------------FromArray handling------------------------
  get services() {
    return this.addPlan.controls["services"] as FormArray;
  }

  // Add a getter method for convenience
  get serviceControls() {
    return this.services.controls;
  }

  openVerticallyCenteredsecond(deleteModal: any, _id: any) {
    this.discountPlanId = _id;
    this.modalService.open(deleteModal, { centered: true, size: "sm" });
  }

  openVerticallyCenteredadd(addmodal: any) {
    this.modalService.open(addmodal, { centered: true, size: "md" });
    // this.onChangeService();
  }

  handlePageEvent(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.page = event.pageIndex + 1;
    this.getDiscount();
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

  convertToUppercase(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.addPlan.controls['couponCode'].setValue(input.value);
  }
  
  getFormattedType(type: string): string {
    return type.replace(/_/g, ' ');
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
