import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorLoginComponent } from './individual-doctor-login.component';

describe('IndividualDoctorLoginComponent', () => {
  let component: IndividualDoctorLoginComponent;
  let fixture: ComponentFixture<IndividualDoctorLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorLoginComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
