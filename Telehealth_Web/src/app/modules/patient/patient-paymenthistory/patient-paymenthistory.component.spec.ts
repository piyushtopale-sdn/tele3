import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientPaymenthistoryComponent } from './patient-paymenthistory.component';

describe('PatientPaymenthistoryComponent', () => {
  let component: PatientPaymenthistoryComponent;
  let fixture: ComponentFixture<PatientPaymenthistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientPaymenthistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientPaymenthistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
