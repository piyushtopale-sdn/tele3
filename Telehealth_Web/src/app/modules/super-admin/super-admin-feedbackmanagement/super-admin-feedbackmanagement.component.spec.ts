import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminFeedbackmanagementComponent } from './super-admin-feedbackmanagement.component';

describe('SuperAdminFeedbackmanagementComponent', () => {
  let component: SuperAdminFeedbackmanagementComponent;
  let fixture: ComponentFixture<SuperAdminFeedbackmanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminFeedbackmanagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminFeedbackmanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
