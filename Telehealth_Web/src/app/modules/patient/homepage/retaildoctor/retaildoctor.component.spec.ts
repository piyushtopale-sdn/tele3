import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetaildoctorComponent } from './retaildoctor.component';

describe('RetaildoctorComponent', () => {
  let component: RetaildoctorComponent;
  let fixture: ComponentFixture<RetaildoctorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetaildoctorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RetaildoctorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
