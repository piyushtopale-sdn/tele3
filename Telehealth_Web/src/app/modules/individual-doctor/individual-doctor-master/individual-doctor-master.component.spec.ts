import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorMasterComponent } from './individual-doctor-master.component';

describe('IndividualDoctorMasterComponent', () => {
  let component: IndividualDoctorMasterComponent;
  let fixture: ComponentFixture<IndividualDoctorMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorMasterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
