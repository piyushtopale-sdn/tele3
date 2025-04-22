import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduledorderComponent } from './scheduledorder.component';

describe('ScheduledorderComponent', () => {
  let component: ScheduledorderComponent;
  let fixture: ComponentFixture<ScheduledorderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScheduledorderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduledorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
