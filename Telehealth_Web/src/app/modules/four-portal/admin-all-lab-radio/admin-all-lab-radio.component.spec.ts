import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAllLabRadioComponent } from './admin-all-lab-radio.component';

describe('AdminAllLabRadioComponent', () => {
  let component: AdminAllLabRadioComponent;
  let fixture: ComponentFixture<AdminAllLabRadioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAllLabRadioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAllLabRadioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
