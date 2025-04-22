import { TestBed } from '@angular/core/testing';

import { IndiviualDoctorService } from './indiviual-doctor.service';

describe('IndiviualDoctorService', () => {
  let service: IndiviualDoctorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IndiviualDoctorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
