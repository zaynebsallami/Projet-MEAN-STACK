import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormSellerComponent } from './form-seller.component';

describe('FormSellerComponent', () => {
  let component: FormSellerComponent;
  let fixture: ComponentFixture<FormSellerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormSellerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormSellerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
