import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabOrderDashboardComponent } from './lab-order-dashboard.component';

describe('LabOrderDashboardComponent', () => {
  let component: LabOrderDashboardComponent;
  let fixture: ComponentFixture<LabOrderDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabOrderDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabOrderDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
