import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminIndividualpharmacyComponent } from './super-admin-individualpharmacy.component';

describe('SuperAdminIndividualpharmacyComponent', () => {
  let component: SuperAdminIndividualpharmacyComponent;
  let fixture: ComponentFixture<SuperAdminIndividualpharmacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminIndividualpharmacyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminIndividualpharmacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
