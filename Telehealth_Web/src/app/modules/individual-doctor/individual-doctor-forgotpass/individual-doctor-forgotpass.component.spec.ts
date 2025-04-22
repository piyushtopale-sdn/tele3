import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorForgotpassComponent } from './individual-doctor-forgotpass.component';

describe('IndividualDoctorForgotpassComponent', () => {
  let component: IndividualDoctorForgotpassComponent;
  let fixture: ComponentFixture<IndividualDoctorForgotpassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorForgotpassComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorForgotpassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
