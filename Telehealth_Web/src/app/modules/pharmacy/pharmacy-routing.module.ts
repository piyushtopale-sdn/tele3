import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { PharmacyDashboardComponent } from "./pharmacy-dashboard/pharmacy-dashboard.component";
import { PharmacyEntercodeComponent } from "./pharmacy-entercode/pharmacy-entercode.component";
import { PharmacyForgotpasswordComponent } from "./pharmacy-forgotpassword/pharmacy-forgotpassword.component";
import { PharmacyHeaderComponent } from "./pharmacy-header/pharmacy-header.component";
import { PharmacyLoginComponent } from "./pharmacy-login/pharmacy-login.component";
import { PharmacyMainComponent } from "./pharmacy-main/pharmacy-main.component";
import { PharmacyNewpasswordComponent } from "./pharmacy-newpassword/pharmacy-newpassword.component";
import { NeworderrequestComponent } from "./pharmacy-prescriptionorder/neworderrequest/neworderrequest.component";
import { PharmacyPrescriptionorderComponent } from "./pharmacy-prescriptionorder/pharmacy-prescriptionorder.component";
import { PrescriptionorderComponent } from "./pharmacy-prescriptionorder/prescriptionorder/prescriptionorder.component";
import { EditprofileComponent } from "./pharmacy-profilemanagement/editprofile/editprofile.component";
import { PharmacyProfilemanagementComponent } from "./pharmacy-profilemanagement/pharmacy-profilemanagement.component";
import { ProfileComponent } from "./pharmacy-profilemanagement/profile/profile.component";
import { ViewstaffComponent } from "./pharmacy-staffmanagement/viewstaff/viewstaff.component";
import { AddstaffComponent } from "./pharmacy-staffmanagement/addstaff/addstaff.component";
import { PharmacyStaffmanagementComponent } from "./pharmacy-staffmanagement/pharmacy-staffmanagement.component";
import { PharmacyRatingandreviewComponent } from "./pharmacy-ratingandreview/pharmacy-ratingandreview.component";
import { PharmacyNotificationComponent } from "./pharmacy-notification/pharmacy-notification.component";
import { PharmacyRoleandpermisionComponent } from "./pharmacy-roleandpermision/pharmacy-roleandpermision.component";
import { PharmacyLogsComponent } from "./pharmacy-logs/pharmacy-logs.component";
import { AuthGuard } from "src/app/shared/auth-guard";
import { ViewroleComponent } from "./pharmacy-roleandpermision/viewrole/viewrole.component";
import { SelectroleComponent } from "./pharmacy-roleandpermision/selectrole/selectrole.component";
import { PharmacyCommunicationComponent } from "./pharmacy-communication/pharmacy-communication.component";
import { CheckGuard } from "src/app/shared/check.guard";
// import { NotFoundComponent } from "src/app/not-found/not-found.component";
import { NotFoundComponent } from "src/app/shared/not-found/not-found.component";

// import { AuthGuard } from "./shared/auth-guard";
// import { SubscribersdetailComponent } from './insurance-subscribers/subscribersdetail/subscribersdetail.component';

const routes: Routes = [
  { path: "", redirectTo: "login", pathMatch: "full" },
  {
    path: "login",
    component: PharmacyLoginComponent,
  },
  {
    path: "entercode",
    component: PharmacyEntercodeComponent,
  },
  {
    path: "reset",
    component: PharmacyForgotpasswordComponent,
  },
  {
    path: "newpassword",
    component: PharmacyNewpasswordComponent,
  },
  {
    path: "pharmacyheader",
    component: PharmacyHeaderComponent,
  },
  {
    path: "",
    component: PharmacyMainComponent,
    canActivate: [AuthGuard],
    children: [
      //path: '', component: PharmacyMainComponent, children: [
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },
      {
        path: "dashboard",
        component: PharmacyDashboardComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/pharmacy/dashboard"] },
      },
      {
        path: "presciptionorder",
        component: PharmacyPrescriptionorderComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/pharmacy/presciptionorder"] },
        children: [
          {
            path: "",
            component: PrescriptionorderComponent,
          },
          {
            path: "neworderrequest",
            component: NeworderrequestComponent,
          },          
        ],
      },
      {
        path: "profile",
        component: PharmacyProfilemanagementComponent,

        children: [
          {
            path: "",
            component: ProfileComponent,
          },
          {
            path: "edit",
            component: EditprofileComponent,
            // canActivate: [CheckGuard],
            data: { routing: ["/pharmacy/profile"] },
          },
        ],
      },
      {
        path: "staffmanagement",
        component: PharmacyStaffmanagementComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/pharmacy/staffmanagement"] },
        children: [
          {
            path: "",
            component: ViewstaffComponent,
          },
          {
            path: "add",
            component: AddstaffComponent,
          },
        ],
      },
      {
        path: "ratingandreview",
        component: PharmacyRatingandreviewComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/pharmacy/ratingandreview"] },
      },
      {
        path: "notification",
        component: PharmacyNotificationComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/pharmacy/notification"] },
      },
      {
        path: "logs",
        component: PharmacyLogsComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/pharmacy/logs"] },
      },
      
      {
        path: "roleandpermission",
        component: PharmacyRoleandpermisionComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/pharmacy/roleandpermission"] },
        children: [
          {
            path: "",
            component: SelectroleComponent,
          },
          {
            path: "view",
            component: ViewroleComponent,
          },
        ],
      },
      {
        path: "communication",
        component: PharmacyCommunicationComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/pharmacy/communication"] },
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
export class PharmacyRoutingModule {}
