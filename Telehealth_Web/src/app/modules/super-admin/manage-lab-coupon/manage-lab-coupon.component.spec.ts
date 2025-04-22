import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageLabCouponComponent } from './manage-lab-coupon.component';

describe('ManageLabCouponComponent', () => {
  let component: ManageLabCouponComponent;
  let fixture: ComponentFixture<ManageLabCouponComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageLabCouponComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageLabCouponComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
