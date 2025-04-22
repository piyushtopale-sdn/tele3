import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagingpermissionComponent } from './imagingpermission.component';

describe('ImagingpermissionComponent', () => {
  let component: ImagingpermissionComponent;
  let fixture: ComponentFixture<ImagingpermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImagingpermissionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImagingpermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
