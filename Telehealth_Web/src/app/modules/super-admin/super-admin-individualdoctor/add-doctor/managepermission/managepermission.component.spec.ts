import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagepermissionComponent } from './managepermission.component';

describe('ManagepermissionComponent', () => {
  let component: ManagepermissionComponent;
  let fixture: ComponentFixture<ManagepermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManagepermissionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagepermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
