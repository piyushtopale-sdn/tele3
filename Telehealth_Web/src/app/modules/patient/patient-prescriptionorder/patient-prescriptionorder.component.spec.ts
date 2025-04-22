import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientPrescriptionorderComponent } from './patient-prescriptionorder.component';

describe('PatientPrescriptionorderComponent', () => {
  let component: PatientPrescriptionorderComponent;
  let fixture: ComponentFixture<PatientPrescriptionorderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientPrescriptionorderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientPrescriptionorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
