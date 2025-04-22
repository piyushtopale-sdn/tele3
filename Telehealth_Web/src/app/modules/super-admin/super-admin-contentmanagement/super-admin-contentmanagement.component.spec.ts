import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminContentmanagementComponent } from './super-admin-contentmanagement.component';

describe('SuperAdminContentmanagementComponent', () => {
  let component: SuperAdminContentmanagementComponent;
  let fixture: ComponentFixture<SuperAdminContentmanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminContentmanagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminContentmanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
