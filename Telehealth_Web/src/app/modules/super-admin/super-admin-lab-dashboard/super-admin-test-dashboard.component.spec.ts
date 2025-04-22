import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminTestDashboardComponent } from './super-admin-test-dashboard.component';

describe('SuperAdminTestDashboardComponent', () => {
  let component: SuperAdminTestDashboardComponent;
  let fixture: ComponentFixture<SuperAdminTestDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminTestDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminTestDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
