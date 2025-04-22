import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderPaymentOrderDetailsComponent } from './order-payment-order-details.component';

describe('OrderPaymentOrderDetailsComponent', () => {
  let component: OrderPaymentOrderDetailsComponent;
  let fixture: ComponentFixture<OrderPaymentOrderDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderPaymentOrderDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderPaymentOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
