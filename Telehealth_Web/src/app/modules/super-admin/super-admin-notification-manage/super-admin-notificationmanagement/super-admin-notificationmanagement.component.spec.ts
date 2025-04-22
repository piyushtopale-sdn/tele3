import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminNotificationmanagementComponent } from './super-admin-notificationmanagement.component';

describe('SuperAdminNotificationmanagementComponent', () => {
  let component: SuperAdminNotificationmanagementComponent;
  let fixture: ComponentFixture<SuperAdminNotificationmanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminNotificationmanagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminNotificationmanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
