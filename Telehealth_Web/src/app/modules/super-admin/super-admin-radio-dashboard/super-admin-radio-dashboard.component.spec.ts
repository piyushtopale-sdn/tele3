import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminRadioDashboardComponent } from './super-admin-radio-dashboard.component';

describe('SuperAdminRadioDashboardComponent', () => {
  let component: SuperAdminRadioDashboardComponent;
  let fixture: ComponentFixture<SuperAdminRadioDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminRadioDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminRadioDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
