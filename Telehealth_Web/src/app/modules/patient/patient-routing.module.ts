import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { PatientEntercodeComponent } from "./patient-entercode/patient-entercode.component";
import { PatientForgotpassComponent } from "./patient-forgotpass/patient-forgotpass.component";
import { PatientLoginComponent } from "./patient-login/patient-login.component";
import { PatientMainComponent } from "./patient-main/patient-main.component";
import { AppointmentdetailsComponent } from "./patient-myappointment/appointmentdetails/appointmentdetails.component";
import { PastappointmentComponent } from "./patient-myappointment/pastappointment/pastappointment.component";
import { AppointmentlistComponent } from "./patient-myappointment/appointmentlist/appointmentlist.component";
import { CalenderComponent } from "./patient-myappointment/calender/calender.component";
import { PatientMyappointmentComponent } from "./patient-myappointment/patient-myappointment.component";
import { PatientNotificationComponent } from "./patient-notification/patient-notification.component";
import { PatientPaymenthistoryComponent } from "./patient-paymenthistory/patient-paymenthistory.component";
import { PatientProfilecreationComponent } from "./patient-profilecreation/patient-profilecreation.component";
import { PatientRatingandreviewComponent } from "./patient-ratingandreview/patient-ratingandreview.component";
import { PatientSetnewpassComponent } from "./patient-setnewpass/patient-setnewpass.component";
import { PatientSignupComponent } from "./patient-signup/patient-signup.component";
import { CurrentplanComponent } from "./patient-subscriptionplan/currentplan/currentplan.component";
import { PatientSubscriptionplanComponent } from "./patient-subscriptionplan/patient-subscriptionplan.component";
import { PaymentComponent } from "./patient-subscriptionplan/payment/payment.component";
import { PlanComponent } from "./patient-subscriptionplan/plan/plan.component";
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
import { HomeComponent } from "./homepage/home/home.component";
import { AuthGuard } from "src/app/shared/auth-guard";
import { RetailpharmacyComponent } from "./homepage/retailpharmacy/retailpharmacy.component";
import { RetailpharmacydetailComponent } from "./homepage/retailpharmacydetail/retailpharmacydetail.component";
import { CancelledorderComponent } from "./patient-prescriptionorder/cancelledorder/cancelledorder.component";
import { RejectedorderComponent } from "./patient-prescriptionorder/rejectedorder/rejectedorder.component";
import { PatientWaitingroomComponent } from "./patient-waitingroom/patient-waitingroom.component";
import { PatientUpcommingappointmentComponent } from "./patient-waitingroom/patient-upcommingappointment/patient-upcommingappointment.component";
import { PatientCalenderComponent } from "./patient-waitingroom/patient-calender/patient-calender.component";
import { RetaildoctorComponent } from "./homepage/retaildoctor/retaildoctor.component";
import { RetaildoctordetailsComponent } from "./homepage/retaildoctordetails/retaildoctordetails.component";
import { RetailappointmentdetailsComponent } from "./homepage/retailappointmentdetails/retailappointmentdetails.component";
import { RetailreviewappointmentComponent } from "./homepage/retailreviewappointment/retailreviewappointment.component";
import { PaywithcardComponent } from "./homepage/paywithcard/paywithcard.component";
import { NotFoundComponent } from "src/app/shared/not-found/not-found.component";
import { CheckGuard } from "src/app/shared/check.guard";
import { AboutusComponent } from "./homepage/aboutus/aboutus.component";
import { BlogComponent } from "./homepage/blog/blog.component";
import { ContactusComponent } from "./homepage/contactus/contactus.component";
import { PrivacyconditionComponent } from "./homepage/privacycondition/privacycondition.component";
import { TermsconditionComponent } from "./homepage/termscondition/termscondition.component";
import { HealthArticleComponent } from "./homepage/health-article/health-article.component";
import { FaqComponent } from "./homepage/faq/faq.component";
import { VideosComponent } from "./homepage/videos/videos.component";
import { HealthArticleShowContentComponent } from "./homepage/health-article-show-content/health-article-show-content.component";
import { ListLabDentalImagingOpticalComponent } from "./homepage/list-lab-dental-imaging-optical/list-lab-dental-imaging-optical.component";
import { LabImgDentalOptDetailsComponent } from "./homepage/lab-img-dental-opt-details/lab-img-dental-opt-details.component";
import { OrderDetailsComponent } from "./four-portal-order/order-details/order-details.component";
import { ParamedicalProfessionOrderRequestComponent } from "./four-portal-order/paramedical-profession-order-request/paramedical-profession-order-request.component";
import { ImagingOrderRequestComponent } from "./four-portal-order/imaging-order-request/imaging-order-request.component";
import { AcceptOrderDetailsComponent } from "./four-portal-order/accept-order-details/accept-order-details.component";
import { CancelOrderDetailsComponent } from "./four-portal-order/cancel-order-details/cancel-order-details.component";
import { CompleteOrderDetailsComponent } from "./four-portal-order/complete-order-details/complete-order-details.component";
import { OrderPaymentOrderDetailsComponent } from "./four-portal-order/order-payment-order-details/order-payment-order-details.component";
import { ScheduleOrderDetailsComponent } from "./four-portal-order/schedule-order-details/schedule-order-details.component";
import { RejectOrderDetailsComponent } from "./four-portal-order/reject-order-details/reject-order-details.component";
import { FourPortalBookAppointmentComponent } from "./homepage/four-portal-book-appointment/four-portal-book-appointment.component";
import { FourPortalViewAppointmentComponent } from "./homepage/four-portal-view-appointment/four-portal-view-appointment.component";
import { ServicesComponent } from "./homepage/services/services.component";
import { ExchangeRefundPolicyComponent } from "./homepage/exchange-refund-policy/exchange-refund-policy.component";
import { DeleteAccountPolicyComponent } from "./homepage/delete-account-policy/delete-account-policy.component";
import { EnLandingPageComponent } from "./homepage/en-landing-page/en-landing-page.component";
import { ArLandingPageComponent } from "./homepage/ar-landing-page/ar-landing-page.component";
import { ApplePayComponent } from "./homepage/apple-pay/apple-pay.component";
const routes: Routes = [
  { path: "", redirectTo: "home-ar", pathMatch: "full" },
  {
    path: "login",
    component: PatientLoginComponent,
    canActivate: [CheckGuard],
  },
  {
    path: "entercode",
    component: PatientEntercodeComponent,
    canActivate: [CheckGuard],
  },
  {
    path: "reset",
    component: PatientForgotpassComponent,
    canActivate: [CheckGuard],
  },
  {
    path: "setnewpass",
    component: PatientSetnewpassComponent,
    canActivate: [CheckGuard],
  },                                    
  {
    path: "signup",
    component: PatientSignupComponent,
    canActivate: [CheckGuard],
  },
  {
    path: "home-en",
    component: EnLandingPageComponent,
  },
  {
    path: "home-ar",
    component: ArLandingPageComponent,
  },
  {
    path: "privacy-policy",
    component: PrivacyconditionComponent,
  },
  {
      path: 'applepay',
      component: ApplePayComponent
  },
  {
    path: "homepage",
    component: HomepageComponent,
    canActivate: [CheckGuard],
    children: [
      {
        path: "",
        component: HomeComponent,
      },
      {
        path: "retailpharmacy",
        component: RetailpharmacyComponent,
      },
      {
        path: "retailpharmacydetail/:id",
        component: RetailpharmacydetailComponent,
      },
      {
        path: "retaildoctor",
        component: RetaildoctorComponent,
      },
      {
        path: "retailappointmentdetail",
        component: RetailappointmentdetailsComponent,
      },
      {
        path: "retailreviewappointment",
        component: RetailreviewappointmentComponent,
      },
      {
        path: "paywithcard",
        component: PaywithcardComponent,
      },
      {
        path: "retaildoctordetail/:id",
        component: RetaildoctordetailsComponent,
      },
      {
        path: "aboutus",
        component: AboutusComponent,
      },
      {
        path: "blog",
        component: BlogComponent,
      },
      {
        path: "contactus",
        component: ContactusComponent,
      },      
      {
        path: "delete-account-policy",
        component: DeleteAccountPolicyComponent,
      },
      {
        path: "terms-condition",
        component: TermsconditionComponent,
      },
      {
        path: "refund-policy",
        component: ExchangeRefundPolicyComponent,
      },
      {
        path: "articles",
        component: HealthArticleComponent,
      },
      {
        path: "articles-show-content",
        component: HealthArticleShowContentComponent,
      },
      {
        path: "faqs",
        component: FaqComponent,
      },
      {
        path: "videos",
        component: VideosComponent,
      },
      {
        path: "list/:path",
        component: ListLabDentalImagingOpticalComponent,
      },
      {
        path: "details/:path/:id",
        component: LabImgDentalOptDetailsComponent,
      },
      {
        path: "portal-book-appointment",
        component: FourPortalBookAppointmentComponent,
      },
      {
        path: "portal-view-appointment",
        component: FourPortalViewAppointmentComponent,
      },
      {
        path: "services",
        component: ServicesComponent,
      },
    ],
  },
  {
    path: "",
    component: PatientMainComponent,
    canActivate: [AuthGuard],
    children: [
      //path: '', component: PatientMainComponent, children: [
      {
        path: "myappointment",
        component: PatientMyappointmentComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/patient/dashboard"] },
        children: [
          {
            path: "",
            component: CalenderComponent,
          },
          {
            path: "list",
            component: AppointmentlistComponent,
          },
          {
            path: "newappointment",
            component: AppointmentdetailsComponent,
          },
          {
            path: "pastappointment",
            component: PastappointmentComponent,
          },
        ],
      },
      {
        path: "dashboard",
        component: PatientDashboardComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/patient/dashboard"] },
      },
      {
        path: "profilecreation",
        component: PatientProfilecreationComponent,
        // canActivate: [CheckGuard],
        data: { routing: ["/patient/profilecreation"] },
      },     
      {
        path: "ratingandreview",
        component: PatientRatingandreviewComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/patient/ratingandreview"] },
      },      
      {
        path: "paymenthistory",
        component: PatientPaymenthistoryComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/patient/paymenthistory"] },
      },
      {
        path: "subscriptionplan",
        component: PatientSubscriptionplanComponent,
        children: [
          {
            path: "",
            component: CurrentplanComponent,
          },
          {
            path: "payment/:id",
            component: PaymentComponent,
          },
          {
            path: "plan",
            component: PlanComponent,
          },
        ],
      },
      {
        path: "notification",
        component: PatientNotificationComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/patient/notification"] },
      },    
      {
        path: "myaccount",
        component: PatientMyaccountComponent,
      },
      {
        path: "presciptionorder",
        component: PatientPrescriptionorderComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/patient/presciptionorder"] },
        children: [
          {
            path: "",
            component: PrescriptionorderComponent,
          },
          {
            path: "neworder",
            component: NeworderComponent,
          },
          {
            path: "accepted",
            component: AcceptedorderComponent,
          },
          {
            path: "schedule",
            component: ScheduledorderComponent,
          },
          {
            path: "completed",
            component: CompletedorderComponent,
          },
          {
            path: "cancelledorder",
            component: CancelledorderComponent,
          },
          {
            path: "rejectedorder",
            component: RejectedorderComponent,
          },
          {
            path: "payment",
            component: PrescriptionorderPaymentComponent,
          },
        ],
      },     
      {
        path: "waitingroom",
        component: PatientWaitingroomComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/patient/waitingroom"] },
        children: [
          {
            path: "",
            component: PatientUpcommingappointmentComponent,
          },
          {
            path: "calender",
            component: PatientCalenderComponent,
          },
        ],
      }, 
      {
        path: "imaging-order-request",
        component: ImagingOrderRequestComponent,
      }, {
        path: "paramedical-profession-order-request",
        component: ParamedicalProfessionOrderRequestComponent,
      },
      {
        path: "details-order-request",
        component: OrderDetailsComponent,
      },
      {
        path: "accept-order-request",
        component: AcceptOrderDetailsComponent,
      },
      {
        path: "cancel-order-request",
        component: CancelOrderDetailsComponent,
      },
      {
        path: "complete-order-request",
        component: CompleteOrderDetailsComponent,
      },
      {
        path: "order-payment-order-request",
        component: OrderPaymentOrderDetailsComponent,
      },
      {
        path: "reject-order-request",
        component: RejectOrderDetailsComponent,
      },
      {
        path: "schedule-order-request",
        component: ScheduleOrderDetailsComponent,
      },
      {
        path: "**",
        component: NotFoundComponent,
      },
    ],
  },

  // {
  //   path: "**",
  //   component: NotFoundComponent,
  // },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PatientRoutingModule { }
