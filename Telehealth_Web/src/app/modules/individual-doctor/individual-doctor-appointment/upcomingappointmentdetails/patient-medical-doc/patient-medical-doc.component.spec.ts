import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientMedicalDocComponent } from './patient-medical-doc.component';

describe('PatientMedicalDocComponent', () => {
  let component: PatientMedicalDocComponent;
  let fixture: ComponentFixture<PatientMedicalDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientMedicalDocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientMedicalDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
