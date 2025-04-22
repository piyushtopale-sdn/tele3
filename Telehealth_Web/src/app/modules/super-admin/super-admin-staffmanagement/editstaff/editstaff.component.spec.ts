import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditstaffComponent } from './editstaff.component';

describe('EditstaffComponent', () => {
  let component: EditstaffComponent;
  let fixture: ComponentFixture<EditstaffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditstaffComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditstaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
