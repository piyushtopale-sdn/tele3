import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperadminTestsBillingReportComponent } from './superadmin-tests-billing-report.component';

describe('SuperadminTestsBillingReportComponent', () => {
  let component: SuperadminTestsBillingReportComponent;
  let fixture: ComponentFixture<SuperadminTestsBillingReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperadminTestsBillingReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperadminTestsBillingReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
