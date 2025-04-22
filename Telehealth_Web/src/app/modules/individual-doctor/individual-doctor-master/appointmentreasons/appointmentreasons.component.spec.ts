import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentreasonsComponent } from './appointmentreasons.component';

describe('AppointmentreasonsComponent', () => {
  let component: AppointmentreasonsComponent;
  let fixture: ComponentFixture<AppointmentreasonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppointmentreasonsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppointmentreasonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
