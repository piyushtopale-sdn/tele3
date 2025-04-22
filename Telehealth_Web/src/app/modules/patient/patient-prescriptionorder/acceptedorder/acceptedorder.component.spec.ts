import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptedorderComponent } from './acceptedorder.component';

describe('AcceptedorderComponent', () => {
  let component: AcceptedorderComponent;
  let fixture: ComponentFixture<AcceptedorderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptedorderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptedorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
