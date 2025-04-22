import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { Router } from "@angular/router";

@Component({
  selector: "app-videocall",
  templateUrl: "./videocall.component.html",
  styleUrls: ["./videocall.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class VideocallComponent implements OnInit {
  constructor(private modalService: NgbModal, private route: Router) {}

  ngOnInit(): void {}

  // Assessment modal
  openVerticallyCenteredassessment(assessment: any) {
    this.modalService.open(assessment, {
      centered: true,
      size: "lg",
      windowClass: "assessment",
    });
  }

  //  Approved modal
  openVerticallyCenteredstop(stop: any) {
    this.modalService.open(stop, {
      centered: true,
      size: "md",
      windowClass: "stop_consultation",
    });
  }

  //  Shop Notes modal
  openVerticallyCenteredshopnotes(shop_notes: any) {
    this.modalService.open(shop_notes, {
      centered: true,
      size: "md",
      windowClass: "shop_notes",
    });
  }

  //  Add ePrescription modal
  openVerticallyCenteredaddeprescription(add_eprescription: any) {
    this.modalService.open(add_eprescription, {
      centered: true,
      size: "md",
      windowClass: "eprescription",
    });
  }

  //  Claim modal
  openVerticallyCenteredmakeclaim(make_claim: any) {
    this.modalService.open(make_claim, {
      centered: true,
      size: "md",
      windowClass: "make_claim",
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  handleRouting() {
    this.route.navigate(
      ["/individual-doctor/patientmanagement/counsultPatientDetails"],
      {
        queryParams: {
          appointmentId: "64019d756fae087b83d679c0",
          patientId: "63e1f567a825766f5c52b0de",
        },
      }
    );
  }
}
