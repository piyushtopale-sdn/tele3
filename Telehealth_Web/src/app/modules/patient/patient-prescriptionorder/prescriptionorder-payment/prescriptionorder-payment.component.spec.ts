import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionorderPaymentComponent } from './prescriptionorder-payment.component';

describe('PrescriptionorderPaymentComponent', () => {
  let component: PrescriptionorderPaymentComponent;
  let fixture: ComponentFixture<PrescriptionorderPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrescriptionorderPaymentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrescriptionorderPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
