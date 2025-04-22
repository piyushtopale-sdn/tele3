import { NgModule } from "@angular/core";
import { CommonModule, DecimalPipe } from "@angular/common";

import { FlatpickrModule } from 'angularx-flatpickr';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { HttpClient } from "@angular/common/http";
import { IndividualDoctorRoutingModule } from "./individual-doctor-routing.module";
import { IndividualDoctorLoginComponent } from "./individual-doctor-login/individual-doctor-login.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { IndividualDoctorForgotpassComponent } from "./individual-doctor-forgotpass/individual-doctor-forgotpass.component";
import { MatIconModule } from "@angular/material/icon";
import { IndividualDoctorEntercodeComponent } from "./individual-doctor-entercode/individual-doctor-entercode.component";
import { IndividualDoctorNewpasswordComponent } from "./individual-doctor-newpassword/individual-doctor-newpassword.component";
import { IndividualDoctorHeaderComponent } from "./individual-doctor-header/individual-doctor-header.component";
import { IndividualDoctorMainComponent } from "./individual-doctor-main/individual-doctor-main.component";
import { IndividualDoctorSidebarComponent } from "./individual-doctor-sidebar/individual-doctor-sidebar.component";
import { MatSelectModule } from "@angular/material/select";
import { MatTableModule } from "@angular/material/table";
import { IndividualDoctorMyprofileComponent } from "./individual-doctor-myprofile/individual-doctor-myprofile.component";
import { MatStepperModule } from "@angular/material/stepper";
import { MatTimepickerModule } from "mat-timepicker";
import { MatRadioModule } from "@angular/material/radio";
import { BasicinfoComponent } from "./individual-doctor-myprofile/basicinfo/basicinfo.component";
import { EducationalComponent } from "./individual-doctor-myprofile/educational/educational.component";
import { AvailabilityComponent } from "./individual-doctor-myprofile/availability/availability.component";
import { DocumentmanageComponent } from "./individual-doctor-myprofile/documentmanage/documentmanage.component";
import { MatTabsModule } from "@angular/material/tabs";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { IndividualDoctorStaffmanagementComponent } from "./individual-doctor-staffmanagement/individual-doctor-staffmanagement.component";
import { AddstaffComponent } from "./individual-doctor-staffmanagement/addstaff/addstaff.component";
import { ViewstaffComponent } from "./individual-doctor-staffmanagement/viewstaff/viewstaff.component";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatPaginatorModule } from "@angular/material/paginator";
import { IndividualDoctorRoleandpermisionComponent } from "./individual-doctor-roleandpermision/individual-doctor-roleandpermision.component";
import { SelectroleComponent } from "./individual-doctor-roleandpermision/selectrole/selectrole.component";
import { ViewroleComponent } from "./individual-doctor-roleandpermision/viewrole/viewrole.component";
import { EditprofileComponent } from "./individual-doctor-myprofile/editprofile/editprofile.component";
import { MatExpansionModule } from "@angular/material/expansion";
import { IndividualDoctorLeavesComponent } from "./individual-doctor-leaves/individual-doctor-leaves.component";
import { IndividualDoctorNotificationComponent } from "./individual-doctor-notification/individual-doctor-notification.component";
import { IndividualDoctorMasterComponent } from "./individual-doctor-master/individual-doctor-master.component";
import { IndividualDoctorMydocumentComponent } from "./individual-doctor-mydocument/individual-doctor-mydocument.component";
import { TemplatebuilderComponent } from "./individual-doctor-master/templatebuilder/templatebuilder.component";
import { AddtemplateComponent } from "./individual-doctor-master/addtemplate/addtemplate.component";
import { QuestionnaireComponent } from "./individual-doctor-master/questionnaire/questionnaire.component";
import { AppointmentreasonsComponent } from "./individual-doctor-master/appointmentreasons/appointmentreasons.component";
import { LogsComponent } from "./individual-doctor-master/logs/logs.component";
import { SharedModule } from "../shared.module";
import { IndividualDoctorRatingandreviewComponent } from "./individual-doctor-ratingandreview/individual-doctor-ratingandreview.component";
import { IndividualDoctorPatientmanagementComponent } from "./individual-doctor-patientmanagement/individual-doctor-patientmanagement.component";
import { ViewpatientComponent } from "./individual-doctor-patientmanagement/viewpatient/viewpatient.component";

import { IndividualDoctorDashboardComponent } from "./individual-doctor-dashboard/individual-doctor-dashboard.component";
import { MatChipsModule } from "@angular/material/chips";
import { NgxMaterialTimepickerModule } from "ngx-material-timepicker";
import { IndividualDoctorAppointmentComponent } from "./individual-doctor-appointment/individual-doctor-appointment.component";
import { AppointmentlistComponent } from "./individual-doctor-appointment/appointmentlist/appointmentlist.component";
import { UpcomingappointmentdetailsComponent } from "./individual-doctor-appointment/upcomingappointmentdetails/upcomingappointmentdetails.component";
import { VideocallComponent } from './individual-doctor-appointment/videocall/videocall.component';
import { SchedulerComponent } from './individual-doctor-appointment/scheduler/scheduler.component';
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { VitalComponent } from './individual-doctor-appointment/upcomingappointmentdetails/vital/vital.component';
import { MedicineComponent } from './individual-doctor-appointment/upcomingappointmentdetails/medicine/medicine.component';
import { IgxCalendarModule, IgxDialogModule, IgxPrefixModule, IgxSelectModule } from 'igniteui-angular';
import { HammerModule } from '@angular/platform-browser';
import { IndividualDoctorEprescriptionComponent } from './individual-doctor-eprescription/individual-doctor-eprescription.component';
import { EprescriptionlistComponent } from './individual-doctor-eprescription/eprescriptionlist/eprescriptionlist.component';

import { MedicinesComponent } from './individual-doctor-eprescription/medicines/medicines.component';
import { EprescriptionmedicineComponent } from './individual-doctor-eprescription/medicines/eprescriptionmedicine/eprescriptionmedicine.component';
import { DatePipe } from "@angular/common";
import { ImagingComponent } from './individual-doctor-eprescription/imaging/imaging.component';
import { EprescriptionimagingComponent } from './individual-doctor-eprescription/imaging/eprescriptionimaging/eprescriptionimaging.component';
import { CdkStepper } from "@angular/cdk/stepper";
import { IndividualDoctorCommunicationComponent } from './individual-doctor-communication/individual-doctor-communication.component';
import { FormioModule } from 'angular-formio';

import { NgMultiSelectDropDownModule } from "ng-multiselect-dropdown";
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { ContextMenuService } from "@perfectmemory/ngx-contextmenu";
import { ContextMenuModule } from '@perfectmemory/ngx-contextmenu';
import { TooltipModule } from 'ng2-tooltip-directive';
import {
  NgxMatDatetimePickerModule,
  NgxMatNativeDateModule,
  NgxMatTimepickerModule,
} from "@angular-material-components/datetime-picker";
import { SignaturePadModule } from 'angular2-signaturepad';
import { SlicePipe } from "@angular/common";
import { NgImageFullscreenViewModule } from 'ng-image-fullscreen-view';
import { IndividualDoctorViewpdfComponent } from './individual-doctor-viewpdf/individual-doctor-viewpdf.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { NgxEditorModule } from "ngx-editor";
import { ValidatemedicineprescriptionComponent } from "./individual-doctor-eprescription/medicines/validatemedicineprescription/validatemedicineprescription.component";
import { EprescriptionlabComponent } from "./individual-doctor-eprescription/lab/eprescriptionlab/eprescriptionlab.component";
import { IndividualDoctorWaitingroomComponent } from "./individual-doctor-waitingroom/individual-doctor-waitingroom.component";
import { WaitingAppointmentListComponent } from "./individual-doctor-waitingroom/waiting-appointment-list/waiting-appointment-list.component";
import { WaitingCalenderComponent } from "./individual-doctor-waitingroom/waiting-calender/waiting-calender.component";
import { DiagnosisComponent } from "./individual-doctor-appointment/upcomingappointmentdetails/diagnosis/diagnosis.component";
import { LabTestComponent } from "./individual-doctor-appointment/upcomingappointmentdetails/lab-test/lab-test.component";
import { RadioTestComponent } from "./individual-doctor-appointment/upcomingappointmentdetails/radio-test/radio-test.component";
import { ValidateRadiotestComponent } from "./individual-doctor-eprescription/imaging/validate-radiotest/validate-radiotest.component";
import { ValidateTestComponent } from "./individual-doctor-eprescription/lab/validate-test/validate-test.component";
import { ViewlabManualResultComponent } from "./individual-doctor-patientmanagement/viewlab-manual-result/viewlab-manual-result.component";
import { PatientMedicalDocComponent } from "./individual-doctor-appointment/upcomingappointmentdetails/patient-medical-doc/patient-medical-doc.component";
import { AdminAppointmentComponent } from "./admin-appointment/admin-appointment.component";
import { AdminEmrComponent } from "./admin-emr/admin-emr.component";
import { AdminDashboardComponent } from "./admin-dashboard/admin-dashboard.component";
import { AdminAllDoctorsComponent } from "./admin-all-doctors/admin-all-doctors.component";
import { DoctorDetailsComponent } from "./admin-all-doctors/doctor-details/doctor-details.component";
import { NewVitalComponent } from "./individual-doctor-appointment/upcomingappointmentdetails/new-vital/new-vital.component";
@NgModule({
  declarations: [
    IndividualDoctorLoginComponent,
    IndividualDoctorForgotpassComponent,
    IndividualDoctorEntercodeComponent,
    IndividualDoctorNewpasswordComponent,
    IndividualDoctorHeaderComponent,
    IndividualDoctorMainComponent,
    IndividualDoctorSidebarComponent,
    WaitingAppointmentListComponent,
    DiagnosisComponent,
    WaitingCalenderComponent,
    IndividualDoctorMyprofileComponent,
    BasicinfoComponent,
    EducationalComponent,
    AvailabilityComponent,
    DocumentmanageComponent,
    IndividualDoctorStaffmanagementComponent,
    AddstaffComponent,
    ViewstaffComponent,
    IndividualDoctorRoleandpermisionComponent,
    SelectroleComponent,
    ViewroleComponent,
    EditprofileComponent,
    IndividualDoctorLeavesComponent,
    IndividualDoctorMydocumentComponent,
    IndividualDoctorNotificationComponent,
    IndividualDoctorMasterComponent,
    TemplatebuilderComponent,
    AddtemplateComponent,
    QuestionnaireComponent,
    AppointmentreasonsComponent,
    LogsComponent,
    IndividualDoctorRatingandreviewComponent,
    IndividualDoctorPatientmanagementComponent,
    ViewpatientComponent,
    IndividualDoctorDashboardComponent,
    IndividualDoctorAppointmentComponent,
    AppointmentlistComponent,
    UpcomingappointmentdetailsComponent,
    VideocallComponent,
    SchedulerComponent,
    VitalComponent,
    MedicineComponent,
    IndividualDoctorEprescriptionComponent,
    EprescriptionlistComponent,
    MedicinesComponent,
    EprescriptionmedicineComponent,  
    ImagingComponent,
    EprescriptionimagingComponent,   
    IndividualDoctorCommunicationComponent,
    IndividualDoctorViewpdfComponent,
    ValidatemedicineprescriptionComponent,
    EprescriptionlabComponent,
    IndividualDoctorWaitingroomComponent,
    LabTestComponent,
    RadioTestComponent,
    ValidateRadiotestComponent,
    ValidateTestComponent,
    ViewlabManualResultComponent,
    PatientMedicalDocComponent,
    AdminAppointmentComponent,
    AdminEmrComponent,
    AdminDashboardComponent,
    AdminAllDoctorsComponent,
    DoctorDetailsComponent,
    NewVitalComponent
  ],
  imports: [

    ContextMenuModule.forRoot({
      useBootstrap4: true
    }),
    PdfViewerModule,
    TooltipModule,
    NgxQRCodeModule,
    FormioModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    SharedModule,
    IgxCalendarModule,
    IgxDialogModule,
    IgxPrefixModule,
    IgxSelectModule,
    HammerModule,
    SignaturePadModule,    
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule,
    MatStepperModule,
    MatTimepickerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatChipsModule,
    IndividualDoctorRoutingModule,
    MatButtonToggleModule,
    NgxMatDatetimePickerModule,
    NgxEditorModule,
    NgxMatNativeDateModule,
    NgxMatTimepickerModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    NgMultiSelectDropDownModule.forRoot(),
    NgxMaterialTimepickerModule,
    FlatpickrModule.forRoot(),
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    NgImageFullscreenViewModule
  ],
  providers: [DatePipe, CdkStepper, ContextMenuService, SlicePipe, DecimalPipe],
})
export class IndividualDoctorModule { }

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}