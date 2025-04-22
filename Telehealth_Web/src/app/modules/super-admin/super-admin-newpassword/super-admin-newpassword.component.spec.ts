import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminNewpasswordComponent } from './super-admin-newpassword.component';

describe('SuperAdminNewpasswordComponent', () => {
  let component: SuperAdminNewpasswordComponent;
  let fixture: ComponentFixture<SuperAdminNewpasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminNewpasswordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminNewpasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
