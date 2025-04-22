import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaboratorylistComponent } from './laboratorylist.component';

describe('LaboratorylistComponent', () => {
  let component: LaboratorylistComponent;
  let fixture: ComponentFixture<LaboratorylistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LaboratorylistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LaboratorylistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
