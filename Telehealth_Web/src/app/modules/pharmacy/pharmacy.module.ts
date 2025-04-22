import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { SharedModule } from '../shared.module';
import { PharmacyRoutingModule } from './pharmacy-routing.module';
import { PharmacyDashboardComponent } from './pharmacy-dashboard/pharmacy-dashboard.component';
import { PharmacySidebarComponent } from './pharmacy-sidebar/pharmacy-sidebar.component';
import { PharmacyHeaderComponent } from './pharmacy-header/pharmacy-header.component';
import { PharmacyMainComponent } from './pharmacy-main/pharmacy-main.component';
import { PharmacyLoginComponent } from './pharmacy-login/pharmacy-login.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { PharmacyEntercodeComponent } from './pharmacy-entercode/pharmacy-entercode.component';
import { PharmacyService } from './pharmacy.service';
import { PharmacyForgotpasswordComponent } from './pharmacy-forgotpassword/pharmacy-forgotpassword.component';
import { PharmacyNewpasswordComponent } from './pharmacy-newpassword/pharmacy-newpassword.component';
import { PharmacyPlanService } from './pharmacy-plan.service';
import { PharmacyPrescriptionorderComponent } from './pharmacy-prescriptionorder/pharmacy-prescriptionorder.component';
import { PrescriptionorderComponent } from './pharmacy-prescriptionorder/prescriptionorder/prescriptionorder.component';
import { PharmacyProfilemanagementComponent } from './pharmacy-profilemanagement/pharmacy-profilemanagement.component';
import { ProfileComponent } from './pharmacy-profilemanagement/profile/profile.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from 'mat-timepicker';
import { EditprofileComponent } from './pharmacy-profilemanagement/editprofile/editprofile.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { NeworderrequestComponent } from './pharmacy-prescriptionorder/neworderrequest/neworderrequest.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { PharmacyStaffmanagementComponent } from './pharmacy-staffmanagement/pharmacy-staffmanagement.component';
import { AddstaffComponent } from './pharmacy-staffmanagement/addstaff/addstaff.component';
import { ViewstaffComponent } from './pharmacy-staffmanagement/viewstaff/viewstaff.component';
import { PharmacyRatingandreviewComponent } from './pharmacy-ratingandreview/pharmacy-ratingandreview.component';
import { PharmacyNotificationComponent } from './pharmacy-notification/pharmacy-notification.component';
import { PharmacyRoleandpermisionComponent } from './pharmacy-roleandpermision/pharmacy-roleandpermision.component';
import { PharmacyLogsComponent } from './pharmacy-logs/pharmacy-logs.component';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { ViewroleComponent } from './pharmacy-roleandpermision/viewrole/viewrole.component';
import { SelectroleComponent } from './pharmacy-roleandpermision/selectrole/selectrole.component';
import { PharmacyCommunicationComponent } from './pharmacy-communication/pharmacy-communication.component';
import { DatePipe } from '@angular/common';
// import { AuthGuard } from './auth.guard';
import { AuthGuard } from 'src/app/shared/auth-guard';
import { SignaturePadModule } from 'angular2-signaturepad';
import { SlicePipe } from '@angular/common';
import { NgImageFullscreenViewModule } from 'ng-image-fullscreen-view';
import { PdfViewerModule } from 'ng2-pdf-viewer';
@NgModule({
  declarations: [
    PharmacyDashboardComponent,
    PharmacySidebarComponent,
    PharmacyHeaderComponent,
    PharmacyMainComponent,
    PharmacyLoginComponent,
    PharmacyEntercodeComponent,
    PharmacyForgotpasswordComponent,
    PharmacyNewpasswordComponent,
    PharmacyPrescriptionorderComponent,
    PrescriptionorderComponent,
    PharmacyProfilemanagementComponent,
    ProfileComponent,
    EditprofileComponent,
    NeworderrequestComponent,
    PharmacyStaffmanagementComponent,
    AddstaffComponent,
    ViewstaffComponent,
    PharmacyRatingandreviewComponent,
    PharmacyNotificationComponent,
    PharmacyLogsComponent,
    PharmacyRoleandpermisionComponent,
    ViewroleComponent,
    SelectroleComponent,
    PharmacyCommunicationComponent,
  ],
  imports: [
    SharedModule,
    PdfViewerModule,
    MatButtonToggleModule,
    // HttpClientModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatNativeDateModule,
    NgxMaterialTimepickerModule,
    SignaturePadModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    PharmacyRoutingModule,
    NgImageFullscreenViewModule
  ],
  providers: [
    AuthGuard,
    PharmacyService,
    PharmacyPlanService,
    DatePipe,
    SlicePipe
  ]
})
export class PharmacyModule { }

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}