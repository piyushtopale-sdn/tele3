import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaboratorypermissionComponent } from './laboratorypermission.component';

describe('LaboratorypermissionComponent', () => {
  let component: LaboratorypermissionComponent;
  let fixture: ComponentFixture<LaboratorypermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LaboratorypermissionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LaboratorypermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
