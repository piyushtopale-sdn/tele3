import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabConfigListComponent } from './lab-config-list.component';

describe('LabConfigListComponent', () => {
  let component: LabConfigListComponent;
  let fixture: ComponentFixture<LabConfigListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabConfigListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabConfigListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
