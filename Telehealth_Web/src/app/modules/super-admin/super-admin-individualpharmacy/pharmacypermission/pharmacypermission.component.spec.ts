import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacypermissionComponent } from './pharmacypermission.component';

describe('PharmacypermissionComponent', () => {
  let component: PharmacypermissionComponent;
  let fixture: ComponentFixture<PharmacypermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacypermissionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacypermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
