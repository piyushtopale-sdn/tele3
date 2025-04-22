import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewroleComponent } from './viewrole.component';

describe('ViewroleComponent', () => {
  let component: ViewroleComponent;
  let fixture: ComponentFixture<ViewroleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewroleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewroleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
