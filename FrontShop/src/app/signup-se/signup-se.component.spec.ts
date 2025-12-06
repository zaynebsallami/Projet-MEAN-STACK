import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignupSeComponent } from './signup-se.component';

describe('SignupSeComponent', () => {
  let component: SignupSeComponent;
  let fixture: ComponentFixture<SignupSeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignupSeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignupSeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
