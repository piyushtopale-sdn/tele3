import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClientModule, HttpClient } from "@angular/common/http";
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
// import {OverlayModule} from '@angular/cdk/overlay';
import { FlatpickrModule } from "angularx-flatpickr";
import { CalendarModule, DateAdapter } from "angular-calendar";
import { adapterFactory } from "angular-calendar/date-adapters/date-fns";

// import { MatFormFieldModule } from '@angular/material/form-field';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { PatientRoutingModule } from "./patient-routing.module";
import { PatientHeaderComponent } from "./patient-header/patient-header.component";
import { PatientFooterComponent } from "./patient-footer/patient-footer.component";
import { PatientSidebarComponent } from "./patient-sidebar/patient-sidebar.component";
import { PatientMainComponent } from "./patient-main/patient-main.component";
import { PatientLoginComponent } from "./patient-login/patient-login.component";
import { PatientEntercodeComponent } from "./patient-entercode/patient-entercode.component";
import { PatientForgotpassComponent } from "./patient-forgotpass/patient-forgotpass.component";
import { PatientSetnewpassComponent } from "./patient-setnewpass/patient-setnewpass.component";
import { PatientSignupComponent } from "./patient-signup/patient-signup.component";
import { PatientMyappointmentComponent } from "./patient-myappointment/patient-myappointment.component";
import { CalenderComponent } from "./patient-myappointment/calender/calender.component";
import { PatientProfilecreationComponent } from "./patient-profilecreation/patient-profilecreation.component";

import { PatientRatingandreviewComponent } from "./patient-ratingandreview/patient-ratingandreview.component";
import { PatientPaymenthistoryComponent } from "./patient-paymenthistory/patient-paymenthistory.component";
import { PatientSubscriptionplanComponent } from "./patient-subscriptionplan/patient-subscriptionplan.component";
import { PlanComponent } from "./patient-subscriptionplan/plan/plan.component";
import { PaymentComponent } from "./patient-subscriptionplan/payment/payment.component";
import { CurrentplanComponent } from "./patient-subscriptionplan/currentplan/currentplan.component";
// import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { AppointmentlistComponent } from "./patient-myappointment/appointmentlist/appointmentlist.component";
import { AppointmentdetailsComponent } from "./patient-myappointment/appointmentdetails/appointmentdetails.component";
import { PastappointmentComponent } from "./patient-myappointment/pastappointment/pastappointment.component";
import { SharedModule } from "../shared.module";
import { PatientDashboardComponent } from "./patient-dashboard/patient-dashboard.component";
import { PatientMyaccountComponent } from "./patient-myaccount/patient-myaccount.component";
import { PatientPrescriptionorderComponent } from "./patient-prescriptionorder/patient-prescriptionorder.component";
import { NeworderComponent } from "./patient-prescriptionorder/neworder/neworder.component";
import { AcceptedorderComponent } from "./patient-prescriptionorder/acceptedorder/acceptedorder.component";
import { ScheduledorderComponent } from "./patient-prescriptionorder/scheduledorder/scheduledorder.component";
import { CompletedorderComponent } from "./patient-prescriptionorder/completedorder/completedorder.component";
import { PrescriptionorderComponent } from "./patient-prescriptionorder/prescriptionorder/prescriptionorder.component";
import { PrescriptionorderPaymentComponent } from "./patient-prescriptionorder/prescriptionorder-payment/prescriptionorder-payment.component";
import { HomepageComponent } from "./homepage/homepage.component";
import { HeaderComponent } from "./homepage/header/header.component";
import { FooterComponent } from "./homepage/footer/footer.component";
import { HomeComponent } from "./homepage/home/home.component";
import { MatSortModule } from "@angular/material/sort";
import { RetailpharmacyComponent } from "./homepage/retailpharmacy/retailpharmacy.component";
import { PharmacyService } from "../pharmacy/pharmacy.service";
import { PatientService } from "./patient.service";
import { RetailpharmacydetailComponent } from "./homepage/retailpharmacydetail/retailpharmacydetail.component";
// import { SubscribersdetailComponent } from './modules/insurance/insurance-subscribers/subscribersdetail/subscribersdetail.component';
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { DatePipe } from "@angular/common";
import { CancelledorderComponent } from "./patient-prescriptionorder/cancelledorder/cancelledorder.component";
import { RejectedorderComponent } from "./patient-prescriptionorder/rejectedorder/rejectedorder.component";
import { PatientWaitingroomComponent } from "./patient-waitingroom/patient-waitingroom.component";
import { PatientUpcommingappointmentComponent } from "./patient-waitingroom/patient-upcommingappointment/patient-upcommingappointment.component";
import { PatientCalenderComponent } from "./patient-waitingroom/patient-calender/patient-calender.component";
import { RetaildoctorComponent } from "./homepage/retaildoctor/retaildoctor.component";
import { RetaildoctordetailsComponent } from "./homepage/retaildoctordetails/retaildoctordetails.component";
import { MatSliderModule } from "@angular/material/slider";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { RetailappointmentdetailsComponent } from "./homepage/retailappointmentdetails/retailappointmentdetails.component";
import { RetailreviewappointmentComponent } from "./homepage/retailreviewappointment/retailreviewappointment.component";
import { PaywithcardComponent } from "./homepage/paywithcard/paywithcard.component";
import {
  IgxCalendarModule,
  IgxDialogModule,
  IgxPrefixModule,
  IgxSelectModule,
} from "igniteui-angular";
import { HammerModule } from "@angular/platform-browser";
import { OverlayModule } from "@angular/cdk/overlay";
import { ContextMenuModule } from "@perfectmemory/ngx-contextmenu";

import { TooltipModule } from "ng2-tooltip-directive";
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';

import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import {
  NgxMatDatetimePickerModule,
  NgxMatNativeDateModule,
  NgxMatTimepickerModule,
} from "@angular-material-components/datetime-picker";

import { SlicePipe } from "@angular/common";
import { SignaturePadModule } from "angular2-signaturepad";
import { AboutusComponent } from './homepage/aboutus/aboutus.component';
import { BlogComponent } from './homepage/blog/blog.component';
import { ContactusComponent } from './homepage/contactus/contactus.component';
import { PrivacyconditionComponent } from './homepage/privacycondition/privacycondition.component';
import { TermsconditionComponent } from './homepage/termscondition/termscondition.component';
import { HealthArticleComponent } from './homepage/health-article/health-article.component';
import { FaqComponent } from './homepage/faq/faq.component';
import { VideosComponent } from './homepage/videos/videos.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { HealthArticleShowContentComponent } from './homepage/health-article-show-content/health-article-show-content.component';

import { ListLabDentalImagingOpticalComponent } from './homepage/list-lab-dental-imaging-optical/list-lab-dental-imaging-optical.component';
import { MatInputModule } from '@angular/material/input';

import { LabImgDentalOptDetailsComponent } from './homepage/lab-img-dental-opt-details/lab-img-dental-opt-details.component';
import { ImagingOrderRequestComponent } from './four-portal-order/imaging-order-request/imaging-order-request.component';
import { ParamedicalProfessionOrderRequestComponent } from './four-portal-order/paramedical-profession-order-request/paramedical-profession-order-request.component';
import { OrderDetailsComponent } from './four-portal-order/order-details/order-details.component';
import { AcceptOrderDetailsComponent } from './four-portal-order/accept-order-details/accept-order-details.component';
import { CancelOrderDetailsComponent } from './four-portal-order/cancel-order-details/cancel-order-details.component';
import { CompleteOrderDetailsComponent } from './four-portal-order/complete-order-details/complete-order-details.component';
import { RejectOrderDetailsComponent } from './four-portal-order/reject-order-details/reject-order-details.component';
import { ScheduleOrderDetailsComponent } from './four-portal-order/schedule-order-details/schedule-order-details.component';
import { OrderPaymentOrderDetailsComponent } from './four-portal-order/order-payment-order-details/order-payment-order-details.component';
import { FourPortalBookAppointmentComponent } from './homepage/four-portal-book-appointment/four-portal-book-appointment.component';
import { FourPortalViewAppointmentComponent } from './homepage/four-portal-view-appointment/four-portal-view-appointment.component';
import { PatientNotificationComponent } from "./patient-notification/patient-notification.component";
import { NgxEditorModule } from "ngx-editor";
import { ServicesComponent } from "./homepage/services/services.component";
import { ExchangeRefundPolicyComponent } from "./homepage/exchange-refund-policy/exchange-refund-policy.component";
import { DeleteAccountPolicyComponent } from "./homepage/delete-account-policy/delete-account-policy.component";
import { EnLandingPageComponent } from "./homepage/en-landing-page/en-landing-page.component";
import { ArLandingPageComponent } from "./homepage/ar-landing-page/ar-landing-page.component";
@NgModule({
  declarations: [
    PatientHeaderComponent,
    PatientFooterComponent,
    PatientSidebarComponent,
    PatientMainComponent,
    PatientLoginComponent,
    PatientEntercodeComponent,
    PatientForgotpassComponent,
    PatientSetnewpassComponent,
    PatientSignupComponent,
    PatientMyappointmentComponent,
    CalenderComponent,
    PatientProfilecreationComponent,
    PatientRatingandreviewComponent,
    PatientPaymenthistoryComponent,
    PatientSubscriptionplanComponent,
    PlanComponent,
    PaymentComponent,
    CurrentplanComponent,
    AppointmentlistComponent,
    AppointmentdetailsComponent,
    PastappointmentComponent,
    PatientDashboardComponent,
    PatientMyaccountComponent,
    PatientPrescriptionorderComponent,
    NeworderComponent,
    AcceptedorderComponent,
    ScheduledorderComponent,
    CompletedorderComponent,
    PrescriptionorderComponent,
    PrescriptionorderPaymentComponent,
    HomepageComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    RetailpharmacyComponent,
    RetailpharmacydetailComponent,
    CancelledorderComponent,
    RejectedorderComponent,
    PatientWaitingroomComponent,
    PatientUpcommingappointmentComponent,
    PatientCalenderComponent,
    RetaildoctorComponent,
    RetaildoctordetailsComponent,
    RetailappointmentdetailsComponent,
    RetailreviewappointmentComponent,
    PaywithcardComponent,
    AboutusComponent,
    BlogComponent,
    ContactusComponent,
    PrivacyconditionComponent,
    TermsconditionComponent,
    HealthArticleComponent,
    FaqComponent,
    VideosComponent,
    HealthArticleShowContentComponent,
    ListLabDentalImagingOpticalComponent,
    PatientNotificationComponent,
    ServicesComponent,
    LabImgDentalOptDetailsComponent, 
    ImagingOrderRequestComponent, 
    ParamedicalProfessionOrderRequestComponent, OrderDetailsComponent, AcceptOrderDetailsComponent,
    CancelOrderDetailsComponent, CompleteOrderDetailsComponent, RejectOrderDetailsComponent, ScheduleOrderDetailsComponent,
    OrderPaymentOrderDetailsComponent, FourPortalBookAppointmentComponent, FourPortalViewAppointmentComponent,
    ExchangeRefundPolicyComponent,
    DeleteAccountPolicyComponent,
    EnLandingPageComponent,
    ArLandingPageComponent
  
  ],
  imports: [
    NgxQRCodeModule,
    CommonModule,
    OverlayModule,
    MatSortModule,
    MatProgressBarModule,
    MatSliderModule,
    MatButtonToggleModule,
    MatSliderModule,
    MatInputModule,
    IgxCalendarModule,
    IgxDialogModule,
    IgxPrefixModule,
    IgxSelectModule,
    HammerModule,
    FormsModule,
    MatSelectModule,
    SharedModule,
    OverlayModule,
    SignaturePadModule,
    PdfViewerModule,
    NgxEditorModule,
    ContextMenuModule.forRoot({
      useBootstrap4: true,
    }),
    TooltipModule,
    // HttpClientModule,
    // MatStepperModule,
    // MatRadioModule,
    // MatFormFieldModule,
    // MatCheckboxModule,
    MatDialogModule,
    FlatpickrModule.forRoot(),
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),

    PatientRoutingModule,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule,

  ],
  providers: [PharmacyService, PatientService, DatePipe, SlicePipe],
})
export class PatientModule { }

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}
