import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorEntercodeComponent } from './individual-doctor-entercode.component';

describe('IndividualDoctorEntercodeComponent', () => {
  let component: IndividualDoctorEntercodeComponent;
  let fixture: ComponentFixture<IndividualDoctorEntercodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorEntercodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorEntercodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
