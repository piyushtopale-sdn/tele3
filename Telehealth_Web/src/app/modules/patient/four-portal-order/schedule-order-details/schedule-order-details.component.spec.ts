import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleOrderDetailsComponent } from './schedule-order-details.component';

describe('ScheduleOrderDetailsComponent', () => {
  let component: ScheduleOrderDetailsComponent;
  let fixture: ComponentFixture<ScheduleOrderDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScheduleOrderDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduleOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
