import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExchangeRefundPolicyComponent } from './exchange-refund-policy.component';

describe('ExchangeRefundPolicyComponent', () => {
  let component: ExchangeRefundPolicyComponent;
  let fixture: ComponentFixture<ExchangeRefundPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExchangeRefundPolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExchangeRefundPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
