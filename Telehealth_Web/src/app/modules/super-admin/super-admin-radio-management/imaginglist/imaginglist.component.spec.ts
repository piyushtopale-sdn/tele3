import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImaginglistComponent } from './imaginglist.component';

describe('ImaginglistComponent', () => {
  let component: ImaginglistComponent;
  let fixture: ComponentFixture<ImaginglistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImaginglistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImaginglistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
