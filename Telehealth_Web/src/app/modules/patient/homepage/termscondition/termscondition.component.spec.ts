import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsconditionComponent } from './termscondition.component';

describe('TermsconditionComponent', () => {
  let component: TermsconditionComponent;
  let fixture: ComponentFixture<TermsconditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TermsconditionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TermsconditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
