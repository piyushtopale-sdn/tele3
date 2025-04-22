import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminIndividuallaboratoryComponent } from './super-admin-individuallaboratory.component';

describe('SuperAdminIndividuallaboratoryComponent', () => {
  let component: SuperAdminIndividuallaboratoryComponent;
  let fixture: ComponentFixture<SuperAdminIndividuallaboratoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminIndividuallaboratoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminIndividuallaboratoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
