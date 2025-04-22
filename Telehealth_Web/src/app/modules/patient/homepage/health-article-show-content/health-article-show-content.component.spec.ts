import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthArticleShowContentComponent } from './health-article-show-content.component';

describe('HealthArticleShowContentComponent', () => {
  let component: HealthArticleShowContentComponent;
  let fixture: ComponentFixture<HealthArticleShowContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HealthArticleShowContentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthArticleShowContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
