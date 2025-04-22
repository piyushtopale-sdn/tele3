import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoyasarPaymentComponent } from './moyasar-payment.component';

describe('MoyasarPaymentComponent', () => {
  let component: MoyasarPaymentComponent;
  let fixture: ComponentFixture<MoyasarPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoyasarPaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoyasarPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
