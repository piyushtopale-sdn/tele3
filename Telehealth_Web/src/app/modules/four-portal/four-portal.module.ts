import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FourPortalRoutingModule } from './four-portal-routing.module';
import { FourPortalLoginComponent } from './four-portal-login/four-portal-login.component';
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FourPortalForgotpassComponent } from './four-portal-forgotpass/four-portal-forgotpass.component';
import { MatIconModule } from "@angular/material/icon";
import { FourPortalEntercodeComponent } from './four-portal-entercode/four-portal-entercode.component';
import { SharedModule } from "../shared.module";
import { FourPortalNewpasswordComponent } from './four-portal-newpassword/four-portal-newpassword.component';
import { FourPortalMainComponent } from './four-portal-main/four-portal-main.component';
import { FourPortalHeaderComponent } from './four-portal-header/four-portal-header.component';
import { FourPortalSidebarComponent } from './four-portal-sidebar/four-portal-sidebar.component';
import { FourPortalViewProfileComponent } from './four-portal-view-profile/four-portal-view-profile.component';
import { FourPortalRoleandpermissionComponent } from './four-portal-roleandpermission/four-portal-roleandpermission.component';
import { FourPortalSelectroleComponent } from './four-portal-roleandpermission/four-portal-selectrole/four-portal-selectrole.component';
import { FourPortalViewroleComponent } from './four-portal-roleandpermission/four-portal-viewrole/four-portal-viewrole.component';
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { HttpClient } from "@angular/common/http";
import { FourPortalStaffManagementComponent } from './four-portal-staff-management/four-portal-staff-management.component';
import { FourPortalAddStaffComponent } from './four-portal-staff-management/four-portal-add-staff/four-portal-add-staff.component';
import { FourPortalViewStaffComponent } from './four-portal-staff-management/four-portal-view-staff/four-portal-view-staff.component';
import { FourPortalMasterComponent } from './four-portal-master/four-portal-master.component';
import { FormioModule } from 'angular-formio';
import { SignaturePadModule } from 'angular2-signaturepad';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { FourPortalCommunicationComponent } from './four-portal-communication/four-portal-communication.component';
import { NgImageFullscreenViewModule } from 'ng-image-fullscreen-view';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FourPortalAppointmentComponent } from './four-portal-appointment/four-portal-appointment.component';
import { AppopintmentListComponent } from './four-portal-appointment/appopintment-list/appopintment-list.component';
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatStepperModule } from "@angular/material/stepper";
import { MatTimepickerModule } from "mat-timepicker";
import { NgxMaterialTimepickerModule } from "ngx-material-timepicker";
import { NgxMatDatetimePickerModule, NgxMatNativeDateModule,NgxMatTimepickerModule,} from "@angular-material-components/datetime-picker";
import { IgxCalendarModule, IgxDialogModule, IgxPrefixModule, IgxSelectModule } from 'igniteui-angular';
import { AppointmentDetailsComponent } from './four-portal-appointment/radio-appointment-details/appointment-details.component';
import { DecimalPipe,DatePipe, SlicePipe } from "@angular/common";
import { FourPortalRatingandreviewComponent } from './four-portal-ratingandreview/four-portal-ratingandreview.component';
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { ContextMenuService } from "@perfectmemory/ngx-contextmenu";
import { ContextMenuModule } from '@perfectmemory/ngx-contextmenu';
import { TooltipModule } from 'ng2-tooltip-directive';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { FourPortalNotificationComponent } from './four-portal-notification/four-portal-notification.component';
import { LogsComponent } from './four-portal-master/logs/logs.component';
import { EditProfileComponent } from './four-portal-view-profile/edit-profile/edit-profile.component';
import { TestManagementComponent } from './test-management/test-management.component';
import { LabTestViewComponent } from './test-management/lab-test-view/lab-test-view.component';
import { LabAppointmentDetailsComponent } from './four-portal-appointment/lab-appointment-details/lab-appointment-details.component';
import { LabAddManualResultComponent } from './four-portal-appointment/lab-add-manual-result/lab-add-manual-result.component';
import { RadioDashboardComponent } from './radio-dashboard/radio-dashboard.component';
import { LabDashboardComponent } from './lab-dashboard/lab-dashboard.component';
import { MatSelectModule } from '@angular/material/select';
import { LabMainTestListComponent } from './profile-manage-test/lab-main-test-list.component';
import { LabOrderDashboardComponent } from './delay-dashboard/lab-order-dashboard.component';
import { AdminLabDashboardComponent } from './admin-lab-dashboard/admin-lab-dashboard.component';
import { AdminAllLabRadioComponent } from './admin-all-lab-radio/admin-all-lab-radio.component';
import { UserProfileDetailsComponent } from './admin-all-lab-radio/user-profile-details/user-profile-details.component';
import { AdminLabTestConfigComponent } from './admin-lab-test-config/admin-lab-test-config.component';
import { AdminLabTestProfileComponent } from './admin-lab-test-profile/admin-lab-test-profile.component';
import { AdminAllRequestComponent } from './admin-all-request/admin-all-request.component';

@NgModule({
  declarations: [
    FourPortalLoginComponent,
    FourPortalForgotpassComponent,
    FourPortalEntercodeComponent,
    FourPortalNewpasswordComponent,
    FourPortalMainComponent,
    FourPortalHeaderComponent,
    FourPortalSidebarComponent,
    FourPortalViewProfileComponent,
    FourPortalRoleandpermissionComponent,
    FourPortalSelectroleComponent,
    FourPortalViewroleComponent,
    FourPortalStaffManagementComponent,
    FourPortalAddStaffComponent,
    FourPortalViewStaffComponent,
    FourPortalMasterComponent,
    FourPortalCommunicationComponent,
    FourPortalAppointmentComponent,
    AppopintmentListComponent,
    AppointmentDetailsComponent,
    FourPortalRatingandreviewComponent,
    FourPortalNotificationComponent,
    LogsComponent,
    EditProfileComponent,
    TestManagementComponent,
    LabTestViewComponent,
    LabAppointmentDetailsComponent,
    LabAddManualResultComponent,
    RadioDashboardComponent,
    LabDashboardComponent,
    LabMainTestListComponent,
    LabOrderDashboardComponent,
    AdminLabDashboardComponent,
    AdminAllLabRadioComponent,
    UserProfileDetailsComponent,
    AdminLabTestConfigComponent,
    AdminLabTestProfileComponent,
    AdminAllRequestComponent
  ],
  imports: [
    CommonModule,
    MatSelectModule,
    FourPortalRoutingModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    SharedModule,
    MatButtonToggleModule,
    FormioModule,
    SignaturePadModule,
    PdfViewerModule,
    MatDatepickerModule,
    MatStepperModule,
    MatTimepickerModule,
    NgxMaterialTimepickerModule,
    NgxMatDatetimePickerModule,
    NgxMatNativeDateModule,
    NgxMatTimepickerModule,
    IgxCalendarModule, 
    IgxDialogModule, 
    IgxPrefixModule, 
    IgxSelectModule,
    NgxQRCodeModule,
    TooltipModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    ContextMenuModule.forRoot({
      useBootstrap4:true
    }),
    // ContextMenuModule,
    // ContextMenuService,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    NgImageFullscreenViewModule
  ],
  providers: [DatePipe,SlicePipe,DecimalPipe,ContextMenuService],

})
export class FourPortalModule { }

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}
