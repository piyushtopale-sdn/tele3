import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientMyappointmentComponent } from './patient-myappointment.component';

describe('PatientMyappointmentComponent', () => {
  let component: PatientMyappointmentComponent;
  let fixture: ComponentFixture<PatientMyappointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientMyappointmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientMyappointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
