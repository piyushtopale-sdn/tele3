import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidatemedicineprescriptionComponent } from './validatemedicineprescription.component';

describe('ValidatemedicineprescriptionComponent', () => {
  let component: ValidatemedicineprescriptionComponent;
  let fixture: ComponentFixture<ValidatemedicineprescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ValidatemedicineprescriptionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidatemedicineprescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
