import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { PharmacyService } from './pharmacy.service';
import { CoreService } from 'src/app/shared/core.service';
import { SuperAdminService } from '../super-admin/super-admin.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private pharmacyService: PharmacyService,
    private router: Router,
    private coreService: CoreService,
    private sadminServce: SuperAdminService
  ){

  }



  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      let roles = route.data["roles"] as Array<string>;

      if(roles === undefined){
        roles = [""]
      }
  
      let isPurchased = false;
  
      this.checkForPlan(roles).then((res) => {
        isPurchased = Boolean(res[0]);
  
        if (!isPurchased) {
          if(res[1] === 'subscription' ){
            this.coreService.showError(
              "No plan purchsed! Please purches new plan",
              ""
            );
            this.router.navigateByUrl("/pharmacy/pharmacysubscriptionplan");
          }else{
            this.coreService.showError(
              "You cannot access this page without admin permission",
              ""
            );
  
            this.router.navigateByUrl("/pharmacy/404");
          }
  
          // return false;
        } else {
          // this.router.navigateByUrl('/individual-doctor/'+roles[0]);
          // return isPurchased;
        }
      });
  
      return true;
  }

  async checkForPlan(roles: any) {
    return new Promise((resolve, reject) => {
      let isPurchased = false;

      const userData = JSON.parse(localStorage.getItem("loginData"));
      let userID = userData._id;
      this.pharmacyService.isPlanPurchasedByPharmacy(userID).then((res) => {
        isPurchased = res;

        if (isPurchased) {
          const params = {
            module_name: "superadmin",
            user_id: userID,
          };

          this.sadminServce.getUserMenus(params).subscribe(
            (res: any) => {
              const decryptedData = this.coreService.decryptObjectData(res);

              let isPermission = false

              for (const data of decryptedData.body) {
                // mainArray.push(data.menu_id.route_path);
                if (data.menu_id.route_path === roles[0]) {
                  isPermission=true
                }
              }

              resolve([isPermission,'permission']);


              // this.userMenu = menuArray;
            },
            (err) => {
              console.log(err);
            }
          );
        } else {
          resolve([false,'subscription']);
        }
      });
    });
  }
  
}
