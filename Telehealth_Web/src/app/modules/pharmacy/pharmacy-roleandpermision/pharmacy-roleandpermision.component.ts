import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';

export interface PeriodicElement {
  sectionname: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  // { sectionname: 'View'},
  // { sectionname: 'Add'},
  // { sectionname: 'Delete'},
  // { sectionname: 'Edit'},
];

@Component({
  selector: 'app-pharmacy-roleandpermision',
  templateUrl: './pharmacy-roleandpermision.component.html',
  styleUrls: ['./pharmacy-roleandpermision.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class PharmacyRoleandpermisionComponent implements OnInit {
  displayedColumns: string[] = ['sectionname', 'selectall'];
  dataSource = ELEMENT_DATA;

  panelOpenState = false;

  constructor(private modalService: NgbModal, private router:Router) {
    
  }

  ngOnInit(): void {
  }

      openVerticallyCenteredpermission_commit(Prescriptions: any) {
        this.modalService.open(Prescriptions, { centered: true,size: 'md',windowClass : "permission_commit" });
      }


       openVerticallyCenteredsubscription_commit(Subscription: any) {
        this.modalService.open(Subscription, { centered: true,size: 'md',windowClass : "permission_commit" });
      }


         openVerticallyCenteredstaffmanagement_commit(staffmanagement: any) {
          this.modalService.open(staffmanagement, { centered: true,size: 'md',windowClass : "permission_commit" });
        }

          
              openVerticallyCenteredrevenuemanagement_commit(revenuemanagement: any) {
                this.modalService.open(revenuemanagement, { centered: true,size: 'md',windowClass : "permission_commit" });
              }

              openVerticallyCenteredmedicineclaims_commit(medicineclaims: any) {
                this.modalService.open(medicineclaims, { centered: true,size: 'md',windowClass : "permission_commit" });
              }

              openVerticallyCenteredpaymenthistory_commit(paymenthistory: any) {
                this.modalService.open(paymenthistory, { centered: true,size: 'md',windowClass : "permission_commit" });
              }

              openVerticallyCenteredpaymentratingandreviews_commit(ratingandreviews: any) {
                this.modalService.open(ratingandreviews, { centered: true,size: 'md',windowClass : "permission_commit" });
              }
              

              openVerticallyCenteredpaymentCommunication_commit(Communication: any) {
                this.modalService.open(Communication, { centered: true,size: 'md',windowClass : "permission_commit" });
              }

              openVerticallyCenteredpaymentmailbox_commit(mailbox: any) {
                this.modalService.open(mailbox, { centered: true,size: 'md',windowClass : "permission_commit" });
              }

              openVerticallyCenteredpaymentlogs_commit(logs: any) {
                this.modalService.open(logs, { centered: true,size: 'md',windowClass : "permission_commit" });
              }

              openVerticallyCenteredpaymentcomplaintmanagement_commit(complaintmanagement: any) {
                this.modalService.open(complaintmanagement, { centered: true,size: 'md',windowClass : "permission_commit" });
              }

              openVerticallyCenteredpaymentmedicalproductstests_commit(medicalproductstests: any) {
                this.modalService.open(medicalproductstests, { centered: true,size: 'md',windowClass : "permission_commit" });
              }


              
              
              
              navigate(){
                this.router.navigateByUrl('/pharmacy/roleandpermission/view')
              }
            
              
              
              
      
        

      private getDismissReason(reason: any): string {
        if (reason === ModalDismissReasons.ESC) {
          return 'by pressing ESC';
        } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
          return 'by clicking on a backdrop';
        } else {
          return `with: ${reason}`;
        }
      }

}
