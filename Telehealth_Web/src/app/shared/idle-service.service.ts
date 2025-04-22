import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { CoreService } from './core.service';
import { PharmacyService } from '../modules/pharmacy/pharmacy.service';
import { SuperAdminService } from '../modules/super-admin/super-admin.service';
import { IndiviualDoctorService } from '../modules/individual-doctor/indiviual-doctor.service';
import { FourPortalService } from '../modules/four-portal/four-portal.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ComponentRef } from '@angular/core';
import { ActivityPermissionComponent } from './activity-permission/activity-permission.component';

@Injectable({
  providedIn: 'root',
})
export class IdleService {
  private idleTimeout: any;
  private readonly IDLE_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
  // private readonly IDLE_TIME = 5000; // 5 seconds
  private modalOpened = false; 

  constructor(
    private authService: AuthService,
    private coreService: CoreService,
    private pharmacyservice: PharmacyService,
    private superadminservice: SuperAdminService,
    private labradioService: FourPortalService,
    private doctorService: IndiviualDoctorService,
    private modalService: NgbModal // Inject NgbModal
  ) {
    // this.resetIdleTimer(); // Start idle timer on initialization
    // this.registerActivityListeners(); // Listen to user activity
  }

  /** Reset idle timer when user interacts */
  // private resetIdleTimer() {
  //   // Clear the previous timeout and set a new one
  //   clearTimeout(this.idleTimeout);
  //   this.idleTimeout = setTimeout(() => this.logoutUser(), this.IDLE_TIME);
  // }

  /** Listen for user activity events */
  // private registerActivityListeners() {
  //   document.addEventListener('mousemove', () => this.resetIdleTimer());
  //   document.addEventListener('keypress', () => this.resetIdleTimer());
  //   document.addEventListener('scroll', () => this.resetIdleTimer());
  //   document.addEventListener('click', () => this.resetIdleTimer());
  // }

  /** Open the logout confirmation popup */
//   private logoutUser() {
//     if (localStorage.getItem('token') && !this.modalOpened) {
//         // Pause the idle timer
//         clearTimeout(this.idleTimeout);
//         this.modalOpened = true;
//         // Open the modal
//         const modalRef = this.modalService.open(ActivityPermissionComponent, { centered: true, backdrop: 'static', keyboard: false  });

//         // Handle modal close
//         modalRef.result.then(
//             (result) => {
//                 if (result === 'logout') {
//                     this.logOutUser(); // Perform logout
//                 } else {
//                     this.resetIdleTimer(); // Restart the idle timer if user stays
//                 }
//                 this.modalOpened = false;
//             },
//             () => { this.resetIdleTimer(); 
//                 this.modalOpened = false;


//             } // Restart timer if modal is dismissed
//         );
//     }
// }

  logOutUser() {
    let role = localStorage.getItem('role');

    if (role === 'super-admin') {
      this.superadminservice.logoutApi().subscribe((res) => {
        let encryptedData = { data: res };
        let response = this.coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.coreService.showSuccess('', response.message);
          this.authService.logout('/super-admin/login');
        }
      });
    } else if (role === 'individual-doctor') {
      this.doctorService.userLogoutAPI().subscribe((res) => {
        let encryptedData = { data: res };
        let response = this.coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.coreService.showSuccess('', response.message);
          this.authService.logout('/individual-doctor/login');
        }
      });
    } else if (role === 'pharmacy') {
      this.pharmacyservice.logOutUserApi().subscribe((res) => {
        let encryptedData = { data: res };
        let response = this.coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.coreService.showSuccess('', response.message);
          this.authService.logout('/pharmacy/login');
        }
      });
    } else if (role === 'portals') {
      this.labradioService.logOutUserApi().subscribe((res) => {
        let encryptedData = { data: res };
        let response = this.coreService.decryptObjectData(encryptedData);
        if (response.status) {
          this.coreService.showSuccess('', response.message);
          let type = localStorage.getItem('type');
          if (type === 'Radiology') {
            this.authService.logout('/portals/login/Radiology');
          } else {
            this.authService.logout('/portals/login/Laboratory');
          }
        }
      });
    }
  }
}
