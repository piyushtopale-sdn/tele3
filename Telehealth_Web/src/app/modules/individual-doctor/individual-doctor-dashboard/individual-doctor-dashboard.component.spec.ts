import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorDashboardComponent } from './individual-doctor-dashboard.component';

describe('IndividualDoctorDashboardComponent', () => {
  let component: IndividualDoctorDashboardComponent;
  let fixture: ComponentFixture<IndividualDoctorDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
