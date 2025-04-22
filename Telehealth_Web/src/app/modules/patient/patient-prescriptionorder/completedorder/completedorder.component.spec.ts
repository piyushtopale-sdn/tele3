import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompletedorderComponent } from './completedorder.component';

describe('CompletedorderComponent', () => {
  let component: CompletedorderComponent;
  let fixture: ComponentFixture<CompletedorderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompletedorderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompletedorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
