import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLabDashboardComponent } from './admin-lab-dashboard.component';

describe('AdminLabDashboardComponent', () => {
  let component: AdminLabDashboardComponent;
  let fixture: ComponentFixture<AdminLabDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLabDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminLabDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
