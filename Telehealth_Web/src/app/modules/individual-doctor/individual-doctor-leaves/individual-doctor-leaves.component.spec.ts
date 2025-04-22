import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorLeavesComponent } from './individual-doctor-leaves.component';

describe('IndividualDoctorLeavesComponent', () => {
  let component: IndividualDoctorLeavesComponent;
  let fixture: ComponentFixture<IndividualDoctorLeavesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorLeavesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorLeavesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
