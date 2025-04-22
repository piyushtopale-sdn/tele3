import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppopintmentListComponent } from './appopintment-list.component';

describe('AppopintmentListComponent', () => {
  let component: AppopintmentListComponent;
  let fixture: ComponentFixture<AppopintmentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppopintmentListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppopintmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
