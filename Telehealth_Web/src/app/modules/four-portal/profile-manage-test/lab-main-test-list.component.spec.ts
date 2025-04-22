import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabMainTestListComponent } from './lab-main-test-list.component';

describe('LabMainTestListComponent', () => {
  let component: LabMainTestListComponent;
  let fixture: ComponentFixture<LabMainTestListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabMainTestListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabMainTestListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
