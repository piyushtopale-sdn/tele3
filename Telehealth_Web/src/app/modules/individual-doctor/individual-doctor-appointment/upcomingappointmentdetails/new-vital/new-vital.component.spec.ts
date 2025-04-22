import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewVitalComponent } from './new-vital.component';

describe('NewVitalComponent', () => {
  let component: NewVitalComponent;
  let fixture: ComponentFixture<NewVitalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewVitalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewVitalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
