// ----------------------------==== SHARED FILE ====---------------------------
// ALL IMPORTS IN SHARED FILES SHOULD NOT PULL FILES FROM THE REST OF THE /API DIRECTORY
// IMPORTS SHOULD BE FROM OTHER FILES IN THE /shared DIRECTORY WHERE THIS FILE LIVES
// OR IMPORTS SHOULD BE FROM LIBRARIES SHARED BY BOTH PROJECTS

export enum Plan {
  none = 'none',
  pro = 'pro-plan',
  max = 'max-plan',
}
