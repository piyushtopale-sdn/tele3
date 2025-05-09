import { SuperAdminHospitalService } from './super-admin-hospital.service';
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClientModule, HttpClient } from "@angular/common/http";
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { SharedModule } from "../shared.module";
import { SuperAdminRoutingModule } from "./super-admin-routing.module";
import { SuperAdminLoginComponent } from "./super-admin-login/super-admin-login.component";
import { SuperAdminSignupComponent } from "./super-admin-signup/super-admin-signup.component";
import { SuperAdminSidebarComponent } from "./super-admin-sidebar/super-admin-sidebar.component";
import { SuperAdminHeaderComponent } from "./super-admin-header/super-admin-header.component";
import { SuperAdminMainComponent } from "./super-admin-main/super-admin-main.component";
import { SuperAdminForgotpassComponent } from "./super-admin-forgotpass/super-admin-forgotpass.component";
import { SuperAdminNewpasswordComponent } from "./super-admin-newpassword/super-admin-newpassword.component";
import { SuperAdminRolepermissionComponent } from "./super-admin-rolepermission/super-admin-rolepermission.component";
import { SuperAdminPatientmanagementComponent } from "./super-admin-patientmanagement/super-admin-patientmanagement.component";
import { ViewpatientComponent } from "./super-admin-patientmanagement/viewpatient/viewpatient.component";
import { SuperAdminIndividualdoctorComponent } from "./super-admin-individualdoctor/super-admin-individualdoctor.component";
import { PendingbasicinfoComponent } from "./super-admin-individualdoctor/pendingbasicinfo/pendingbasicinfo.component";
import { DoctorlistComponent } from "./super-admin-individualdoctor/doctorlist/doctorlist.component";
import { SuperAdminIndividualpharmacyComponent } from "./super-admin-individualpharmacy/super-admin-individualpharmacy.component";
import { PharmacylistComponent } from "./super-admin-individualpharmacy/pharmacylist/pharmacylist.component";
import { PendingpharmacydetailsComponent } from "./super-admin-individualpharmacy/pendingpharmacydetails/pendingpharmacydetails.component";
import { PharmacypermissionComponent } from "./super-admin-individualpharmacy/pharmacypermission/pharmacypermission.component";
import { SuperAdminFeedbackmanagementComponent } from "./super-admin-feedbackmanagement/super-admin-feedbackmanagement.component";
import { SuperAdminMasterComponent } from "./super-admin-master/super-admin-master.component";
import { SuperSubscriptionplanComponent } from "./super-subscriptionplan/super-subscriptionplan.component";
import { SuperAdminProfilemanagementComponent } from "./super-admin-profilemanagement/super-admin-profilemanagement.component";
import { ProfileviewComponent } from "./super-admin-profilemanagement/profileview/profileview.component";
import { ChangepasswordComponent } from "./super-admin-profilemanagement/changepassword/changepassword.component";
import { SuperAdminEntercodeComponent } from "./super-admin-entercode/super-admin-entercode.component";
import { SuperAdminPharmacyService } from "./super-admin-pharmacy.service";
import { PharmacyPlanService } from "./../pharmacy/pharmacy-plan.service"
import { SuperAdminService } from "./super-admin.service";
import { SpecialityComponent } from "./super-admin-master/master-component/speciality/speciality.component";
import { MatStepperModule } from '@angular/material/stepper';
import { SuperAdminStaffmanagementComponent } from "./super-admin-staffmanagement/super-admin-staffmanagement.component";
import { AddstaffComponent } from "./super-admin-staffmanagement/addstaff/addstaff.component";
import { ViewstaffComponent } from "./super-admin-staffmanagement/viewstaff/viewstaff.component";
import { SuperAdminDashboardComponent } from "./super-admin-dashboard/super-admin-dashboard.component";
import { SuperAdminLogsComponent } from "./super-admin-logs/super-admin-logs.component";
import { SuperAdminPaymenthistoryComponent } from "./super-admin-paymenthistory/super-admin-paymenthistory.component";
import { SuperAdminRevenuemanagementComponent } from "./super-admin-revenuemanagement/super-admin-revenuemanagement.component";
import { SuperAdminContentmanagementComponent } from "./super-admin-contentmanagement/super-admin-contentmanagement.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgxEditorModule } from "ngx-editor";
import { EditstaffComponent } from "./super-admin-staffmanagement/editstaff/editstaff.component";
import { MatTimepickerModule } from "mat-timepicker";
import { DatePipe } from "@angular/common";
import { SelectroleComponent } from "./super-admin-rolepermission/selectrole/selectrole.component";
import { ViewroleComponent } from "./super-admin-rolepermission/viewrole/viewrole.component";
import { SuperAdminCommunicationComponent } from "./super-admin-communication/super-admin-communication.component";
import { AuthGuard } from "src/app/shared/auth-guard";
import { SlicePipe } from '@angular/common';
import { NgImageFullscreenViewModule } from 'ng-image-fullscreen-view';
import { DesignationComponent } from './super-admin-master/master-component/designation/designation.component';
import { LanguageMasterComponent } from './super-admin-master/master-component/language-master/language-master.component';
import { SuperAdminIndividuallaboratoryComponent } from './super-admin-individuallaboratory/super-admin-individuallaboratory.component';
import { LaboratorylistComponent } from './super-admin-individuallaboratory/laboratorylist/laboratorylist.component';
import { LaboratorypermissionComponent } from './super-admin-individuallaboratory/laboratorypermission/laboratorypermission.component';
import { PendinglabbasicinfoComponent } from './super-admin-individuallaboratory/pendinglabbasicinfo/pendinglabbasicinfo.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { BrowserModule } from '@angular/platform-browser';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { AddDoctorComponent } from './super-admin-individualdoctor/add-doctor/add-doctor.component';
import { BasicinfoComponent } from './super-admin-individualdoctor/add-doctor/basicinfo/basicinfo.component';
import { AvailabilityComponent } from './super-admin-individualdoctor/add-doctor/availability/availability.component';
import { ManagepermissionComponent } from './super-admin-individualdoctor/add-doctor/managepermission/managepermission.component';
import { SuperDiscountplanComponent } from './super-discountplan/super-discountplan.component';
import { LeavetypesComponent } from './super-admin-master/master-component/leavetypes/leavetypes.component';
import { Icd10Component } from './super-admin-master/master-component/icd-10/icd-10.component';
import { AddPharmacyComponent } from './super-admin-individualpharmacy/add-pharmacy/add-pharmacy.component';
import { AddLabComponent } from './super-admin-individuallaboratory/add-lab/add-lab.component';
import { SuperAdminImagingmanagementComponent } from './super-admin-radio-management/super-admin-imagingmanagement.component';
import { ImaginglistComponent } from './super-admin-radio-management/imaginglist/imaginglist.component';
import { ImagingpermissionComponent } from './super-admin-radio-management/imagingpermission/imagingpermission.component';
import { PendingimagingbasicinfoComponent } from './super-admin-radio-management/pendingimagingbasicinfo/pendingimagingbasicinfo.component';
import { AddRadioComponent } from './super-admin-radio-management/add-radio/add-radio.component';
import { SuperAdminQuestionaireManagementComponent } from './super-admin-questionaire-management/super-admin-questionaire-management.component';
import { AddQuestionsComponent } from './super-admin-questionaire-management/add-questions/add-questions.component';
import { EditQuestionsComponent } from './super-admin-questionaire-management/edit-questions/edit-questions.component';
import { CategoryComponent } from './super-admin-master/master-component/category/category.component';
import { SuperAdminNotificationManageComponent } from './super-admin-notification-manage/super-admin-notification-manage.component';
import { AddNotiComponent } from './super-admin-notification-manage/add-noti/add-noti.component';
import { SuperAdminNotificationmanagementComponent } from './super-admin-notification-manage/super-admin-notificationmanagement/super-admin-notificationmanagement.component';
import { AlphaResultsComponent } from './super-admin-master/master-component/alpha-results/alpha-results.component';
import { RadioTestComponent } from './super-admin-radio-management/radio-test/radio-test.component';
import { LabTestComponent } from './super-admin-individuallaboratory/lab-test/lab-test.component';
import { SuperAdminLabtestConfigureComponent } from './super-admin-labtest-configure/super-admin-labtest-configure.component';
import { AddTestConfigComponent } from './super-admin-labtest-configure/add-test-config/add-test-config.component';
import { LabConfigListComponent } from './super-admin-labtest-configure/lab-config-list/lab-config-list.component';
import { TypeOfStudyComponent } from './super-admin-master/master-component/type-of-study/type-of-study.component';
import { SuperAdminTestDashboardComponent } from './super-admin-lab-dashboard/super-admin-test-dashboard.component';
import { SuperAdminRadioDashboardComponent } from './super-admin-radio-dashboard/super-admin-radio-dashboard.component';
import { VitalThresholdComponent } from './super-admin-master/master-component/vital-threshold/vital-threshold.component';
import { SuperAdminSubscriptionReportComponent } from './super-admin-subscription-report/super-admin-subscription-report.component';
import { AddEditPatientComponent } from './super-admin-patientmanagement/add-edit-patient/add-edit-patient.component';
import { DetailsComponent } from './super-admin-patientmanagement/details/details.component';
import { MoyasarPaymentComponent } from './super-admin-patientmanagement/moyasar-payment/moyasar-payment.component';
import { PaymentSucessComponent } from './super-admin-patientmanagement/payment-sucess/payment-sucess.component';
import { SuperAdminSubscriberReportComponent } from './super-admin-subscriber-report/super-admin-subscriber-report.component';
import { LoincCodesComponent } from './super-admin-master/master-component/loinc-codes/loinc-codes.component';
import { SuperadminTestsBillingReportComponent } from './superadmin-tests-billing-report/superadmin-tests-billing-report.component';
import { SuperAdminContentManageComponent } from './super-admin-contentmanagement/super-admin-content-manage/super-admin-content-manage/super-admin-content-manage.component';
import { AddContentComponent } from './super-admin-contentmanagement/add-content/add-content/add-content.component';
import { AdminMenusPermissionComponent } from './super-admin-profilemanagement/admin-menus-permission/admin-menus-permission.component';
import { ApplePayComponent } from './apple-pay/apple-pay.component';
import { ManageLabCouponComponent } from './manage-lab-coupon/manage-lab-coupon.component';
import { EducationSuperAdminComponent } from './super-admin-individualdoctor/add-doctor/education-super-admin/education-super-admin.component';
@NgModule({
  declarations: [
    SuperAdminDashboardComponent,
    SuperAdminLoginComponent,
    SuperAdminSignupComponent,
    SuperAdminSidebarComponent,
    SuperAdminHeaderComponent,
    SuperAdminMainComponent,
    SuperAdminForgotpassComponent,
    SuperAdminNewpasswordComponent,
    SuperAdminRolepermissionComponent,
    SuperAdminPatientmanagementComponent,
    ViewpatientComponent,
    SuperAdminIndividualdoctorComponent,
    PendingbasicinfoComponent,
    DoctorlistComponent,
    SuperAdminIndividualpharmacyComponent,
    PharmacylistComponent,
    PendingpharmacydetailsComponent,
    PharmacypermissionComponent,
    SuperAdminFeedbackmanagementComponent,
    SuperAdminMasterComponent,
    SuperAdminNotificationmanagementComponent,
    SuperSubscriptionplanComponent,
    SuperAdminProfilemanagementComponent,
    ProfileviewComponent,
    ChangepasswordComponent,
    SuperAdminEntercodeComponent,
    SpecialityComponent,
    SuperAdminStaffmanagementComponent,
    AddstaffComponent,
    ViewstaffComponent,
    SuperAdminLogsComponent,
    SuperAdminPaymenthistoryComponent,
    SuperAdminRevenuemanagementComponent,
    SuperAdminContentmanagementComponent,
    EditstaffComponent,
    SelectroleComponent,
    ViewroleComponent,
    SuperAdminCommunicationComponent,
    DesignationComponent,
    LeavetypesComponent,
    LanguageMasterComponent,
    SuperAdminIndividuallaboratoryComponent,
    SuperAdminImagingmanagementComponent,
    LaboratorylistComponent,
    ImaginglistComponent,
    ImagingpermissionComponent,
    LaboratorypermissionComponent,
    PendinglabbasicinfoComponent,
    PendingimagingbasicinfoComponent,
    AddDoctorComponent,
    BasicinfoComponent,
    AvailabilityComponent,
    ManagepermissionComponent,
    SuperDiscountplanComponent,
    Icd10Component,
    AddPharmacyComponent,
    AddLabComponent,
    AddRadioComponent,
    SuperAdminQuestionaireManagementComponent,
    AddQuestionsComponent,
    EditQuestionsComponent,
    CategoryComponent,
    SuperAdminNotificationManageComponent,
    AddNotiComponent,
    AlphaResultsComponent,
    RadioTestComponent,
    LabTestComponent,
    SuperAdminLabtestConfigureComponent,
    AddTestConfigComponent,
    LabConfigListComponent,
    TypeOfStudyComponent,
    SuperAdminTestDashboardComponent,
    SuperAdminRadioDashboardComponent,
    VitalThresholdComponent,
    SuperAdminSubscriptionReportComponent,
    AddEditPatientComponent ,
    DetailsComponent,
    MoyasarPaymentComponent,
    PaymentSucessComponent,
    SuperAdminSubscriberReportComponent,
    LoincCodesComponent,
    SuperadminTestsBillingReportComponent,
    SuperAdminContentManageComponent,
    AddContentComponent,
    AdminMenusPermissionComponent,
    ApplePayComponent,
    ManageLabCouponComponent,
    EducationSuperAdminComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    NgxEditorModule,
    MatTimepickerModule,
    FormsModule,
    MatRadioModule,
    MatFormFieldModule,
    MatButtonToggleModule,
    MatInputModule,
    MatStepperModule,
    MatTimepickerModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    NgMultiSelectDropDownModule.forRoot(),

    SuperAdminRoutingModule,
    NgImageFullscreenViewModule,
  ],
  providers: [AuthGuard, SuperAdminHospitalService, SuperAdminPharmacyService, PharmacyPlanService, SuperAdminService, DatePipe, SlicePipe],
})
export class SuperAdminModule { }

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}
