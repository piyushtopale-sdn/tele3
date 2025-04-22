import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectroleComponent } from './selectrole.component';

describe('SelectroleComponent', () => {
  let component: SelectroleComponent;
  let fixture: ComponentFixture<SelectroleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectroleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectroleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
