import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMenusPermissionComponent } from './admin-menus-permission.component';

describe('AdminMenusPermissionComponent', () => {
  let component: AdminMenusPermissionComponent;
  let fixture: ComponentFixture<AdminMenusPermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMenusPermissionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminMenusPermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
