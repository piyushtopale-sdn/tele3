import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientForgotpassComponent } from './patient-forgotpass.component';

describe('PatientForgotpassComponent', () => {
  let component: PatientForgotpassComponent;
  let fixture: ComponentFixture<PatientForgotpassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientForgotpassComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientForgotpassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
