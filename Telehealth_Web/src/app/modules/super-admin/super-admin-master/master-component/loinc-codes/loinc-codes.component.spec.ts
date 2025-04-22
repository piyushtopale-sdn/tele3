import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoincCodesComponent } from './loinc-codes.component';

describe('LoincCodesComponent', () => {
  let component: LoincCodesComponent;
  let fixture: ComponentFixture<LoincCodesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoincCodesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoincCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
