import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminIndividualdoctorComponent } from './super-admin-individualdoctor.component';

describe('SuperAdminIndividualdoctorComponent', () => {
  let component: SuperAdminIndividualdoctorComponent;
  let fixture: ComponentFixture<SuperAdminIndividualdoctorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminIndividualdoctorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminIndividualdoctorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
