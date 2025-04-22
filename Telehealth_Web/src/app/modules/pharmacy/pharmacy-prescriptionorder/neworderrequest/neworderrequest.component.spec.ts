import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NeworderrequestComponent } from './neworderrequest.component';

describe('NeworderrequestComponent', () => {
  let component: NeworderrequestComponent;
  let fixture: ComponentFixture<NeworderrequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NeworderrequestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NeworderrequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
