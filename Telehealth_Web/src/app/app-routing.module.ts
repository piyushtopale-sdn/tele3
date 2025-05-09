import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';

const routes: Routes = [
  { path: '', redirectTo: 'test_p/home-ar', pathMatch: 'full' }, 
  {
    path: 'test_p',
    loadChildren: () => import('./modules/patient/patient.module').then((m) => m.PatientModule)
  }, 
  {
    path: 'patient',
    loadChildren: () => import('./modules/patient/patient.module').then((m) => m.PatientModule)
  }, 
  {
    path: 'pharmacy',
    loadChildren: () => import('./modules/pharmacy/pharmacy.module').then((m) => m.PharmacyModule)
  },
  {
    path:"super-admin",
    loadChildren:()=>import('./modules/super-admin/super-admin.module').then((m)=>m.SuperAdminModule)
  },
  {
    path:"individual-doctor",
    loadChildren:()=>import('./modules/individual-doctor/individual-doctor.module').then((m)=>m.IndividualDoctorModule)
  },
  {
    path:"portals",
    loadChildren:()=>import('./modules/four-portal/four-portal.module').then((m)=>m.FourPortalModule)
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
