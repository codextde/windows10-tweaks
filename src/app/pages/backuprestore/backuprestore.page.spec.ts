import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BackuprestorePage } from './backuprestore.page';

describe('BackuprestorePage', () => {
  let component: BackuprestorePage;
  let fixture: ComponentFixture<BackuprestorePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BackuprestorePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackuprestorePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
