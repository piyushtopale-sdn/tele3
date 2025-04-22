import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorStaffmanagementComponent } from './individual-doctor-staffmanagement.component';

describe('IndividualDoctorStaffmanagementComponent', () => {
  let component: IndividualDoctorStaffmanagementComponent;
  let fixture: ComponentFixture<IndividualDoctorStaffmanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorStaffmanagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorStaffmanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
