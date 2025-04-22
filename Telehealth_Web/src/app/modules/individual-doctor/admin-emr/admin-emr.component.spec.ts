import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEmrComponent } from './admin-emr.component';

describe('AdminEmrComponent', () => {
  let component: AdminEmrComponent;
  let fixture: ComponentFixture<AdminEmrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEmrComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminEmrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
