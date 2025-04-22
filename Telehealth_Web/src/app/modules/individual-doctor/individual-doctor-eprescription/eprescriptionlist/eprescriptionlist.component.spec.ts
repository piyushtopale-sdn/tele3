import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EprescriptionlistComponent } from './eprescriptionlist.component';

describe('EprescriptionlistComponent', () => {
  let component: EprescriptionlistComponent;
  let fixture: ComponentFixture<EprescriptionlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EprescriptionlistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EprescriptionlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
