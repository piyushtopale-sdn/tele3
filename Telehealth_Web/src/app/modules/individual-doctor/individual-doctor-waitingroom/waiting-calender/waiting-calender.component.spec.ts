import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitingCalenderComponent } from './waiting-calender.component';

describe('WaitingCalenderComponent', () => {
  let component: WaitingCalenderComponent;
  let fixture: ComponentFixture<WaitingCalenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaitingCalenderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaitingCalenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
