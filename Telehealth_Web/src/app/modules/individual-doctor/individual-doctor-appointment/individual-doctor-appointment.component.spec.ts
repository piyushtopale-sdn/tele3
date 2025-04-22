import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorAppointmentComponent } from './individual-doctor-appointment.component';

describe('IndividualDoctorAppointmentComponent', () => {
  let component: IndividualDoctorAppointmentComponent;
  let fixture: ComponentFixture<IndividualDoctorAppointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorAppointmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorAppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
