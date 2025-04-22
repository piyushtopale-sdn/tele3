import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

export interface PeriodicElement {
  medicine: string;
  packorunit: string;
  frequency: string;
  duration: number;
}

const ELEMENT_DATA: PeriodicElement[] = [
  { medicine: 'Augmentin 625 Duo Tablet',packorunit: '1 (Packs)', frequency:'Morning 2, MidDay 2',duration : 2},
  { medicine: 'Augmentin 625 Duo Tablet',packorunit: '1 (Packs)', frequency:'Morning 2, MidDay 2',duration : 2},
  { medicine: 'Augmentin 625 Duo Tablet',packorunit: '1 (Packs)', frequency:'Morning 2, MidDay 2',duration : 2},
  { medicine: 'Augmentin 625 Duo Tablet',packorunit: '1 (Packs)', frequency:'Morning 2, MidDay 2',duration : 2},
  { medicine: 'Augmentin 625 Duo Tablet',packorunit: '1 (Packs)', frequency:'Morning 2, MidDay 2',duration : 2},
  { medicine: 'Augmentin 625 Duo Tablet',packorunit: '1 (Packs)', frequency:'Morning 2, MidDay 2',duration : 2},
 
];


@Component({
  selector: 'app-pastappointment',
  templateUrl: './pastappointment.component.html',
  styleUrls: ['./pastappointment.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class PastappointmentComponent implements OnInit {
  displayedColumns: string[] = ['medicine', 'packorunit', 'frequency','duration'];
  dataSource = ELEMENT_DATA;

  constructor(private modalService: NgbModal) {
    
  }

  //  Delete modal
  openVerticallyCentereddetale(addsecondsubsriber: any) {
    this.modalService.open(addsecondsubsriber, { centered: true,size: 'md'});
    }

  //  Add healthcare network modal
  openVerticallyCenteredcancelappointmentcontent(cancelappointmentcontent: any) {
    this.modalService.open(cancelappointmentcontent, { centered: true,size: 'md' });
  }

  // Remainder Modal
  openVerticallyCenteredremainder(remaindermodal: any) {
    this.modalService.open(remaindermodal, { centered: true,size:'' });
  }

  ngOnInit(): void {
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

  myFilter = (d: Date | null): boolean => {
    // const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    // return day !== 0 && day !== 6;
    return true;
  };
}
