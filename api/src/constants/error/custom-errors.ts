export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly isOperational: boolean = true,
  ) {
    super(message);
  }
}

export class StoryNotFoundError extends AppError {
  constructor() {
    super(404, 'Story not found');
  }
}
export class CannonNotFoundError extends AppError {
  constructor() {
    super(404, 'Cannon not found');
  }
}
export class DocumentNotFoundError extends AppError {
  constructor() {
    super(404, 'Document not found');
  }
}
export class InvalidSelectionError extends AppError {
  constructor() {
    super(400, 'Invalid selection range');
  }
}
export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, 'Invalid email or password');
  }
}
export class UserNotFoundError extends AppError {
  constructor() {
    super(404, 'User not found');
  }
}
export class EmailTakenError extends AppError {
  constructor() {
    super(409, 'Email already taken');
  }
}
export class StripePaymentFailed extends AppError {
  constructor() {
    super(402, 'Payment failed');
  }
}
