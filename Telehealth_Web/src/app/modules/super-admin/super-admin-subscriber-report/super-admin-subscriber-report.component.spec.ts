import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminSubscriberReportComponent } from './super-admin-subscriber-report.component';

describe('SuperAdminSubscriberReportComponent', () => {
  let component: SuperAdminSubscriberReportComponent;
  let fixture: ComponentFixture<SuperAdminSubscriberReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminSubscriberReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminSubscriberReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
