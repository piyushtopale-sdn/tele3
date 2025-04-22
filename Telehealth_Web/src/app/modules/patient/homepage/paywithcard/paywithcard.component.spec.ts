import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaywithcardComponent } from './paywithcard.component';

describe('PaywithcardComponent', () => {
  let component: PaywithcardComponent;
  let fixture: ComponentFixture<PaywithcardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaywithcardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaywithcardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
