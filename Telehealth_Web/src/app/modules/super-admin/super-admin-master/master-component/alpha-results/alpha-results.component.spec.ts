import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlphaResultsComponent } from './alpha-results.component';

describe('AlphaResultsComponent', () => {
  let component: AlphaResultsComponent;
  let fixture: ComponentFixture<AlphaResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlphaResultsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlphaResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
