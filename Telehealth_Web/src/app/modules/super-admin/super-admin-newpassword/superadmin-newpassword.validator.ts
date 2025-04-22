import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const customFieldValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const newPassword = control.get("newPassword");
  const confirmPassword = control.get("confirmPassword");
  const terms = control.get("accept_terms");
  let errorFields = {
    // not_accept_terms: false,
    confirmPassword_not_matched: false,
  };
  // errorFields.not_accept_terms = terms.value != true;
  errorFields.confirmPassword_not_matched = !(
    newPassword &&
    confirmPassword &&
    newPassword.value === confirmPassword.value
  );
  if (
    errorFields.confirmPassword_not_matched === false 
    // errorFields.not_accept_terms === false
  ) {
    return null;
  }
  return { ...control.errors, ...errorFields };
};
