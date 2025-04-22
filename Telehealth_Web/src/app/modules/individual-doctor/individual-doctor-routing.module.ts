import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppointmentlistComponent } from "./individual-doctor-appointment/appointmentlist/appointmentlist.component";
import { IndividualDoctorAppointmentComponent } from "./individual-doctor-appointment/individual-doctor-appointment.component";
import { UpcomingappointmentdetailsComponent } from "./individual-doctor-appointment/upcomingappointmentdetails/upcomingappointmentdetails.component";
import { VideocallComponent } from "./individual-doctor-appointment/videocall/videocall.component";
import { IndividualDoctorCommunicationComponent } from "./individual-doctor-communication/individual-doctor-communication.component";
import { IndividualDoctorDashboardComponent } from "./individual-doctor-dashboard/individual-doctor-dashboard.component";
import { IndividualDoctorEntercodeComponent } from "./individual-doctor-entercode/individual-doctor-entercode.component";
import { EprescriptionlistComponent } from "./individual-doctor-eprescription/eprescriptionlist/eprescriptionlist.component";
import { EprescriptionimagingComponent } from "./individual-doctor-eprescription/imaging/eprescriptionimaging/eprescriptionimaging.component";
import { IndividualDoctorEprescriptionComponent } from "./individual-doctor-eprescription/individual-doctor-eprescription.component";
import { EprescriptionlabComponent } from "./individual-doctor-eprescription/lab/eprescriptionlab/eprescriptionlab.component";
import { EprescriptionmedicineComponent } from "./individual-doctor-eprescription/medicines/eprescriptionmedicine/eprescriptionmedicine.component";
import { ValidatemedicineprescriptionComponent } from "./individual-doctor-eprescription/medicines/validatemedicineprescription/validatemedicineprescription.component";
import { IndividualDoctorForgotpassComponent } from "./individual-doctor-forgotpass/individual-doctor-forgotpass.component";
import { IndividualDoctorHeaderComponent } from "./individual-doctor-header/individual-doctor-header.component";
import { IndividualDoctorLeavesComponent } from "./individual-doctor-leaves/individual-doctor-leaves.component";
import { IndividualDoctorLoginComponent } from "./individual-doctor-login/individual-doctor-login.component";
import { IndividualDoctorMainComponent } from "./individual-doctor-main/individual-doctor-main.component";
import { AddtemplateComponent } from "./individual-doctor-master/addtemplate/addtemplate.component";
import { AppointmentreasonsComponent } from "./individual-doctor-master/appointmentreasons/appointmentreasons.component";
import { IndividualDoctorMasterComponent } from "./individual-doctor-master/individual-doctor-master.component";
import { LogsComponent } from "./individual-doctor-master/logs/logs.component";
import { QuestionnaireComponent } from "./individual-doctor-master/questionnaire/questionnaire.component";
import { TemplatebuilderComponent } from "./individual-doctor-master/templatebuilder/templatebuilder.component";
import { IndividualDoctorMydocumentComponent } from "./individual-doctor-mydocument/individual-doctor-mydocument.component";
import { EditprofileComponent } from "./individual-doctor-myprofile/editprofile/editprofile.component";
import { IndividualDoctorMyprofileComponent } from "./individual-doctor-myprofile/individual-doctor-myprofile.component";
import { IndividualDoctorNewpasswordComponent } from "./individual-doctor-newpassword/individual-doctor-newpassword.component";
import { IndividualDoctorNotificationComponent } from "./individual-doctor-notification/individual-doctor-notification.component";
import { IndividualDoctorPatientmanagementComponent } from "./individual-doctor-patientmanagement/individual-doctor-patientmanagement.component";
import { PatientdetailsComponent } from "./individual-doctor-patientmanagement/patientdetails/patientdetails.component";
import { ViewpatientComponent } from "./individual-doctor-patientmanagement/viewpatient/viewpatient.component";
import { IndividualDoctorRatingandreviewComponent } from "./individual-doctor-ratingandreview/individual-doctor-ratingandreview.component";
import { IndividualDoctorRoleandpermisionComponent } from "./individual-doctor-roleandpermision/individual-doctor-roleandpermision.component";
import { SelectroleComponent } from "./individual-doctor-roleandpermision/selectrole/selectrole.component";
import { ViewroleComponent } from "./individual-doctor-roleandpermision/viewrole/viewrole.component";
import { AddstaffComponent } from "./individual-doctor-staffmanagement/addstaff/addstaff.component";
import { IndividualDoctorStaffmanagementComponent } from "./individual-doctor-staffmanagement/individual-doctor-staffmanagement.component";
import { ViewstaffComponent } from "./individual-doctor-staffmanagement/viewstaff/viewstaff.component";
// import { NotFoundComponent } from "src/app/not-found/not-found.component";
import { NotFoundComponent } from "src/app/shared/not-found/not-found.component";
import { AuthGuard } from "src/app/shared/auth-guard";
import { CheckGuard } from "src/app/shared/check.guard";
import { IndividualDoctorViewpdfComponent } from "./individual-doctor-viewpdf/individual-doctor-viewpdf.component";
import { WaitingCalenderComponent } from "./individual-doctor-waitingroom/waiting-calender/waiting-calender.component";
import { WaitingAppointmentListComponent } from "./individual-doctor-waitingroom/waiting-appointment-list/waiting-appointment-list.component";
import { IndividualDoctorWaitingroomComponent } from "./individual-doctor-waitingroom/individual-doctor-waitingroom.component";
import { ValidateTestComponent } from "./individual-doctor-eprescription/lab/validate-test/validate-test.component";
import { ValidateRadiotestComponent } from "./individual-doctor-eprescription/imaging/validate-radiotest/validate-radiotest.component";
import { ViewlabManualResultComponent } from "./individual-doctor-patientmanagement/viewlab-manual-result/viewlab-manual-result.component";
import { AdminAppointmentComponent } from "./admin-appointment/admin-appointment.component";
import { AdminEmrComponent } from "./admin-emr/admin-emr.component";
import { AdminAllDoctorsComponent } from "./admin-all-doctors/admin-all-doctors.component";
import { AdminDashboardComponent } from "./admin-dashboard/admin-dashboard.component";
import { DoctorDetailsComponent } from "./admin-all-doctors/doctor-details/doctor-details.component";
const routes: Routes = [
  { path: "", redirectTo: "login", pathMatch: "full" },
  {
    path: "login",
    component: IndividualDoctorLoginComponent,
  },
  {
    path: "eprescription-viewpdf",
    component: IndividualDoctorViewpdfComponent,
  },
  {
    path: "reset",
    component: IndividualDoctorForgotpassComponent,
  },
  {
    path: "entercode",
    component: IndividualDoctorEntercodeComponent,
  },
  {
    path: "newpassword",
    component: IndividualDoctorNewpasswordComponent,
  },
  {
    path: "header",
    component: IndividualDoctorHeaderComponent,
  },
  {
    path: "",
    component: IndividualDoctorMainComponent,
    canActivate: [AuthGuard],
    children: [
      // {
      //     path: '', redirectTo: 'dashboard', pathMatch: 'full'
      // },
      {
        path: "dashboard",
        component: IndividualDoctorDashboardComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/individual-doctor/dashboard"] },
      },
      {
        path: "myprofile/:id",
        component: IndividualDoctorMyprofileComponent,
        // canActivate: [CheckGuard],
        data: { routing: ["/individual-doctor/myprofile"] },
      },
      {
        path: "editprofile",
        component: EditprofileComponent,
      },
      {
        path: "staffmanagement",
        component: IndividualDoctorStaffmanagementComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/individual-doctor/staffmanagement"] },

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
        path: "roleandpermission",
        component: IndividualDoctorRoleandpermisionComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/individual-doctor/roleandpermission"] },
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
        path: "leaves",
        component: IndividualDoctorLeavesComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/individual-doctor/leaves"] },
      },
      {
        path: "mydocument",
        component: IndividualDoctorMydocumentComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/individual-doctor/mydocument"] },
      },
      {
        path: "notification",
        component: IndividualDoctorNotificationComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/individual-doctor/notification"] },
      },
      {
        path: "templatebuilder",
        component: IndividualDoctorMasterComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/individual-doctor/templatebuilder"] },


        children: [
          {
            path: "",
            component: TemplatebuilderComponent,
          },
          {
            path: "add",
            component: AddtemplateComponent,
          },
          {
            path: "questionnaire",
            component: QuestionnaireComponent,
          },
          {
            path: "appointmentreason",
            component: AppointmentreasonsComponent,
          },
         
        ],
      },
      {
        path: "logs",
        component: LogsComponent,
      },
      {
        path: "ratingandreview",
        component: IndividualDoctorRatingandreviewComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/individual-doctor/ratingandreview"] },
      },
      {
        path: "patientmanagement",
        component: IndividualDoctorPatientmanagementComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/individual-doctor/patientmanagement"] },

        children: [
          {
            path: "",
            component: ViewpatientComponent,
          },         
          {
            path: "details/:id",
            component: PatientdetailsComponent,
          },
          {
            path: "counsultPatientDetails",
            component: PatientdetailsComponent,
          },
          {
            path: "view-lab-results",
            component: ViewlabManualResultComponent,
          },
        ],
      },
      {
        path: "appointment",
        component: IndividualDoctorAppointmentComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/individual-doctor/appointment"] },

        children: [
          {
            path: "",
            component: AppointmentlistComponent,
          },
          // {
          //   path: "details/:id",
          //   component: AppointmentdetailsComponent,
          // },
          {
            path: "appointmentdetails/:id",
            component: UpcomingappointmentdetailsComponent,
          },
          {
            path: "videocall",
            component: VideocallComponent,
          },          
        ],
      },
      {
        path: "eprescription",
        component: IndividualDoctorEprescriptionComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/individual-doctor/eprescription"] },

        children: [
          {
            path: "",
            component: EprescriptionlistComponent,
          },
          {
            path: "eprescriptionmedicine",
            component: EprescriptionmedicineComponent,
          },
          {
            path: "validatemedicineprescription/:id",
            component: ValidatemedicineprescriptionComponent,
          },     
          {
            path: "eprescriptionlab",
            component: EprescriptionlabComponent,
          },
          {
            path: "validate-lab-test/:id",
            component: ValidateTestComponent,
          },
          {
            path: "eprescriptionimaging",
            component: EprescriptionimagingComponent,
          },
          {
            path: "validate-radio-test/:id",
            component: ValidateRadiotestComponent,
          },
        ],
      },
      {
        path: "waiting-room",
        component: IndividualDoctorWaitingroomComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/individual-doctor/waiting-room"] },
        children: [
          {
            path: "",
            component: WaitingAppointmentListComponent,
          },
          {
            path: "calender",
            component: WaitingCalenderComponent,
          },
        ],
      }, 
      {
        path: "communication",
        component: IndividualDoctorCommunicationComponent,
        canActivate: [CheckGuard],
        data: { routing: ["/individual-doctor/communication"] },
      },
      {
        path: "all-appointments",
        component: AdminAppointmentComponent,
        data: { routing: ["/individual-doctor/all-appointments"] },
      },
      {
        path: "emr",
        component: AdminEmrComponent,
        data: { routing: ["/individual-doctor/emr"] },
      },
      {
        path: "all-doctors",
        component: AdminAllDoctorsComponent,
        data: { routing: ["/individual-doctor/all-doctors"] },
        // children: [
        //   {
        //     path: "",
        //     component: AdminAllDoctorsComponent,
        //   },
        //   {
        //     path: "doctor-details/:id",
        //     component: DoctorDetailsComponent,
        //   },
        // ]
      },
      {
        path: "all-doctors/doctor-details/:id",
        component: DoctorDetailsComponent,
        data: { routing: ["individual-doctor/all-doctors/doctor-details/:id"] },
      },
      {
        path: "admin-dashboard",
        component: AdminDashboardComponent,
        data: { routing: ["individual-doctor/admin-dashboard"] },
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
export class IndividualDoctorRoutingModule { }
