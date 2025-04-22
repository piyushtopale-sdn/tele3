import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminSubscriptionReportComponent } from './super-admin-subscription-report.component';

describe('SuperAdminSubscriptionReportComponent', () => {
  let component: SuperAdminSubscriptionReportComponent;
  let fixture: ComponentFixture<SuperAdminSubscriptionReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminSubscriptionReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminSubscriptionReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
