import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminQuestionaireManagementComponent } from './super-admin-questionaire-management.component';

describe('SuperAdminQuestionaireManagementComponent', () => {
  let component: SuperAdminQuestionaireManagementComponent;
  let fixture: ComponentFixture<SuperAdminQuestionaireManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminQuestionaireManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminQuestionaireManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
