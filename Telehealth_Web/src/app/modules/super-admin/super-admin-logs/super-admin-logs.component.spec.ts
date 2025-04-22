import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminLogsComponent } from './super-admin-logs.component';

describe('SuperAdminLogsComponent', () => {
  let component: SuperAdminLogsComponent;
  let fixture: ComponentFixture<SuperAdminLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminLogsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
