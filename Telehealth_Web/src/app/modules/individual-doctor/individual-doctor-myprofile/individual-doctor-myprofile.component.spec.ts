import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorMyprofileComponent } from './individual-doctor-myprofile.component';

describe('IndividualDoctorMyprofileComponent', () => {
  let component: IndividualDoctorMyprofileComponent;
  let fixture: ComponentFixture<IndividualDoctorMyprofileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorMyprofileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorMyprofileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
