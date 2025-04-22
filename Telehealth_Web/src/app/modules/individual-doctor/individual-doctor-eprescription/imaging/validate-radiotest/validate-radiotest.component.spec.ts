import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidateRadiotestComponent } from './validate-radiotest.component';

describe('ValidateRadiotestComponent', () => {
  let component: ValidateRadiotestComponent;
  let fixture: ComponentFixture<ValidateRadiotestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidateRadiotestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidateRadiotestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
