import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitingAppointmentListComponent } from './waiting-appointment-list.component';

describe('WaitingAppointmentListComponent', () => {
  let component: WaitingAppointmentListComponent;
  let fixture: ComponentFixture<WaitingAppointmentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaitingAppointmentListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaitingAppointmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
