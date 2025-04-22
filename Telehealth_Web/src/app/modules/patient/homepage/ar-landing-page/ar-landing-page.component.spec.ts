import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArLandingPageComponent } from './ar-landing-page.component';

describe('ArLandingPageComponent', () => {
  let component: ArLandingPageComponent;
  let fixture: ComponentFixture<ArLandingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArLandingPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
