import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientUpcommingappointmentComponent } from './patient-upcommingappointment.component';

describe('PatientUpcommingappointmentComponent', () => {
  let component: PatientUpcommingappointmentComponent;
  let fixture: ComponentFixture<PatientUpcommingappointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientUpcommingappointmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientUpcommingappointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
