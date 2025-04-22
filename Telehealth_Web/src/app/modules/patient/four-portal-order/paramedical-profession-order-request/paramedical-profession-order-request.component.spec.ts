import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParamedicalProfessionOrderRequestComponent } from './paramedical-profession-order-request.component';

describe('ParamedicalProfessionOrderRequestComponent', () => {
  let component: ParamedicalProfessionOrderRequestComponent;
  let fixture: ComponentFixture<ParamedicalProfessionOrderRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParamedicalProfessionOrderRequestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParamedicalProfessionOrderRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
