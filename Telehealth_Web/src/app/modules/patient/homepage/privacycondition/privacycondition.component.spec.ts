import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyconditionComponent } from './privacycondition.component';

describe('PrivacyconditionComponent', () => {
  let component: PrivacyconditionComponent;
  let fixture: ComponentFixture<PrivacyconditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrivacyconditionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivacyconditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
