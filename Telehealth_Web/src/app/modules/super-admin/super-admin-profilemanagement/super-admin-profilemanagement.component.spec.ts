import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminProfilemanagementComponent } from './super-admin-profilemanagement.component';

describe('SuperAdminProfilemanagementComponent', () => {
  let component: SuperAdminProfilemanagementComponent;
  let fixture: ComponentFixture<SuperAdminProfilemanagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminProfilemanagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminProfilemanagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
