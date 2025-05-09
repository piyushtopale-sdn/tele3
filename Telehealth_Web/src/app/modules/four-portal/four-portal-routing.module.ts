import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FourPortalLoginComponent } from './four-portal-login/four-portal-login.component';
import { FourPortalForgotpassComponent } from './four-portal-forgotpass/four-portal-forgotpass.component';
import { FourPortalEntercodeComponent } from './four-portal-entercode/four-portal-entercode.component';
import { FourPortalNewpasswordComponent } from './four-portal-newpassword/four-portal-newpassword.component';
import { AuthGuard } from 'src/app/shared/auth-guard';
import { CheckGuard } from 'src/app/shared/check.guard';
import { FourPortalMainComponent } from './four-portal-main/four-portal-main.component';
import { FourPortalHeaderComponent } from './four-portal-header/four-portal-header.component';
import { FourPortalViewProfileComponent } from './four-portal-view-profile/four-portal-view-profile.component';
import { FourPortalRoleandpermissionComponent } from './four-portal-roleandpermission/four-portal-roleandpermission.component';
import { FourPortalSelectroleComponent } from './four-portal-roleandpermission/four-portal-selectrole/four-portal-selectrole.component';
import { FourPortalViewroleComponent } from './four-portal-roleandpermission/four-portal-viewrole/four-portal-viewrole.component';
import { FourPortalStaffManagementComponent } from './four-portal-staff-management/four-portal-staff-management.component';
import { FourPortalViewStaffComponent } from './four-portal-staff-management/four-portal-view-staff/four-portal-view-staff.component';
import { FourPortalAddStaffComponent } from './four-portal-staff-management/four-portal-add-staff/four-portal-add-staff.component';

import { FourPortalCommunicationComponent } from './four-portal-communication/four-portal-communication.component';

import { AppopintmentListComponent } from './four-portal-appointment/appopintment-list/appopintment-list.component';
import { FourPortalAppointmentComponent } from './four-portal-appointment/four-portal-appointment.component';
import { AppointmentDetailsComponent } from './four-portal-appointment/radio-appointment-details/appointment-details.component';
import { FourPortalRatingandreviewComponent } from './four-portal-ratingandreview/four-portal-ratingandreview.component';
import { FourPortalNotificationComponent } from './four-portal-notification/four-portal-notification.component';
import { NotFoundComponent } from 'src/app/shared/not-found/not-found.component';
import { EditProfileComponent } from './four-portal-view-profile/edit-profile/edit-profile.component';
import { TestManagementComponent } from './test-management/test-management.component';
import { LabTestViewComponent } from './test-management/lab-test-view/lab-test-view.component';
import { LabAppointmentDetailsComponent } from './four-portal-appointment/lab-appointment-details/lab-appointment-details.component';
import { LabAddManualResultComponent } from './four-portal-appointment/lab-add-manual-result/lab-add-manual-result.component';
import { RadioDashboardComponent } from './radio-dashboard/radio-dashboard.component';
import { LabDashboardComponent } from './lab-dashboard/lab-dashboard.component';
import { LabMainTestListComponent } from './profile-manage-test/lab-main-test-list.component';
import { LabOrderDashboardComponent } from './delay-dashboard/lab-order-dashboard.component';
import { AdminLabDashboardComponent } from './admin-lab-dashboard/admin-lab-dashboard.component';
import { AdminAllLabRadioComponent } from './admin-all-lab-radio/admin-all-lab-radio.component';
import { UserProfileDetailsComponent } from './admin-all-lab-radio/user-profile-details/user-profile-details.component';
import { AdminLabTestProfileComponent } from './admin-lab-test-profile/admin-lab-test-profile.component';
import { AdminLabTestConfigComponent } from './admin-lab-test-config/admin-lab-test-config.component';
import { AdminAllRequestComponent } from './admin-all-request/admin-all-request.component';

const routes: Routes = [
  { path: "", redirectTo: "login", pathMatch: "full" },
  {
    path: "login/:path",
    component: FourPortalLoginComponent,
  },
  {
    path: "reset/:path",
    component: FourPortalForgotpassComponent,
  },
  {
    path: "entercode/:path",
    component: FourPortalEntercodeComponent,
  },
  {
    path: "newpassword/:path",
    component: FourPortalNewpasswordComponent,
  },
  {
    path: "header",
    component: FourPortalHeaderComponent,
  },
  {
    path: "",
    component: FourPortalMainComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: "lab-dashboard/:path",
        component: LabDashboardComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/portals/dashboard"] },
      },
      {
        path: "radio-dashboard/:path",
        component: RadioDashboardComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/portals/dashboard"] },
      },
      {
        path: "viewProfile/:path",
        component: FourPortalViewProfileComponent
      },
      {
        path: "editProfile/:path",
        component: EditProfileComponent
      },
      {
        path: "rolepermission/:path",
        component: FourPortalRoleandpermissionComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/portals/rolepermission"] },
        children: [
          {
            path: "",
            component: FourPortalSelectroleComponent,
          },
          {
            path: "view",
            component: FourPortalViewroleComponent,
          },
        ],
      },
      {
        path: "staffmanagement/:path",
        component: FourPortalStaffManagementComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/portals/staffmanagement"] },

        children: [
          {
            path: "",
            component: FourPortalViewStaffComponent,
          },
          {
            path: "add",
            component: FourPortalAddStaffComponent,
          },
        ],
      },
      {
        path: "communication/:path",
        component: FourPortalCommunicationComponent,
      },
      {
        path: "manage-result/:path",
        component: FourPortalAppointmentComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/portals/manage-result"] },

        children: [
          {
            path: "",
            component: AppopintmentListComponent,
          },
          {
            path: "radio-details/:id",
            component: AppointmentDetailsComponent,
          },     
          {
            path: "lab-details/:id",
            component: LabAppointmentDetailsComponent,
          },  
          {
            path: "add-manual-result/:id",
            component: LabAddManualResultComponent,
          },
        ],
      },
      {
        path: "manage-test/:path",
        canActivate: [CheckGuard],
        data: { routing: ["/portals/manage-test"] },
        children: [
          {
            path: "",
            component: TestManagementComponent,
          },
          {
            path: "lab-test-view/:id",
            component: LabTestViewComponent,
          },
        ]
      },
        {
          path: "sub-test/:path",
          component: LabMainTestListComponent,
          canActivate: [CheckGuard],
          data: { routing: ["/portals/sub-test"] }
        },
      
      {
        path: "ratingnreview/:path",
        component: FourPortalRatingandreviewComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/portals/ratingnreview"] }
      },

      {
        path: "notification/:path",
        component: FourPortalNotificationComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/portals/notification"] },
      },

      {
        path: "delay-report/:path",
        component: LabOrderDashboardComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/portals/delay-report"] }
      },
      {
        path: "admin-dashboard/:path",
        component: AdminLabDashboardComponent,
        data: { routing: ["/portals/admin-dashboard"] }
      },
      {
        path: "all-lab-radio-users/:path",
        component: AdminAllLabRadioComponent,
        data: { routing: ["/portals/all-lab-radio-users"] }
      },
      {
        path: "user-details/:id",
        component: UserProfileDetailsComponent,
        data: { routing: ["/portals/user-details/:id"] },
      },
      {
        path: "lab-test-profile",
        component: AdminLabTestProfileComponent,
        data: { routing: ["/portals/lab-test-profile"] },
      },
      {
        path: "test-config/:path",
        component: AdminLabTestConfigComponent,
        data: { routing: ["/portals/test-config"] },
      },
      {
        path: "all-request-list/:path",
        component: AdminAllRequestComponent,
        data: { routing: ["/portals/all-request-list"] },
      },
      {
        path: "**",
        component: NotFoundComponent,
      },
    ],
  },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FourPortalRoutingModule { }
