import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-activity-permission',
  templateUrl: './activity-permission.component.html',
  styleUrls: ['./activity-permission.component.scss']
})
export class ActivityPermissionComponent {
  constructor(public activeModal: NgbActiveModal) {}

  logout() {
    this.activeModal.close('logout'); // Close and return 'logout' as result
  }

  stay() {
    window.location.reload();
  }
}
