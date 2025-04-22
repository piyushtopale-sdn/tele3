import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeOfStudyComponent } from './type-of-study.component';

describe('TypeOfStudyComponent', () => {
  let component: TypeOfStudyComponent;
  let fixture: ComponentFixture<TypeOfStudyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeOfStudyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypeOfStudyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
