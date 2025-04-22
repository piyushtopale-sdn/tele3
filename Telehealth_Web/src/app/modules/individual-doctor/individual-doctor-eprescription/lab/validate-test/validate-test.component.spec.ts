import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidateTestComponent } from './validate-test.component';

describe('ValidateTestComponent', () => {
  let component: ValidateTestComponent;
  let fixture: ComponentFixture<ValidateTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidateTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidateTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
