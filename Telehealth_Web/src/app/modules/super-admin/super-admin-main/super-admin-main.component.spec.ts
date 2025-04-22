import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminMainComponent } from './super-admin-main.component';

describe('SuperAdminMainComponent', () => {
  let component: SuperAdminMainComponent;
  let fixture: ComponentFixture<SuperAdminMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperAdminMainComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperAdminMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
