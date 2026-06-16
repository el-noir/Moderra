export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** At least one uppercase letter and one digit. */
export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d).+$/;

export const PASSWORD_VALIDATION_MESSAGE =
  'password must be at least 8 characters and include an uppercase letter and a number';
