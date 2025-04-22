import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const customFieldValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get("password");
  const confirm_password = control.get("confirm_password");
  const terms = control.get("accept_terms");
  let errorFields = {
    not_accept_terms: false,
    confirm_password_not_matched: false,
  };
  errorFields.not_accept_terms = terms.value != true;
  errorFields.confirm_password_not_matched = !(
    password &&
    confirm_password &&
    password.value === confirm_password.value
  );
  if (
    errorFields.confirm_password_not_matched === false &&
    errorFields.not_accept_terms === false
  ) {
    return null;
  }
  return { ...control.errors, ...errorFields };
};
