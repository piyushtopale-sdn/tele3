import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { IndiviualDoctorService } from '../modules/individual-doctor/indiviual-doctor.service';
import { CoreService } from './core.service';
import { SuperAdminService } from '../modules/super-admin/super-admin.service';
import { PatientService } from '../modules/patient/patient.service';
import { PharmacyService } from '../modules/pharmacy/pharmacy.service';
import { Location } from "@angular/common";
import { FourPortalService } from '../modules/four-portal/four-portal.service';


@Injectable({
  providedIn: 'root'
})
export class CheckGuard implements CanActivate {
  user: any;
  role: any;
  menuSelected: any = "";
  userID: any = ""
  portalUserId: any = ""
  type: string;
  loginRole: any;
  usertype: string;

  constructor(
    private router: Router,
    private location: Location,
    private fourPortalService: FourPortalService,
    private doctorService: IndiviualDoctorService,
    private coreService: CoreService,
    private sadminServce: SuperAdminService,
    private patientService: PatientService,
    private pharmacyService: PharmacyService,
  ) {

  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {


    const loginData = JSON.parse(localStorage.getItem("loginData"));

    const adminData = JSON.parse(localStorage.getItem("adminData"));

    this.portalUserId = loginData?._id
    this.loginRole = loginData?.role
    if (loginData?.role === 'INDIVIDUAL_DOCTOR') this.userID = loginData?._id;
    if (loginData?.role === 'INDIVIDUAL_DOCTOR_ADMIN') this.userID = loginData?._id;
    if (loginData?.role === 'INDIVIDUAL_DOCTOR_STAFF') this.userID = adminData?.in_hospital;
    if (loginData?.role === 'PHARMACY_ADMIN') this.userID = loginData?._id;
    if (loginData?.role === 'PHARMACY_STAFF') this.userID = adminData?.for_staff;
    if (loginData?.role === 'INDIVIDUAL' && (loginData?.type === 'Laboratory' || loginData?.type === 'Radiology')) this.userID = loginData?._id;
    if (loginData?.role === 'STAFF' && (loginData?.type === 'Laboratory' || loginData?.type === 'Radiology')) this.userID = adminData?.creatorId;




    this.user = localStorage.getItem("token");
    this.role = localStorage.getItem("role");
    this.usertype = localStorage.getItem("type");
    this.type = loginData?.type

    let splitForPatient = this.location.path().split("/");
    let urlPath = this.location.path();


    if (splitForPatient[1] == this.role) {
      let routing = route.data['routing'] as Array<string>;

      if (routing === undefined) {
        // routing = ['/'+this.role + "/dashboard"];
        routing = [urlPath];
      }

      this.checkForPlan(routing[0], this.role).then((res) => {

        let redirectURL = "";
        let redirectURL404 = "";

        if (this.role === "pharmacy") {
          redirectURL = "pharmacy/dashboard";
          redirectURL404 = "pharmacy/404";
        } else if (this.role === "portals") {

          if(this.type === 'Laboratory'){

            redirectURL = `/portals/lab-dashboard/${this.type}`;
          }else{
            redirectURL = `/portals/radio-dashboard/${this.type}`;

          }

          redirectURL404 = "portals/404";
        } else if (this.role === 'super-admin') {
          redirectURL = `**`;
          redirectURL404 = "super-admin/404";
        }
        else {
          redirectURL = this.role + "/dashboard";
          redirectURL404 = this.role + "/404";
        }
      });


      return true;
    } else {
      return this.router.createUrlTree([""]);
    }
  }


  async checkForPlan(routing: any, checkForRole: any) {
    return new Promise((resolve, reject) => {

      switch (checkForRole) {
        case "portals":
          if (this.loginRole === 'INDIVIDUAL' || this.loginRole === 'STAFF') {
            const params = {
              module_name: "superadmin",
              user_id: this.portalUserId,
            };

            this.sadminServce.getUserMenus(params).subscribe(
              (res: any) => {
                const decryptedData = this.coreService.decryptObjectData(res);
                let isPermission = false;

                for (const data of decryptedData.body) {

                  if (data.menu_id.route_path === routing + '/' + this.type) {
                    if (data.menu_id.parent_id == '0') {

                      sessionStorage.setItem('currentPageMenuID', data.menu_id._id)

                    } else {
                      sessionStorage.setItem('currentPageMenuID', data.menu_id.parent_id)

                    }

                    isPermission = true;
                  }
                }

                resolve([isPermission, "permission"]);

                // this.userMenu = menuArray;
              },
              (err) => {
                console.log(err);
              }
            );
          }
          break;
        case "individual-doctor":
          const params1 = {
            module_name: "superadmin",
            user_id: this.portalUserId,
          };

          this.sadminServce.getUserMenus(params1).subscribe(
            (res: any) => {
              const decryptedData = this.coreService.decryptObjectData(res);

              let isPermission = false;

              for (const data of decryptedData.body) {

                if (data.menu_id.route_path === routing) {

                  if (data.menu_id.parent_id == '0') {

                    sessionStorage.setItem('currentPageMenuID', data.menu_id._id)

                  } else {
                    sessionStorage.setItem('currentPageMenuID', data.menu_id.parent_id)

                  }
                  isPermission = true;
                }
              }

              resolve([isPermission, "permission"]);

              // this.userMenu = menuArray;
            },
            (err) => {
              console.log(err);
            }
          );
          break;

        case "pharmacy":

          const param = {
            module_name: "superadmin",
            user_id: this.portalUserId,
          };

          this.sadminServce.getUserMenus(param).subscribe(
            (res: any) => {
              const decryptedData = this.coreService.decryptObjectData(res);

              let isPermission = false;

              for (const data of decryptedData.body) {

                if (data.menu_id.route_path === routing) {

                  if (data.menu_id.parent_id == '0') {

                    sessionStorage.setItem('currentPageMenuID', data.menu_id._id)

                  } else {
                    sessionStorage.setItem('currentPageMenuID', data.menu_id.parent_id)

                  }

                  isPermission = true;
                }
              }

              resolve([isPermission, "permission"]);

              // this.userMenu = menuArray;
            },
            (err) => {
              console.log(err);
            }
          );

          break;

        case "super-admin":
          const params = {
            module_name: "superadmin",
            user_id: this.portalUserId,
          };

          this.sadminServce.getUserMenus(params).subscribe(
            (res: any) => {
              const decryptedData =
                this.coreService.decryptObjectData(res);

              let isPermission = false;

              for (const data of decryptedData.body) {
                // mainArray.push(data.menu_id.route_path);

                if (data.menu_id.route_path === routing || data.menu_id.route_path.includes(routing)) {

                  // sessionStorage.setItem('previousRouting', JSON.stringify(routing))

                  if (data.menu_id.parent_id == '0') {

                    sessionStorage.setItem('currentPageMenuID', data.menu_id._id)

                  } else {
                    sessionStorage.setItem('currentPageMenuID', data.menu_id.parent_id)

                  }


                  isPermission = true;
                }
              }

              resolve([isPermission, "permission"]);

              // this.userMenu = menuArray;
            },
            (err) => {
              console.log(err);
            }
          );


          break;

        default:
          break;
      }
    });
  }

}
