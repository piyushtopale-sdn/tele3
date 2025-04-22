import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityPermissionComponent } from './activity-permission.component';

describe('ActivityPermissionComponent', () => {
  let component: ActivityPermissionComponent;
  let fixture: ComponentFixture<ActivityPermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityPermissionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityPermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
