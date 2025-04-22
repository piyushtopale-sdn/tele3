import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminEntercodeComponent } from './super-admin-entercode.component';

describe('SuperAdminEntercodeComponent', () => {
  let component: SuperAdminEntercodeComponent;
  let fixture: ComponentFixture<SuperAdminEntercodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminEntercodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminEntercodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
