import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorPatientmanagementComponent } from './individual-doctor-patientmanagement.component';

describe('IndividualDoctorPatientmanagementComponent', () => {
  let component: IndividualDoctorPatientmanagementComponent;
  let fixture: ComponentFixture<IndividualDoctorPatientmanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorPatientmanagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorPatientmanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
