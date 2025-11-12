// src/constants/messages.ts
export const VALIDATION_MESSAGES = {
  // User Info
  firstNameRequired: "Please enter your first name.",
  lastNameRequired: "Please enter your last name.",
  emailRequired: "Please enter a valid email address.",
  emailInvalid: "The email address is not valid.",
   emailAlreadyExists: "This email is already registered. Please use a different email or login.",
//   passwordRequired: "Please create a password.",
  passwordMinLength: "Password must be at least 8 characters long.",
  passwordPattern: "Password must include letters and numbers.",
passwordRequired: "Please enter your password.", 

  // Company Info
  companyNameRequired: "Please enter your company name.",
  addressRequired: "Please enter your company address.",
  cityRequired: "Please enter your city.",
  zipCodeRequired: "Please enter a 6-digit zip code.",
  zipCodeInvalid: "Zip code must be exactly 6 digits.",
  currencySymbolRequired: "Please enter a currency symbol.",
};