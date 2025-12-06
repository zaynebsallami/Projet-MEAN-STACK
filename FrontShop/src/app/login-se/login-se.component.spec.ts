  import { ComponentFixture, TestBed } from '@angular/core/testing';

  import { LoginSeComponent } from './login-se.component';

  describe('LoginSeComponent', () => {
    let component: LoginSeComponent;
    let fixture: ComponentFixture<LoginSeComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [LoginSeComponent]
      })
      .compileComponents();

      fixture = TestBed.createComponent(LoginSeComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });
