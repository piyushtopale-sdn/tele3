import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminPaymenthistoryComponent } from './super-admin-paymenthistory.component';

describe('SuperAdminPaymenthistoryComponent', () => {
  let component: SuperAdminPaymenthistoryComponent;
  let fixture: ComponentFixture<SuperAdminPaymenthistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminPaymenthistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminPaymenthistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
