import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminRolepermissionComponent } from './super-admin-rolepermission.component';

describe('SuperAdminRolepermissionComponent', () => {
  let component: SuperAdminRolepermissionComponent;
  let fixture: ComponentFixture<SuperAdminRolepermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminRolepermissionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminRolepermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
