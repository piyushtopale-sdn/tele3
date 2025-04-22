import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PastappointmentComponent } from './pastappointment.component';

describe('PastappointmentComponent', () => {
  let component: PastappointmentComponent;
  let fixture: ComponentFixture<PastappointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PastappointmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PastappointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
