import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorEprescriptionComponent } from './individual-doctor-eprescription.component';

describe('IndividualDoctorEprescriptionComponent', () => {
  let component: IndividualDoctorEprescriptionComponent;
  let fixture: ComponentFixture<IndividualDoctorEprescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorEprescriptionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorEprescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
