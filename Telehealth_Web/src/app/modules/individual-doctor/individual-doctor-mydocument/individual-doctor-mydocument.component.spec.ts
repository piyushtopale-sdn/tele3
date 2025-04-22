import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorMydocumentComponent } from './individual-doctor-mydocument.component';

describe('IndividualDoctorMydocumentComponent', () => {
  let component: IndividualDoctorMydocumentComponent;
  let fixture: ComponentFixture<IndividualDoctorMydocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorMydocumentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorMydocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
