import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminMasterComponent } from './super-admin-master.component';

describe('SuperAdminMasterComponent', () => {
  let component: SuperAdminMasterComponent;
  let fixture: ComponentFixture<SuperAdminMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminMasterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
