import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTdriveAssessmentComponent } from './addtdriveassessment.component';

describe('AddtdriveassessmentComponent', () => {
  let component: AddTdriveAssessmentComponent;
  let fixture: ComponentFixture<AddTdriveAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTdriveAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTdriveAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
