import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EprescriptionlabComponent } from './eprescriptionlab.component';

describe('EprescriptionlabComponent', () => {
  let component: EprescriptionlabComponent;
  let fixture: ComponentFixture<EprescriptionlabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EprescriptionlabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EprescriptionlabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
