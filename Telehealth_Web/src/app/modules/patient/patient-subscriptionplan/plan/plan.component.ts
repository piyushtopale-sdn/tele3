import { Component, OnInit, ViewEncapsulation,ViewChild} from '@angular/core';
import { Router } from '@angular/router';
import { CoreService } from 'src/app/shared/core.service';
import { PatientService } from '../../patient.service';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from "src/environments/environment";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
 
@Component({
  selector: 'app-plan',
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.scss'],
  encapsulation: ViewEncapsulation.None,
 
})
export class PlanComponent implements OnInit {
  profileData:any="";
  planMessage:string;
  planStatus:boolean=false;
  planDetails:any;
  planId: any='';
  PaymentMode: any;
  plandata: any;
  @ViewChild("mobilePaycontent", { static: false }) mobilePaycontent: any;
  loginData: any;
  patient_id: any;
  mobilePayDetails: any;
  mobilePaynumbers: any;
  mobilePayForm!: FormGroup;
  selectedProvider: any;
  selectedProviderNumber: string = '';
  countryCodes:any;
  isSubmitted: boolean = false;

  constructor(
    private modalService: NgbModal,
    private _patientService:PatientService,
    private _route:Router,
    private _coreService:CoreService,
    private fb: FormBuilder) {
      this.subsriptionPlan()
      this.profileData = this._coreService.getLocalStorage("profileData");
      this.loginData = this._coreService.getLocalStorage("loginData");
      this.patient_id = this.loginData?._id

      // Define the country codes array in your component
      this.countryCodes = ["+226(BF)","+229(BJ)", "+225(CI)", "+223(ML)", "+221(SN)", "+228(TG)"];
      this.mobilePayForm = this.fb.group({
        selectedProvider: [''], 
        mobilepaynumber: ['',[Validators.required]],
        countryCode: [this.countryCodes[0],[Validators.required]]
      });
  
      // Subscribe to changes in the selected provider dropdown
      this.mobilePayForm.get('selectedProvider').valueChanges.subscribe(selectedProviderId => {
        // Find the selected provider based on the ID
        const selectedProvider = this.mobilePayDetails.find(provider => provider._id === selectedProviderId);

        // Update the mobile pay number field with the selected provider's number
        this.mobilePayForm.get('mobilepaynumber').setValue(selectedProvider ? selectedProvider.pay_number : '');

        this.mobilePayForm.get('countryCode').setValue(selectedProvider ? selectedProvider.mobile_country_code : '');
      });
    }
 
  ngOnInit(): void {
    this.getProfileDetails();
  }
 
  numberFunc(event: any = ''): boolean {
    if (event.type === 'paste') {
      // Handle paste action
      const clipboardData = event.clipboardData || (window as any).clipboardData;
      const pastedText = clipboardData.getData('text');
      const regex = new RegExp("^[0-9]+$");
  
      if (!regex.test(pastedText)) {
        event.preventDefault();
        return false;
      }
    } else {
      // Handle key press action
      const key = event.key;
      const regex = new RegExp("^[0-9]+$");
  
      if (!regex.test(key)) {
        event.preventDefault();
        return false;
      }
    }
    return true; // Return true for allowed key press or paste
  }
  
  subsriptionPlan(){
    let paramData={
      limit:50,
      page:1,
      is_deleted:false,
      is_activated:true,
      plan_name:'',
      plan_for:'patient'
    }
    this._patientService.getPatientSubscriptionPlan(paramData).subscribe({
      next:(res)=>{
        
        let result = this._coreService.decryptContext(res);
        if(result.status){
          this.planDetails = result.body.allPlans;
        }else{
          this.planMessage = 'Subsciption Plan Not exists will create shortly';
          this.planStatus = true;
        }
        
        
      },error:(err)=>{
          console.log(err);
          
      }
    })
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
 
  closePopup() {
    let modalDespose = this.getDismissReason(1);
    this.modalService.dismissAll(modalDespose);
  }
 
  selectPaymetTypeAndMode(data: any) {
      this.PaymentMode = data.mode;
  }

  public findPlanDetails(){
    if (this.PaymentMode == 'stripe') {
      this.closePopup();
      this._route.navigate(['/patient/subscriptionplan/payment/', this.planId]);
    }
    else {
      this.closePopup();
      this.openVerticallyCenteredmobilePaydetails(this.mobilePaycontent)
      this.getProfileDetails();
    }
  }
 
  //  Payment details modal
  openVerticallyCenteredpaymentdetails(paymentdetailscontent: any,data:any){
    this.planId=data._id;
    this.plandata=data;
    this.modalService.open(paymentdetailscontent, { centered: true,size: 'md' ,windowClass : "payment_details",backdrop:'static' });
  }

  openVerticallyCenteredmobilePaydetails(mobilePaycontent: any){
    // this.planId=data._id;
    // this.plandata=data;
    this.modalService.open(mobilePaycontent, { centered: true,size: 'md' ,windowClass : "payment_details",backdrop:'static' });
  }


  getProfileDetails() {
    let params = {
      patient_id: this.patient_id,
    };
    this._patientService.profileDetails(params).subscribe((res) => {
      let response = this._coreService.decryptObjectData({ data: res });
      let profile = response.body;
      this.mobilePayDetails= response.body.mobilePayDetails.mobilePay;
      // for(let data of this.mobilePayDetails ){
      //   this.mobilePaynumbers = data;
      // }
    });
  }

  get f() {
    return this.mobilePayForm.controls;
  }


}