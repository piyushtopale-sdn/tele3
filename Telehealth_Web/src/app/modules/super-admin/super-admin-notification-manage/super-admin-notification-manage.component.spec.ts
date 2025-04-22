import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminNotificationManageComponent } from './super-admin-notification-manage.component';

describe('SuperAdminNotificationManageComponent', () => {
  let component: SuperAdminNotificationManageComponent;
  let fixture: ComponentFixture<SuperAdminNotificationManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminNotificationManageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminNotificationManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
