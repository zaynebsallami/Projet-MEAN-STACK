import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoutiqueSellerComponent } from './boutique-seller.component';

describe('BoutiqueSellerComponent', () => {
  let component: BoutiqueSellerComponent;
  let fixture: ComponentFixture<BoutiqueSellerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoutiqueSellerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoutiqueSellerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
