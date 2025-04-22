import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelledorderComponent } from './cancelledorder.component';

describe('CancelledorderComponent', () => {
  let component: CancelledorderComponent;
  let fixture: ComponentFixture<CancelledorderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CancelledorderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CancelledorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
