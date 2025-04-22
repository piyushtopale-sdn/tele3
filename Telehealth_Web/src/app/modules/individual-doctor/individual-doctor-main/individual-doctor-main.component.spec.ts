import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorMainComponent } from './individual-doctor-main.component';

describe('IndividualDoctorMainComponent', () => {
  let component: IndividualDoctorMainComponent;
  let fixture: ComponentFixture<IndividualDoctorMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorMainComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
