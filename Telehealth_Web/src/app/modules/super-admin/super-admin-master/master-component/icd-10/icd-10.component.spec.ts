import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Icd10Component } from './icd-10.component';

describe('Icd10Component', () => {
  let component: Icd10Component;
  let fixture: ComponentFixture<Icd10Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Icd10Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Icd10Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
