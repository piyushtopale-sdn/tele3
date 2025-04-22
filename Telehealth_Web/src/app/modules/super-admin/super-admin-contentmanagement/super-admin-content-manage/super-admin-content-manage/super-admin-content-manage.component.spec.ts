import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminContentManageComponent } from './super-admin-content-manage.component';

describe('SuperAdminContentManageComponent', () => {
  let component: SuperAdminContentManageComponent;
  let fixture: ComponentFixture<SuperAdminContentManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SuperAdminContentManageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminContentManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});