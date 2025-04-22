import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualDoctorViewpdfComponent } from './individual-doctor-viewpdf.component';

describe('IndividualDoctorViewpdfComponent', () => {
  let component: IndividualDoctorViewpdfComponent;
  let fixture: ComponentFixture<IndividualDoctorViewpdfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndividualDoctorViewpdfComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualDoctorViewpdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
