import { Injectable } from "@angular/core";
import { Location } from "@angular/common";
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { Subscription } from "rxjs";


@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  user: any;
  role: any;
  menuSubscription: Subscription;
  menuSelected: any = "";
  userID :any=""
  portalUserId:any=""
  type: string;


  constructor(
    private router: Router,
    private location: Location,
  ) {

  
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    this.user = localStorage.getItem("token");
    this.role = localStorage.getItem("role");
    this.type = localStorage.getItem("type");


    let splitForPatient = this.location.path().split('/');

    if(splitForPatient[1] == this.role){
        return true;
    }else{
        return this.router.createUrlTree([""]);
    }
  }


}
