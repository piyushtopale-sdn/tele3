import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentmanageComponent } from './documentmanage.component';

describe('DocumentmanageComponent', () => {
  let component: DocumentmanageComponent;
  let fixture: ComponentFixture<DocumentmanageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocumentmanageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentmanageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
