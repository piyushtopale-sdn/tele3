import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from 'src/app/not-found/not-found.component';
import { AuthGuard } from 'src/app/shared/auth-guard';
import { SuperAdminCommunicationComponent } from './super-admin-communication/super-admin-communication.component';
import { SuperAdminContentmanagementComponent } from './super-admin-contentmanagement/super-admin-contentmanagement.component';
import { SuperAdminDashboardComponent } from './super-admin-dashboard/super-admin-dashboard.component';
import { SuperAdminEntercodeComponent } from './super-admin-entercode/super-admin-entercode.component';
import { SuperAdminFeedbackmanagementComponent } from './super-admin-feedbackmanagement/super-admin-feedbackmanagement.component';
import { SuperAdminForgotpassComponent } from './super-admin-forgotpass/super-admin-forgotpass.component';
import { SuperAdminHeaderComponent } from './super-admin-header/super-admin-header.component';
import { DoctorlistComponent } from './super-admin-individualdoctor/doctorlist/doctorlist.component';
import { SuperAdminIndividualdoctorComponent } from './super-admin-individualdoctor/super-admin-individualdoctor.component';
import { PendingpharmacydetailsComponent } from './super-admin-individualpharmacy/pendingpharmacydetails/pendingpharmacydetails.component';
import { PharmacylistComponent } from './super-admin-individualpharmacy/pharmacylist/pharmacylist.component';
import { PharmacypermissionComponent } from './super-admin-individualpharmacy/pharmacypermission/pharmacypermission.component';
import { SuperAdminIndividualpharmacyComponent } from './super-admin-individualpharmacy/super-admin-individualpharmacy.component';

import { SuperAdminLoginComponent } from './super-admin-login/super-admin-login.component';
import { SuperAdminLogsComponent } from './super-admin-logs/super-admin-logs.component';
import { SuperAdminMainComponent } from './super-admin-main/super-admin-main.component';
import { SuperAdminMasterComponent } from './super-admin-master/super-admin-master.component';
import { SuperAdminNewpasswordComponent } from './super-admin-newpassword/super-admin-newpassword.component';
import { SuperAdminPatientmanagementComponent } from './super-admin-patientmanagement/super-admin-patientmanagement.component';
import { ViewpatientComponent } from './super-admin-patientmanagement/viewpatient/viewpatient.component';
import { SuperAdminPaymenthistoryComponent } from './super-admin-paymenthistory/super-admin-paymenthistory.component';
import { ChangepasswordComponent } from './super-admin-profilemanagement/changepassword/changepassword.component';
import { ProfileviewComponent } from './super-admin-profilemanagement/profileview/profileview.component';
import { SuperAdminProfilemanagementComponent } from './super-admin-profilemanagement/super-admin-profilemanagement.component';
import { SuperAdminRevenuemanagementComponent } from './super-admin-revenuemanagement/super-admin-revenuemanagement.component';
import { SelectroleComponent } from './super-admin-rolepermission/selectrole/selectrole.component';
import { SuperAdminRolepermissionComponent } from './super-admin-rolepermission/super-admin-rolepermission.component';
import { ViewroleComponent } from './super-admin-rolepermission/viewrole/viewrole.component';
import { SuperAdminSignupComponent } from './super-admin-signup/super-admin-signup.component';
import { AddstaffComponent } from './super-admin-staffmanagement/addstaff/addstaff.component';
import { SuperAdminStaffmanagementComponent } from './super-admin-staffmanagement/super-admin-staffmanagement.component';
import { ViewstaffComponent } from './super-admin-staffmanagement/viewstaff/viewstaff.component';
import { SuperSubscriptionplanComponent } from './super-subscriptionplan/super-subscriptionplan.component';
import { SuperAdminIndividuallaboratoryComponent } from './super-admin-individuallaboratory/super-admin-individuallaboratory.component';
import { LaboratorylistComponent } from './super-admin-individuallaboratory/laboratorylist/laboratorylist.component';
import { LaboratorypermissionComponent } from './super-admin-individuallaboratory/laboratorypermission/laboratorypermission.component';
import { PendinglabbasicinfoComponent } from './super-admin-individuallaboratory/pendinglabbasicinfo/pendinglabbasicinfo.component';
import { CheckGuard } from 'src/app/shared/check.guard';
import { PendingbasicinfoComponent } from './super-admin-individualdoctor/pendingbasicinfo/pendingbasicinfo.component';
import { AddDoctorComponent } from './super-admin-individualdoctor/add-doctor/add-doctor.component';
import { SuperDiscountplanComponent } from './super-discountplan/super-discountplan.component';
import { AddPharmacyComponent } from './super-admin-individualpharmacy/add-pharmacy/add-pharmacy.component';
import { AddLabComponent } from './super-admin-individuallaboratory/add-lab/add-lab.component';
import { SuperAdminImagingmanagementComponent } from './super-admin-radio-management/super-admin-imagingmanagement.component';
import { ImaginglistComponent } from './super-admin-radio-management/imaginglist/imaginglist.component';
import { ImagingpermissionComponent } from './super-admin-radio-management/imagingpermission/imagingpermission.component';
import { AddRadioComponent } from './super-admin-radio-management/add-radio/add-radio.component';
import { PendingimagingbasicinfoComponent } from './super-admin-radio-management/pendingimagingbasicinfo/pendingimagingbasicinfo.component';
import { SuperAdminQuestionaireManagementComponent } from './super-admin-questionaire-management/super-admin-questionaire-management.component';
import { AddQuestionsComponent } from './super-admin-questionaire-management/add-questions/add-questions.component';
import { EditQuestionsComponent } from './super-admin-questionaire-management/edit-questions/edit-questions.component';
import { SuperAdminNotificationManageComponent } from './super-admin-notification-manage/super-admin-notification-manage.component';
import { AddNotiComponent } from './super-admin-notification-manage/add-noti/add-noti.component';
import { SuperAdminNotificationmanagementComponent } from './super-admin-notification-manage/super-admin-notificationmanagement/super-admin-notificationmanagement.component';
import { RadioTestComponent } from './super-admin-radio-management/radio-test/radio-test.component';
import { LabTestComponent } from './super-admin-individuallaboratory/lab-test/lab-test.component';
import { SuperAdminLabtestConfigureComponent } from './super-admin-labtest-configure/super-admin-labtest-configure.component';
import { LabConfigListComponent } from './super-admin-labtest-configure/lab-config-list/lab-config-list.component';
import { AddTestConfigComponent } from './super-admin-labtest-configure/add-test-config/add-test-config.component';
import { SuperAdminTestDashboardComponent } from './super-admin-lab-dashboard/super-admin-test-dashboard.component';
import { SuperAdminRadioDashboardComponent } from './super-admin-radio-dashboard/super-admin-radio-dashboard.component';
import { SuperAdminSubscriptionReportComponent } from './super-admin-subscription-report/super-admin-subscription-report.component';
import { AddEditPatientComponent } from './super-admin-patientmanagement/add-edit-patient/add-edit-patient.component';
import { DetailsComponent } from './super-admin-patientmanagement/details/details.component';
import { MoyasarPaymentComponent } from './super-admin-patientmanagement/moyasar-payment/moyasar-payment.component';
import { PaymentSucessComponent } from './super-admin-patientmanagement/payment-sucess/payment-sucess.component';
import {SuperAdminSubscriberReportComponent} from './super-admin-subscriber-report/super-admin-subscriber-report.component';
import { SuperadminTestsBillingReportComponent } from './superadmin-tests-billing-report/superadmin-tests-billing-report.component';
import { SuperAdminContentManageComponent } from './super-admin-contentmanagement/super-admin-content-manage/super-admin-content-manage/super-admin-content-manage.component';
import { AddContentComponent } from './super-admin-contentmanagement/add-content/add-content/add-content.component';
import { AdminMenusPermissionComponent } from './super-admin-profilemanagement/admin-menus-permission/admin-menus-permission.component';
import { ApplePayComponent } from './apple-pay/apple-pay.component';
import { ManageLabCouponComponent } from './manage-lab-coupon/manage-lab-coupon.component';

const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    {
        path: 'login',
        component: SuperAdminLoginComponent
    },
    {
        path: 'entercode',
        component: SuperAdminEntercodeComponent
    },
    {
        path: 'signup',
        component: SuperAdminSignupComponent
    },
    {
        path: 'reset',
        component: SuperAdminForgotpassComponent
    },
    {
        path: 'newpassword',
        component: SuperAdminNewpasswordComponent
    },
    {
        path: 'header',
        component: SuperAdminHeaderComponent
    },
    { path: 'apple-pay', 
        component: ApplePayComponent
    }, 


    {
        path: '', canActivate: [AuthGuard], component: SuperAdminMainComponent,
        data: { routing: ["/super-admin/dashboard"] },
        children: [
            //path: '',component: SuperAdminMainComponent, children: [
            {
                path: '', redirectTo: 'dashboard', pathMatch: 'full'
            },
            {
                path: 'dashboard', component: SuperAdminDashboardComponent
            },
            {
                path: 'rolepermission', component: SuperAdminRolepermissionComponent, children: [
                    {
                        path: '', component: SelectroleComponent
                    },
                    {
                        path: 'view', component: ViewroleComponent
                    },
                ]
            },
            {
                path: 'patient', canActivate: [CheckGuard], component: SuperAdminPatientmanagementComponent,
                data: { routing: ["/super-admin/patient"] },
                children: [

                    {
                        path: '', canActivate: [CheckGuard], component: ViewpatientComponent
                    },
                    {
                        path: 'details/:id', component: DetailsComponent
                    },
                    {
                        path: 'create-patient', component: AddEditPatientComponent
                    },
                    {
                        path: 'edit/:id', component: AddEditPatientComponent
                    },
                    {
                        path: 'moyasar-payment/:id', component: MoyasarPaymentComponent
                    },
                    {
                        path: 'payment-success/:id', component: PaymentSucessComponent,
                    },
                ]
            },
            {
                path: 'doctor', canActivate: [CheckGuard], component: SuperAdminIndividualdoctorComponent,
                data: { routing: ["/super-admin/doctor"] },
                children: [
                    {
                        path: '', canActivate: [CheckGuard], component: DoctorlistComponent
                    },
                    {
                        path: 'basicinfo/:id', component: PendingbasicinfoComponent
                    },
                    {
                        path: "add-doctor",
                        component: AddDoctorComponent,
                    },
                    {
                        path: "edit-doctor/:id",
                        component: AddDoctorComponent,
                      },
                ]
            },
            {
                path: 'pharmacy', canActivate: [CheckGuard], component: SuperAdminIndividualpharmacyComponent,
                data: { routing: ["/super-admin/pharmacy"] },
                children: [
                    {
                        path: '', canActivate: [CheckGuard], component: PharmacylistComponent
                    },
                    {
                        path: 'details/:id/:tabId', component: PendingpharmacydetailsComponent
                    },
                    {
                        path: 'add-pharmacy', component: AddPharmacyComponent
                    },
                    {
                        path: 'edit/:id', component: AddPharmacyComponent
                    },
                    {
                        path: 'permission/:id', component: PharmacypermissionComponent
                    },
                ]
            },
            {
                path: 'subscriptionplan',
                canActivate: [CheckGuard],
                component: SuperSubscriptionplanComponent,
                data: { routing: ["/super-admin/subscriptionplan"] }
            },
            {
                path: 'feedback',
                canActivate: [CheckGuard],
                component: SuperAdminFeedbackmanagementComponent,
                data: { routing: ["/super-admin/feedback"] },
            },
            {
                path: 'profile', component: SuperAdminProfilemanagementComponent, children: [
                    {
                        path: '', component: ProfileviewComponent
                    },
                    {
                        path: 'changepassword', component: ChangepasswordComponent
                    },
                    {
                        path: 'assign-menus-permissions/:id', component: AdminMenusPermissionComponent
                    },
                ]
            },
            {
                path: 'master',
                canActivate: [CheckGuard],
                component: SuperAdminMasterComponent,
                data: { routing: ["/super-admin/master"] },
            },
            {
                path: 'notification',
                canActivate: [CheckGuard],
                component: SuperAdminNotificationManageComponent ,
                data: { routing: ["/super-admin/notification"] },
                children: [
                    {
                        path: '', component: SuperAdminNotificationmanagementComponent
                    },
                    {
                        path: 'add', component:AddNotiComponent
                    },
                    {
                        path: 'edit/:id', component:AddNotiComponent
                    },
                ]
            },
            {

                path: 'staffmanagement',
                canActivate: [CheckGuard],
                component: SuperAdminStaffmanagementComponent,
                data: { routing: ["/super-admin/staffmanagement"] },
                children: [
                    {
                        path: '', component: ViewstaffComponent
                    },
                    {
                        path: 'add', component: AddstaffComponent
                    },
                    {
                        // path: 'edit/:id', component: EditstaffComponent
                    },
                ]
            },
            {
                path: 'paymenthistory',
                component: SuperAdminPaymenthistoryComponent
            },
            {
                path: 'logs',
                component: SuperAdminLogsComponent
            },
            {
                path: 'revenuemanagement',
                canActivate: [CheckGuard],
                component: SuperAdminRevenuemanagementComponent,
                data: { routing: ["/super-admin/revenuemanagement"] }
            },
            {
                path: 'content-management',
                canActivate: [CheckGuard],
                component: SuperAdminContentmanagementComponent,
                data: { routing: ["/super-admin/content-management"] },
                children: [
                    {
                        path: '', component: SuperAdminContentManageComponent
                    },
                    {
                        path: 'add', component:AddContentComponent
                    },
                    {
                        path: 'edit/:id', component:AddContentComponent
                    }
                ]
            },
            {
                path: 'communication',
                // canActivate: [CheckGuard],
                component: SuperAdminCommunicationComponent
            },
            {
                path: 'laboratory', canActivate: [CheckGuard], component: SuperAdminIndividuallaboratoryComponent,
                data: { routing: ["/super-admin/laboratory"] },
                children: [
                    {
                        path: '', canActivate: [CheckGuard], component: LaboratorylistComponent
                    },
                    {
                        path: 'add-laboratory', component: AddLabComponent
                    },
                    {
                        path: 'edit-lab/:id', component: AddLabComponent
                    },
                    {
                        path: 'profile-details/:id', component: PendinglabbasicinfoComponent
                    },
                    {
                        path: 'permission/:id', component: LaboratorypermissionComponent
                    },
                ]
            },           
            {
                path: 'radiology', canActivate: [CheckGuard], component: SuperAdminImagingmanagementComponent,
                data: { routing: ["/super-admin/radiology"] },
                children: [
                    {
                        path: '', canActivate: [CheckGuard], component: ImaginglistComponent
                    },
                    {
                        path: 'add-radiology', component: AddRadioComponent
                    },
                    {
                        path: 'edit-radio/:id', component: AddRadioComponent
                    },
                    {
                        path: 'permission/:id', component: ImagingpermissionComponent
                    },
                    {
                        path: 'profile-details/:id', component: PendingimagingbasicinfoComponent
                    },
                ]
            },
            {
                path: 'discountplan',
                canActivate: [CheckGuard],
                component: SuperDiscountplanComponent,
                data: { routing: ["/super-admin/discountplan"] }
            },
            {
                path: 'manage-lab-coupon',
                canActivate: [CheckGuard],
                component: ManageLabCouponComponent,
                data: { routing: ["/super-admin/manage-lab-coupon"] }
            },
            {
                path: 'manage-radio-tests',
                canActivate: [CheckGuard],
                component: RadioTestComponent,
                data: { routing: ["/super-admin/manage-radio-tests"] }
            },
            {
                path: 'manage-tests',
                canActivate: [CheckGuard],
                component: LabTestComponent,
                data: { routing: ["/super-admin/manage-tests"] }
            },
            {
                path: 'test-configuration', canActivate: [CheckGuard], component: SuperAdminLabtestConfigureComponent,
                data: { routing: ["/super-admin/test-configuration"] },
                children: [
                    {
                        path: '', canActivate: [CheckGuard], component: LabConfigListComponent
                    },
                    {
                        path: 'add-test', component: AddTestConfigComponent
                    },
                    {
                        path: 'edit-test/:id', component: AddTestConfigComponent
                    },
                   
                ]
            },
            {
                path: 'questionnaire-management', canActivate: [CheckGuard], component: SuperAdminImagingmanagementComponent,
                data: { routing: ["/super-admin/questionnaire-management"] },
                children: [
                    {
                        path: '', canActivate: [CheckGuard], component: SuperAdminQuestionaireManagementComponent
                    },
                    {
                        path: 'add-questions', component: AddQuestionsComponent
                    },
                    {
                        path: 'edit-questions/:id', component: EditQuestionsComponent
                    },
                ]
            },
            {
                path: 'lab-report',
                canActivate: [CheckGuard],
                component: SuperAdminTestDashboardComponent,
                data: { routing: ["/super-admin/lab-report"] }
            },
            {
                path: 'radio-report',
                canActivate: [CheckGuard],
                component: SuperAdminRadioDashboardComponent,
                data: { routing: ["/super-admin/radio-report"] }
            },
            {
                path: 'subscription-report',
                canActivate: [CheckGuard],
                component: SuperAdminSubscriptionReportComponent,
                data: { routing: ["/super-admin/subscription-report"] }
            },
            {
                path: 'subscriber-report',
                canActivate: [CheckGuard],
                component: SuperAdminSubscriberReportComponent,
                data: { routing: ["/super-admin/subscriber-report"] }
            },
            {
                path: 'tests-billing-report',
                canActivate: [CheckGuard],
                component: SuperadminTestsBillingReportComponent,
                data: { routing: ["/super-admin/tests-billing-report"] }
            },
        ]
    },
    {
        path: '**',
        component: NotFoundComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SuperAdminRoutingModule { }




