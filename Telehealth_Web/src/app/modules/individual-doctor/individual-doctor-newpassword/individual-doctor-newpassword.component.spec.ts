import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorNewpasswordComponent } from './individual-doctor-newpassword.component';

describe('IndividualDoctorNewpasswordComponent', () => {
  let component: IndividualDoctorNewpasswordComponent;
  let fixture: ComponentFixture<IndividualDoctorNewpasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorNewpasswordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorNewpasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
