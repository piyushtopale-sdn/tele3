import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientMyaccountComponent } from './patient-myaccount.component';

describe('PatientMyaccountComponent', () => {
  let component: PatientMyaccountComponent;
  let fixture: ComponentFixture<PatientMyaccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientMyaccountComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientMyaccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
