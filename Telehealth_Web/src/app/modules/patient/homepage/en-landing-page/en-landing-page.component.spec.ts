import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnLandingPageComponent } from './en-landing-page.component';

describe('EnLandingPageComponent', () => {
  let component: EnLandingPageComponent;
  let fixture: ComponentFixture<EnLandingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnLandingPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
