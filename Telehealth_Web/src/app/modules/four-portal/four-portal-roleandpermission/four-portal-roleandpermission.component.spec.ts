import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourPortalRoleandpermissionComponent } from './four-portal-roleandpermission.component';

describe('FourPortalRoleandpermissionComponent', () => {
  let component: FourPortalRoleandpermissionComponent;
  let fixture: ComponentFixture<FourPortalRoleandpermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FourPortalRoleandpermissionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FourPortalRoleandpermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
